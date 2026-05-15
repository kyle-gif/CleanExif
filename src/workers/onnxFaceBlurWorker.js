/**
 * @fileoverview
 * Web Worker for Local Face Detection & Blurring using ONNX Runtime Web.
 * Expected Model: UltraFace (e.g. version-RFB-320.onnx)
 */
import * as ort from 'onnxruntime-web';
import { createSession } from '../utils/onnxBackend';

let session = null;

self.onmessage = async (e) => {
  const { type, imageData, blurRadius, width, height } = e.data;
  
  if (type === 'INIT') {
    try {
      // User must place this ONNX model in public/models/
      session = await createSession('/models/version-RFB-320.onnx', true); // Force WASM
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
    return;
  }

  if (type === 'PROCESS') {
    if (!session) {
       self.postMessage({ type: 'ERROR', error: "Model not initialized" });
       return;
    }
    
    try {
      // 1. Preprocess: ImageData to Tensor (1x3x240x320 for UltraFace)
      const inputWidth = 320;
      const inputHeight = 240;
      
      const canvas = new OffscreenCanvas(inputWidth, inputHeight);
      const ctx = canvas.getContext('2d');
      const bitmap = await createImageBitmap(imageData);
      ctx.drawImage(bitmap, 0, 0, inputWidth, inputHeight);
      
      const resizedData = ctx.getImageData(0, 0, inputWidth, inputHeight).data;
      const float32Data = new Float32Array(3 * inputWidth * inputHeight);
      
      // Convert to NCHW format and normalize (UltraFace uses mean 127, std 128)
      for (let y = 0; y < inputHeight; y++) {
        for (let x = 0; x < inputWidth; x++) {
          const i = (y * inputWidth + x) * 4;
          float32Data[y * inputWidth + x] = (resizedData[i + 2] - 127.0) / 128.0;         // B
          float32Data[inputWidth * inputHeight + y * inputWidth + x] = (resizedData[i + 1] - 127.0) / 128.0; // G
          float32Data[2 * inputWidth * inputHeight + y * inputWidth + x] = (resizedData[i] - 127.0) / 128.0; // R
        }
      }
      
      const tensor = new ort.Tensor('float32', float32Data, [1, 3, inputHeight, inputWidth]);
      
      // 2. Inference
      const feeds = {};
      feeds[session.inputNames[0]] = tensor;
      const results = await session.run(feeds);
      
      const outputArrays = Object.values(results);
      let boxesArray, scoresArray, scoresDims;
      if (outputArrays.length >= 2) {
         if (outputArrays[0].data.length > outputArrays[1].data.length) {
            boxesArray = outputArrays[0].data;
            scoresArray = outputArrays[1].data;
            scoresDims = outputArrays[1].dims;
         } else {
            boxesArray = outputArrays[1].data;
            scoresArray = outputArrays[0].data;
            scoresDims = outputArrays[0].dims;
         }
      }
      
      function generatePriors() {
          const inputW = 320;
          const inputH = 240;
          const featureMaps = [[30, 40], [15, 20], [8, 10], [4, 5]]; // H, W
          const steps = [8, 16, 32, 64];
          const minSizes = [[10, 16, 24], [32, 48], [64, 96], [128, 192, 256]];
          
          let priors = [];
          for (let k = 0; k < featureMaps.length; k++) {
              let fH = featureMaps[k][0];
              let fW = featureMaps[k][1];
              let minSize = minSizes[k];
              for (let i = 0; i < fH; i++) {
                  for (let j = 0; j < fW; j++) {
                      for (let s of minSize) {
                          priors.push([
                              (j + 0.5) * steps[k] / inputW, 
                              (i + 0.5) * steps[k] / inputH, 
                              s / inputW, 
                              s / inputH
                          ]);
                      }
                  }
              }
          }
          return priors;
      }

      const threshold = 0.35;
      const priors = generatePriors();
      let candidates = [];
      
      if (boxesArray && scoresArray) {
        const numBoxes = boxesArray.length / 4;
        
        // Dynamically detect score format using dimensions
        const isFormat1_2_4420 = scoresDims && scoresDims[1] === 2;

        for (let i = 0; i < numBoxes; i++) {
          const score = isFormat1_2_4420 ? scoresArray[numBoxes + i] : scoresArray[i * 2 + 1]; 
          
          if (score > threshold && i < priors.length) {
             const prior = priors[i];
             const dx = boxesArray[i * 4];
             const dy = boxesArray[i * 4 + 1];
             const dw = boxesArray[i * 4 + 2];
             const dh = boxesArray[i * 4 + 3];

             const variances = [0.1, 0.2];
             const cx = dx * variances[0] * prior[2] + prior[0];
             const cy = dy * variances[0] * prior[3] + prior[1];
             const w = Math.exp(dw * variances[1]) * prior[2];
             const h = Math.exp(dh * variances[1]) * prior[3];

             let xmin = cx - w / 2;
             let ymin = cy - h / 2;
             let xmax = cx + w / 2;
             let ymax = cy + h / 2;

             candidates.push({
                xmin: xmin * width,
                ymin: ymin * height,
                xmax: xmax * width,
                ymax: ymax * height,
                score
             });
          }
        }
      }

      function computeIoU(b1, b2) {
          const x1 = Math.max(b1.xmin, b2.xmin);
          const y1 = Math.max(b1.ymin, b2.ymin);
          const x2 = Math.min(b1.xmax, b2.xmax);
          const y2 = Math.min(b1.ymax, b2.ymax);
          const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
          if (inter === 0) return 0;
          const a1 = (b1.xmax - b1.xmin) * (b1.ymax - b1.ymin);
          const a2 = (b2.xmax - b2.xmin) * (b2.ymax - b2.ymin);
          return inter / (a1 + a2 - inter);
      }

      candidates.sort((a, b) => b.score - a.score);
      const faces = [];
      while (candidates.length > 0) {
          const best = candidates.shift();
          faces.push({
             x: best.xmin,
             y: best.ymin,
             w: best.xmax - best.xmin,
             h: best.ymax - best.ymin
          });
          candidates = candidates.filter(box => computeIoU(best, box) < 0.4);
      }
      
      // 3. Apply Blur to Detected Faces
      if (faces.length > 0) {
        const outCanvas = new OffscreenCanvas(width, height);
        const outCtx = outCanvas.getContext('2d');
        outCtx.drawImage(bitmap, 0, 0);
        
        const blurredImageData = outCtx.getImageData(0, 0, width, height);
        const data = blurredImageData.data;
        
        // Fast Manual Box Blur fallback because OffscreenCanvas.filter is unsupported in Safari Web Workers
        const applyBoxBlur = (bx, by, bw, bh, radius) => {
            const r = Math.floor(radius);
            if (r <= 0) return;
            
            bx = Math.floor(bx); by = Math.floor(by); bw = Math.floor(bw); bh = Math.floor(bh);
            const startX = Math.max(0, bx);
            const startY = Math.max(0, by);
            const endX = Math.min(width, Math.min(bx + bw, width));
            const endY = Math.min(height, Math.min(by + bh, height));
            const w = endX - startX;
            const h = endY - startY;
            if (w <= 0 || h <= 0) return;
            
            const temp = new Float32Array(w * h * 3);
            
            // Horizontal Pass
            for (let y = 0; y < h; y++) {
                let sumR = 0, sumG = 0, sumB = 0;
                const scanY = startY + y;
                
                for (let k = -r; k <= r; k++) {
                    const nx = Math.max(0, Math.min(w - 1, k));
                    const idx = (scanY * width + (startX + nx)) * 4;
                    sumR += data[idx]; sumG += data[idx + 1]; sumB += data[idx + 2];
                }
                
                for (let x = 0; x < w; x++) {
                    const dstIdx = (y * w + x) * 3;
                    temp[dstIdx] = sumR / (2 * r + 1);
                    temp[dstIdx + 1] = sumG / (2 * r + 1);
                    temp[dstIdx + 2] = sumB / (2 * r + 1);
                    
                    const tailX = Math.max(0, x - r);
                    const headX = Math.min(w - 1, x + r + 1);
                    const tailIdx = (scanY * width + (startX + tailX)) * 4;
                    const headIdx = (scanY * width + (startX + headX)) * 4;
                    sumR += data[headIdx] - data[tailIdx];
                    sumG += data[headIdx + 1] - data[tailIdx + 1];
                    sumB += data[headIdx + 2] - data[tailIdx + 2];
                }
            }
            
            // Vertical Pass & Write Back
            const cx = startX + w / 2;
            const cy = startY + h / 2;
            const rx = w / 2;
            const ry = h / 2;
            
            for (let x = 0; x < w; x++) {
                let sumR = 0, sumG = 0, sumB = 0;
                for (let k = -r; k <= r; k++) {
                    const ny = Math.max(0, Math.min(h - 1, k));
                    const idx = (ny * w + x) * 3;
                    sumR += temp[idx]; sumG += temp[idx + 1]; sumB += temp[idx + 2];
                }
                
                for (let y = 0; y < h; y++) {
                    const px = startX + x;
                    const py = startY + y;
                    const dx = (px - cx) / rx;
                    const dy = (py - cy) / ry;
                    
                    // Only apply blur inside the face ellipse
                    if (dx * dx + dy * dy <= 1) {
                        const dstIdx = (py * width + px) * 4;
                        data[dstIdx] = sumR / (2 * r + 1);
                        data[dstIdx + 1] = sumG / (2 * r + 1);
                        data[dstIdx + 2] = sumB / (2 * r + 1);
                    }
                    
                    const tailY = Math.max(0, y - r);
                    const headY = Math.min(h - 1, y + r + 1);
                    const tailIdx = (tailY * w + x) * 3;
                    const headIdx = (headY * w + x) * 3;
                    sumR += temp[headIdx] - temp[tailIdx];
                    sumG += temp[headIdx + 1] - temp[tailIdx + 1];
                    sumB += temp[headIdx + 2] - temp[tailIdx + 2];
                }
            }
        };

        faces.forEach(face => {
          const padding = Math.max(5, Math.floor(face.w * 0.15));
          const bx = face.x - padding;
          const by = face.y - padding;
          const bw = face.w + padding * 2;
          const bh = face.h + padding * 2;
          
          const scaleFactor = width / 800;
          const scaledBlur = Math.max(1, Math.round((blurRadius || 15) * scaleFactor));
          
          applyBoxBlur(bx, by, bw, bh, scaledBlur);
        });
        
        self.postMessage({ type: 'PROCESS_DONE', imageData: blurredImageData });
      } else {
        self.postMessage({ type: 'PROCESS_DONE', imageData });
      }
      
    } catch (err) {
      console.error(err);
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
