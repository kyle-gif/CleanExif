// src/utils/imageFilters.js

// Simple convolution
function applyConvolution(pixels, width, height, weights) {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = new Uint8ClampedArray(pixels.data);
  const sw = width;
  const sh = height;
  
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * sw + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = sy + cy - halfSide;
          const scx = sx + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }
      pixels.data[dstOff] = r;
      pixels.data[dstOff + 1] = g;
      pixels.data[dstOff + 2] = b;
    }
  }
  return pixels;
}

// Very basic Chroma Blur (Color Noise Reduction)
function applyChromaBlur(pixels, width, height) {
  const src = new Uint8ClampedArray(pixels.data);
  const sw = width;
  const sh = height;
  
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const off = (y * sw + x) * 4;
      
      // We only want to blur the color, not the luminance.
      // Average the surrounding RGB, keep original Luminance.
      let sumR = 0, sumG = 0, sumB = 0;
      for(let dy=-1; dy<=1; dy++){
        for(let dx=-1; dx<=1; dx++){
           const noff = ((y+dy) * sw + (x+dx)) * 4;
           sumR += src[noff];
           sumG += src[noff+1];
           sumB += src[noff+2];
        }
      }
      const avgR = sumR / 9;
      const avgG = sumG / 9;
      const avgB = sumB / 9;
      
      const origR = src[off];
      const origG = src[off+1];
      const origB = src[off+2];
      
      const origLum = 0.299 * origR + 0.587 * origG + 0.114 * origB;
      const blurLum = 0.299 * avgR + 0.587 * avgG + 0.114 * avgB;
      
      const diff = origLum - blurLum;
      
      pixels.data[off] = avgR + diff;
      pixels.data[off+1] = avgG + diff;
      pixels.data[off+2] = avgB + diff;
    }
  }
  return pixels;
}

