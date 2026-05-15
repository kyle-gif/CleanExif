import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';

let model = null;

async function loadModel() {
  if (!model) {
    await tf.setBackend('webgl');
    await tf.ready();
    model = await blazeface.load();
  }
}

self.onmessage = async (e) => {
  const { imageData, blurRadius = 15, width, height, type } = e.data;
  
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
      
      const predictions = await model.estimateFaces(imageData, false);
      
      if (predictions.length > 0) {
        // Create OffscreenCanvas for manipulating the image
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        const bitmap = await createImageBitmap(imageData);
        ctx.drawImage(bitmap, 0, 0);
        
        // Create a blurred version of the image
        const blurCanvas = new OffscreenCanvas(width, height);
        const blurCtx = blurCanvas.getContext('2d');
        blurCtx.filter = `blur(${blurRadius}px)`;
        blurCtx.drawImage(bitmap, 0, 0);
        
        // Apply blurred patches over detected faces
        predictions.forEach(pred => {
          const start = pred.topLeft;
          const end = pred.bottomRight;
          const size = [end[0] - start[0], end[1] - start[1]];
          
          // Expand the box slightly to cover the whole head/face more completely
          const expandX = size[0] * 0.25;
          const expandY = size[1] * 0.25;
          
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(
            start[0] + size[0] / 2, 
            start[1] + size[1] / 2, 
            size[0] / 2 + expandX, 
            size[1] / 2 + expandY, 
            0, 0, 2 * Math.PI
          );
          ctx.clip();
          ctx.drawImage(blurCanvas, 0, 0);
          ctx.restore();
        });
        
        const blurredImageData = ctx.getImageData(0, 0, width, height);
        self.postMessage({ type: 'PROCESS_DONE', imageData: blurredImageData });
      } else {
        // No faces found, return original
        self.postMessage({ type: 'PROCESS_DONE', imageData });
      }
      
    } catch (err) {
      self.postMessage({ type: 'ERROR', error: err.message });
    }
  }
};
