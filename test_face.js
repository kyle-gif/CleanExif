import * as ort from 'onnxruntime-web';
import fs from 'fs';

async function run() {
  const model = fs.readFileSync('public/models/version-RFB-320.onnx');
  const session = await ort.InferenceSession.create(model);
  
  const width = 320;
  const height = 240;
  
  const resizedData = new Uint8Array(width * height * 4);
  // Fill with random noise
  for (let i = 0; i < resizedData.length; i++) {
      resizedData[i] = Math.floor(Math.random() * 255);
  }

  const float32Data = new Float32Array(3 * width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      float32Data[y * width + x] = (resizedData[i+2] - 127.0) / 128.0;
      float32Data[width * height + y * width + x] = (resizedData[i + 1] - 127.0) / 128.0;
      float32Data[2 * width * height + y * width + x] = (resizedData[i] - 127.0) / 128.0;
    }
  }
  
  const tensor = new ort.Tensor('float32', float32Data, [1, 3, height, width]);
  const feeds = {};
  feeds[session.inputNames[0]] = tensor;
  const results = await session.run(feeds);
  
  const outputArrays = Object.values(results);
  let scoresDims;
  if (outputArrays[0].data.length > outputArrays[1].data.length) {
      scoresDims = outputArrays[1].dims;
  } else {
      scoresDims = output0.dims;
  }
  
  console.log("scoresDims:", scoresDims);
}
run();
