/**
 * @fileoverview
 * Web Worker for Local Image Upscaling using ONNX Runtime Web.
 * Expected Model: Real-ESRGAN or similar Super Resolution ONNX model.
 */
import * as ort from 'onnxruntime-web';
import { createSession } from '../utils/onnxBackend';

function toHalf(val) {
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);
    floatView[0] = val;
    const x = int32View[0];
    let bits = (x >> 16) & 0x8000;
    let m = (x >> 12) & 0x07ff;
    let e = (x >> 23) & 0xff;
    if (e < 103) return bits;
    if (e > 142) {
        bits |= 0x7c00;
        bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
        return bits;
    }
    if (e < 113) {
        m |= 0x0800;
        bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
        return bits;
    }
    bits |= ((e - 112) << 10) | (m >> 1);
    bits += m & 1;
    return bits;
}

function fromHalf(float16) {
    const exponent = (float16 & 0x7C00) >> 10;
    const fraction = float16 & 0x03FF;
    const sign = (float16 & 0x8000) >> 15;
    if (exponent === 0) {
        if (fraction === 0) return sign === 0 ? 0 : -0;
        return (sign === 0 ? 1 : -1) * Math.pow(2, -14) * (fraction / 1024);
    } else if (exponent === 0x1F) {
        if (fraction === 0) return sign === 0 ? Infinity : -Infinity;
        return NaN;
    }
    return (sign === 0 ? 1 : -1) * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}

let session = null;
let isModelFloat16 = false;

