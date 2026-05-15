/**
 * @fileoverview
 * Web Worker for Local AI Image Upscaling (Super Resolution).
 * 
 * ============================================================================
 * HOW TO OBTAIN AND CONVERT A COMPATIBLE MODEL:
 * 1. Find a lightweight Super Resolution model on TFHub or HuggingFace (e.g., Real-ESRGAN).
 * 2. Ensure it is a TF SavedModel or Keras model.
 * 3. Use `tensorflowjs_converter` to convert it to a tfjs-graph-model:
 *    tensorflowjs_converter \
 *      --input_format=tf_saved_model \
 *      --output_format=tfjs_graph_model \
 *      --signature_name=serving_default \
 *      --saved_model_tags=serve \
 *      ./path_to_saved_model \
 *      ./public/models/upscaler
 * 4. Place the generated `model.json` and `.bin` files into `/public/models/upscaler/`
 * ============================================================================
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let model = null;

async function loadModel() {
  if (!model) {
    await tf.setBackend('webgl');
    await tf.ready();
    // Path to the hosted model.json relative to the public directory
    model = await tf.loadGraphModel('/models/upscaler/model.json');
  }
}

self.onmessage = async (e) => {
  const { imageData, width, height, type } = e.data;
  
  if (type === 'INIT') {
    try {
      await loadModel();
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
    return;
  }

  if (type === 'PROCESS') {
    try {
      await loadModel();
      
      const scale = 2; // Default scale for the model (e.g., 2x)
      const outWidth = width * scale;
      const outHeight = height * scale;
      const outCanvas = new OffscreenCanvas(outWidth, outHeight);
      const outCtx = outCanvas.getContext('2d');
      
      // Tiling size to prevent VRAM OOM on large images
      const patchSize = 256; 
      
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
          const pWidth = Math.min(patchSize, width - startX);
          const pHeight = Math.min(patchSize, height - startY);
          
          const patchImageData = inCtx.getImageData(startX, startY, pWidth, pHeight);
          
          // Yield to prevent complete lockup of the browser
          await tf.nextFrame(); 
          
          // Use tf.tidy to automatically clean up intermediate tensors
          const patchResultTensor = tf.tidy(() => {
            // Convert to tensor [1, H, W, 3]
            const tensor = tf.browser.fromPixels(patchImageData).expandDims(0).toFloat();
            // Normalize (Assuming model expects 0-1)
            const normalized = tensor.div(255.0);
            
            // Predict
            const result = model.predict(normalized);
            
            // Denormalize and squeeze
            return result.clipByValue(0, 1).mul(255.0).cast('int32').squeeze(0);
          });
          
          // Convert tensor to pixel data
          const outPatchBytes = await tf.browser.toPixels(patchResultTensor);
          patchResultTensor.dispose(); // clean up the returned tensor
          
          const outPatchClamped = new Uint8ClampedArray(outPatchBytes);
          const outPatchImageData = new ImageData(outPatchClamped, pWidth * scale, pHeight * scale);
          
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
