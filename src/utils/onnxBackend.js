import * as ort from 'onnxruntime-web';

// Crucial for Firefox and non-COOP/COEP environments:
// Disable multithreading to prevent SharedArrayBuffer block/hangs.
ort.env.wasm.numThreads = 1;

export const createSession = async (modelPath, forceWasm = false) => {
  try {
    const providers = forceWasm ? ['wasm'] : ['webgpu', 'wasm'];
    console.log(`[ONNX] Attempting to load ${modelPath} with providers:`, providers);
    
    // Some complex models (like ESRGAN) cause WebGPU compilation to hang for minutes.
    // We wrap it in a timeout (60 seconds) so it falls back to WASM instead of hanging forever.
    const loadPromise = ort.InferenceSession.create(modelPath, { executionProviders: providers });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("WebGPU Compilation Timeout")), 60000));
    
    const session = await Promise.race([loadPromise, timeoutPromise]);
    console.log(`[ONNX] Loaded ${modelPath} successfully.`);
    return session;
  } catch (e) {
    console.warn(`[ONNX] Initialization failed for ${modelPath} (${e.message}). Falling back to WASM.`, e);
    return await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm']
    });
  }
};