self.onmessage = async (e) => {
  const { type, imageData, width, height } = e.data;
  
  if (type === 'INIT') {
    try {
      // We use WebGPU (forceWasm=false) because FP16 execution is incredibly slow or unsupported in WASM.
      session = await createSession('/models/upscaler.onnx', false);
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
      let scale = 2; // Default, will be dynamically updated by first patch
      let outWidth = width * scale;
      let outHeight = height * scale;
      const outCanvas = new OffscreenCanvas(outWidth, outHeight);
      const outCtx = outCanvas.getContext('2d');
      
      const patchSize = 64; // Reduced to 64 due to Firefox Mac WebGPU bugs with DepthToSpace/Conv layers
      const totalPatchesX = Math.ceil(width / patchSize);
      const totalPatchesY = Math.ceil(height / patchSize);
      let processedCount = 0;
      const totalPatches = totalPatchesX * totalPatchesY;
      
      const inCanvas = new OffscreenCanvas(width, height);
      const inCtx = inCanvas.getContext('2d');
      inCtx.putImageData(imageData, 0, 0);
      
      for (let y = 0; y < totalPatchesY; y++) {
        for (let x = 0; x < totalPatchesX; x++) {
          
          const startX = x * patchSize;
          const startY = y * patchSize;
          
          // Force input dims to always be EXACTLY patchSize (256) to avoid WebGPU dynamic shape crash
          const pWidth = patchSize;
          const pHeight = patchSize;
          
          // Keep track of the valid region so we don't draw the black padding onto the final canvas
          const validWidth = Math.min(patchSize, width - startX);
          const validHeight = Math.min(patchSize, height - startY);
          
          // getImageData will automatically pad out-of-bounds coords with transparent black
          const patchImageData = inCtx.getImageData(startX, startY, pWidth, pHeight);
          
          // Preprocess to tensor [1, 3, H, W] (Float32)
          const float32Data = new Float32Array(3 * pHeight * pWidth);
          for (let py = 0; py < pHeight; py++) {
            for (let px = 0; px < pWidth; px++) {
              const idx = (py * pWidth + px) * 4;
              // Normalize (usually 0-1 for ESRGAN)
              float32Data[py * pWidth + px] = patchImageData.data[idx] / 255.0;
              float32Data[pWidth * pHeight + py * pWidth + px] = patchImageData.data[idx + 1] / 255.0;
              float32Data[2 * pWidth * pHeight + py * pWidth + px] = patchImageData.data[idx + 2] / 255.0;
            }
          }
          
          let tensor;
          if (isModelFloat16) {
              const float16Data = new Uint16Array(float32Data.length);
              for (let i = 0; i < float32Data.length; i++) float16Data[i] = toHalf(float32Data[i]);
              tensor = new ort.Tensor('float16', float16Data, [1, 3, pHeight, pWidth]);
          } else {
              tensor = new ort.Tensor('float32', float32Data, [1, 3, pHeight, pWidth]);
          }
          
          const feeds = {};
          feeds[session.inputNames[0]] = tensor;
          
          let results;
          try {
             results = await session.run(feeds);
          } catch (e) {
             if (e.message.includes('float16') && !isModelFloat16) {
                 isModelFloat16 = true;
                 const float16Data = new Uint16Array(float32Data.length);
                 for (let i = 0; i < float32Data.length; i++) float16Data[i] = toHalf(float32Data[i]);
                 tensor = new ort.Tensor('float16', float16Data, [1, 3, pHeight, pWidth]);
                 feeds[session.inputNames[0]] = tensor;
                 try {
                     results = await session.run(feeds);
                 } catch (err2) {
                     if (err2.message.includes('WebGPU') || err2.message.includes('kernel')) {
                         console.warn("WebGPU crashed on FP16, falling back to WASM...");
                         session = await ort.InferenceSession.create('/models/upscaler.onnx', { executionProviders: ['wasm'] });
                         results = await session.run(feeds);
                     } else {
                         throw err2;
                     }
                 }
             } else if (e.message.includes('WebGPU') || e.message.includes('kernel')) {
                 console.warn("WebGPU crashed, falling back to WASM...");
                 session = await ort.InferenceSession.create('/models/upscaler.onnx', { executionProviders: ['wasm'] });
                 results = await session.run(feeds);
             } else {
                 throw e;
             }
          }

          const outputName = session.outputNames[0];
          const outputTensor = results[outputName];
          let outData = outputTensor.data; 
          
          if (outputTensor.type === 'float16') {
             if (outData instanceof Uint16Array) {
                 const f32 = new Float32Array(outData.length);
                 for(let i=0; i<outData.length; i++) f32[i] = fromHalf(outData[i]);
                 outData = f32;
             }
          }
          
          // Dynamically read the actual output dimensions (e.g., 4x models will return 1024x1024 for a 256x256 input)
          const outPatchHeight = outputTensor.dims[2];
          const outPatchWidth = outputTensor.dims[3];
          const actualScale = Math.round(outPatchWidth / pWidth); // e.g., 512 / 256 = 2
          
          const validOutWidth = validWidth * actualScale;
          const validOutHeight = validHeight * actualScale;
          
          const outPatchClamped = new Uint8ClampedArray(validOutWidth * validOutHeight * 4);
          for (let py = 0; py < validOutHeight; py++) {
            for (let px = 0; px < validOutWidth; px++) {
              // Read from the full padded output tensor
              const srcIdx = py * outPatchWidth + px;
              
              const r = outData[srcIdx] * 255.0;
              const g = outData[outPatchHeight * outPatchWidth + srcIdx] * 255.0;
              const b = outData[2 * outPatchHeight * outPatchWidth + srcIdx] * 255.0;
              
              // Write to the tightly packed valid region buffer
              const dstIdx = (py * validOutWidth + px) * 4;
              outPatchClamped[dstIdx] = Math.max(0, Math.min(255, r));
              outPatchClamped[dstIdx+1] = Math.max(0, Math.min(255, g));
              outPatchClamped[dstIdx+2] = Math.max(0, Math.min(255, b));
              outPatchClamped[dstIdx+3] = 255;
            }
          }
          
          const outPatchImageData = new ImageData(outPatchClamped, validOutWidth, validOutHeight);
          
          if (x === 0 && y === 0) {
             if (actualScale !== scale) {
                 scale = actualScale;
                 outWidth = width * scale;
                 outHeight = height * scale;
                 outCanvas.width = outWidth;
                 outCanvas.height = outHeight;
             }
          }
          
          outCtx.putImageData(outPatchImageData, startX * scale, startY * scale);
          
          processedCount++;
          self.postMessage({ 
            type: 'PROGRESS', 
            progress: Math.floor((processedCount / totalPatches) * 100) 
          });
        }
      }
      
      const finalImageData = outCtx.getImageData(0, 0, outWidth, outHeight);
      self.postMessage({ type: 'PROCESS_DONE', imageData: finalImageData });
      
    } catch (err) {
      console.error(err);
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
