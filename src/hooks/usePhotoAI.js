import { useEffect, useRef, useState, useCallback } from 'react';
import OnnxFaceBlurWorker from '../workers/onnxFaceBlurWorker?worker';
import OnnxUpscaleWorker from '../workers/onnxUpscaleWorker?worker';

export function usePhotoAI() {
  const faceWorker = useRef(null);
  const upscaleWorker = useRef(null);

  const [isFaceModelReady, setIsFaceModelReady] = useState(false);
  const [isUpscaleModelReady, setIsUpscaleModelReady] = useState(false);

  useEffect(() => {
    faceWorker.current = new OnnxFaceBlurWorker();
    upscaleWorker.current = new OnnxUpscaleWorker();

    faceWorker.current.onmessage = (e) => {
      if (e.data.type === 'INIT_DONE') setIsFaceModelReady(true);
      if (e.data.type === 'ERROR') console.error("Face Blur Init Error:", e.data.error);
    };
    upscaleWorker.current.onmessage = (e) => {
      if (e.data.type === 'INIT_DONE') setIsUpscaleModelReady(true);
      if (e.data.type === 'ERROR') console.error("Upscale Init Error:", e.data.error);
    };

    faceWorker.current.postMessage({ type: 'INIT' });
    upscaleWorker.current.postMessage({ type: 'INIT' });

    return () => {
      faceWorker.current?.terminate();
      upscaleWorker.current?.terminate();
    };
  }, []);

  const applyFaceBlur = useCallback((imageData, blurRadius) => {
    return new Promise((resolve) => {
      if (!faceWorker.current || !isFaceModelReady) {
        return resolve(imageData); // Fallback to original if not ready
      }
      
      const handler = (e) => {
        if (e.data.type === 'PROCESS_DONE') {
          faceWorker.current.removeEventListener('message', handler);
          resolve(e.data.imageData);
        } else if (e.data.type === 'ERROR') {
          faceWorker.current.removeEventListener('message', handler);
          console.error("Face Blur Error:", e.data.error);
          resolve(imageData); // Return original on error
        }
      };
      
      faceWorker.current.addEventListener('message', handler);
      faceWorker.current.postMessage({
        type: 'PROCESS',
        imageData,
        width: imageData.width,
        height: imageData.height,
        blurRadius
      });
    });
  }, [isFaceModelReady]);

  const applyUpscale = useCallback((imageData, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!upscaleWorker.current || !isUpscaleModelReady) {
        return reject(new Error("Upscale model not ready. Make sure upscaler.onnx is in /public/models/"));
      }

      const handler = (e) => {
        if (e.data.type === 'PROGRESS') {
          if (onProgress) onProgress(e.data.progress);
        } else if (e.data.type === 'PROCESS_DONE') {
          upscaleWorker.current.removeEventListener('message', handler);
          resolve(e.data.imageData);
        } else if (e.data.type === 'ERROR') {
          upscaleWorker.current.removeEventListener('message', handler);
          reject(new Error(e.data.error));
        }
      };

      upscaleWorker.current.addEventListener('message', handler);
      upscaleWorker.current.postMessage({
        type: 'PROCESS',
        imageData,
        width: imageData.width,
        height: imageData.height
      });
    });
  }, [isUpscaleModelReady]);

  return {
    isFaceModelReady,
    isUpscaleModelReady,
    applyFaceBlur,
    applyUpscale
  };
}