export function processPixels(imageData, settings) {
  const { data, width, height } = imageData;
  const len = data.length;
  
  const {
    luminance = 0, 
    contrast = 0, 
    saturation = 0, 
    highlights = 0, 
    shadows = 0, 
    kelvin = 5000, 
    tint = 0, // -100 (Green) to +100 (Magenta)
    wbRed = 1, // manual multiplier
    wbBlue = 1, // manual multiplier
    drClipBlack = 0, 
    drClipWhite = 255, 
    fadeHighlights = 0, // 0 to 100
    liftShadows = 0, // 0 to 100
    clarity = 0,
    dehaze = 0, // 0 to 100
    sharpness = 0,
    microContrast = 0, // 0 to 100
    nrLuma = 0, // 0 to 100
    nrChroma = 0, // 0 to 100
    grain = 0 // 0 to 100
  } = settings;

  // 0. Pre-process Spatial Filters (NR Luma/Chroma)
  // Warning: Spatial filters are slow.
  if (nrLuma > 0) {
    // Simple blur for luma noise
    const edge = (nrLuma / 100) / 9;
    const center = 1 - (8 * edge);
    applyConvolution(imageData, width, height, [
      edge, edge, edge,
      edge, center, edge,
      edge, edge, edge
    ]);
  }

  if (nrChroma > 0) {
    applyChromaBlur(imageData, width, height);
  }

  // Pre-calculate Point Filter Factors
  const kShift = (kelvin - 5000) / 100; // -30 to +50
  const rShift = kShift * 1.5;
  const bShift = -kShift * 1.5;
  
  const tintR = tint > 0 ? tint * 0.5 : 0;
  const tintB = tint > 0 ? tint * 0.5 : 0;
  const tintG = tint < 0 ? Math.abs(tint) * 0.5 : 0;

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  // dehazeFactor used for positive dehaze
  const dehazeFactor = 1 + (Math.max(0, dehaze) / 100) * 0.5;
  const satMult = 1 + (saturation / 100);
  const clarityFactor = 1 + (clarity / 100) * 0.5;
  
  const fadePoint = 255 - (fadeHighlights / 100) * 50; // max fade brings white down to 205
  const liftPoint = (liftShadows / 100) * 50; // max lift brings black up to 50

  // Pre-compute Grain Map for resolution-independent grain size
  let grainSize = 1;
  let blocksX = 0;
  let noiseMap = null;
  const noiseAmt = (grain / 100) * 50; // Max noise intensity

  if (grain > 0) {
    // Target ~1.5px grain size on an 800px canvas. 
    // If width is 4000px, grainSize will be 5, making the grain visibly the same size.
    grainSize = Math.max(1, Math.round(width / 600)); 
    blocksX = Math.ceil(width / grainSize);
    const blocksY = Math.ceil(height / grainSize);
    
    noiseMap = new Float32Array(blocksX * blocksY);
    for (let j = 0; j < noiseMap.length; j++) {
        noiseMap[j] = (Math.random() - 0.5) * noiseAmt;
    }
  }

  let px = 0;
  let py = 0;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Luminance / Exposure
    if (luminance !== 0) {
      const lumAdj = (luminance / 100) * 128;
      r += lumAdj;
      g += lumAdj;
      b += lumAdj;
    }

    // White Balance (Kelvin + Manual R/B + Tint)
    r = (r + rShift + tintR) * wbRed;
    g = g + tintG;
    b = (b + bShift + tintB) * wbBlue;

    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Dehaze / Haze
    if (dehaze !== 0) {
       if (dehaze > 0) {
          // Dehaze (subtract dark channel approximation and boost contrast)
          const dehazeAdj = (dehaze / 100) * 20;
          r = (r - dehazeAdj) * dehazeFactor;
          g = (g - dehazeAdj) * dehazeFactor;
          b = (b - dehazeAdj) * dehazeFactor;
       } else {
          // Haze (blend towards off-white/gray, simulating fog/bloom)
          const hazeIntensity = (Math.abs(dehaze) / 100) * 0.45; // up to 45% white blend
          r = r * (1 - hazeIntensity) + (220 * hazeIntensity);
          g = g * (1 - hazeIntensity) + (220 * hazeIntensity);
          b = b * (1 - hazeIntensity) + (220 * hazeIntensity);
       }
       lum = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // DR Clipping
    if (lum <= drClipBlack) { r = g = b = 0; lum = 0; } 
    else if (lum >= drClipWhite) { r = g = b = 255; lum = 255; }

    // Highlights & Shadows (Recovery)
    if (highlights !== 0 && lum > 128) {
      const hFactor = (lum - 128) / 127; 
      const adj = (highlights / 100) * 50 * hFactor;
      r += adj; g += adj; b += adj;
    }
    if (shadows !== 0 && lum < 128) {
      const sFactor = (128 - lum) / 128; 
      const adj = (shadows / 100) * 50 * sFactor;
      r += adj; g += adj; b += adj;
    }

    // Clarity (Midtone contrast)
    if (clarity !== 0) {
      const dist = 128 - lum;
      const midMask = 1 - Math.abs(dist) / 128; 
      const adj = (lum - 128) * (clarityFactor - 1) * midMask;
      r += adj; g += adj; b += adj;
    }

    // Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Fade Highlights / Lift Shadows (Washed/Vintage look)
    if (fadeHighlights > 0 && r > fadePoint) r = fadePoint;
    if (fadeHighlights > 0 && g > fadePoint) g = fadePoint;
    if (fadeHighlights > 0 && b > fadePoint) b = fadePoint;
    
    if (liftShadows > 0 && r < liftPoint) r = liftPoint;
    if (liftShadows > 0 && g < liftPoint) g = liftPoint;
    if (liftShadows > 0 && b < liftPoint) b = liftPoint;

    // Saturation
    if (saturation !== 0) {
      const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = currentLum + (r - currentLum) * satMult;
      g = currentLum + (g - currentLum) * satMult;
      b = currentLum + (b - currentLum) * satMult;
    }
    
    // Film Grain (Resolution Independent)
    if (grain > 0) {
       const bx = Math.floor(px / grainSize);
       const by = Math.floor(py / grainSize);
       let noise = noiseMap[by * blocksX + bx];
       
       // Noise intensity scales slightly with luminance (more visible in midtones)
       const noiseMidMask = 1 - Math.abs(128 - lum) / 128; // 1 at mid, 0 at black/white
       noise = noise * (0.5 + noiseMidMask);
       r += noise;
       g += noise;
       b += noise;
    }

    data[i] = r > 255 ? 255 : r < 0 ? 0 : r;
    data[i + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
    data[i + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
    
    // Coordinate tracking
    px++;
    if (px === width) {
        px = 0;
        py++;
    }
  }

  // Micro-contrast / Sharpness / Blur
  if (microContrast > 0 || sharpness !== 0) {
    let s = (sharpness / 100); 
    // Micro-contrast adds an unsharp mask with higher strength
    if (microContrast > 0) s += (microContrast / 100) * 1.5;

    let weights;
    if (s > 0) {
      weights = [
        0, -s, 0,
        -s, 1 + 4*s, -s,
        0, -s, 0
      ];
    } else {
      const b = Math.abs(s); 
      const edge = b / 9;
      const center = 1 - (8 * edge);
      weights = [
        edge, edge, edge,
        edge, center, edge,
        edge, edge, edge
      ];
    }
    applyConvolution(imageData, width, height, weights);
  }

  return imageData;
}
