// src/utils/imageFilters.js

// A simple 3x3 convolution for sharpness
function applyConvolution(pixels, width, height, weights) {
  const side = Math.round(Math.sqrt(weights.length));
  const halfSide = Math.floor(side / 2);
  const src = new Uint8ClampedArray(pixels.data);
  const sw = width;
  const sh = height;
  const w = sw;
  const h = sh;
  
  const opaque = 1;
  const alphaFac = opaque ? 1 : 0;
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      let r = 0, g = 0, b = 0, a = 0;
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
            a += src[srcOff + 3] * wt;
          }
        }
      }
      pixels.data[dstOff] = r;
      pixels.data[dstOff + 1] = g;
      pixels.data[dstOff + 2] = b;
      pixels.data[dstOff + 3] = a + alphaFac * (255 - a);
    }
  }
  return pixels;
}

export function processPixels(imageData, settings) {
  const { data } = imageData;
  const len = data.length;
  
  // Destructure settings with defaults
  const {
    luminance = 0, // -100 to 100
    contrast = 0, // -100 to 100
    saturation = 0, // -100 to 100
    highlights = 0, // -100 to 100
    shadows = 0, // -100 to 100
    kelvin = 5000, // 2000 to 10000
    drClipBlack = 0, // 0 to 255
    drClipWhite = 255, // 0 to 255
    clarity = 0 // -100 to 100
  } = settings;

  // Calculate Kelvin Shift
  // 5000K is neutral. Lower = cooler (more blue/less red). Higher = warmer (more red/less blue)
  // Shift scale: -3000 to +5000
  const kShift = (kelvin - 5000) / 100; // -30 to +50
  const rShift = kShift * 1.5;
  const bShift = -kShift * 1.5;

  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  const satMult = 1 + (saturation / 100);
  const clarityFactor = 1 + (clarity / 100) * 0.5;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 0. Luminance (Exposure)
    if (luminance !== 0) {
      const lumAdj = (luminance / 100) * 128;
      r += lumAdj;
      g += lumAdj;
      b += lumAdj;
    }

    // 1. White Balance (Kelvin)
    r += rShift;
    b += bShift;

    // Luminance approximation
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // 2. DR Clipping
    if (lum <= drClipBlack) {
      r = g = b = 0;
      lum = 0;
    } else if (lum >= drClipWhite) {
      r = g = b = 255;
      lum = 255;
    }

    // 3. Highlights & Shadows
    // Highlights: affect pixels brighter than 128
    if (highlights !== 0 && lum > 128) {
      const hFactor = (lum - 128) / 127; // 0 to 1
      const adjustment = (highlights / 100) * 50 * hFactor;
      r += adjustment;
      g += adjustment;
      b += adjustment;
    }
    
    // Shadows: affect pixels darker than 128
    if (shadows !== 0 && lum < 128) {
      const sFactor = (128 - lum) / 128; // 0 to 1
      const adjustment = (shadows / 100) * 50 * sFactor;
      r += adjustment;
      g += adjustment;
      b += adjustment;
    }

    // 4. Clarity (Midtone contrast)
    if (clarity !== 0) {
      // push midtones away from 128
      const dist = 128 - lum;
      const midMask = 1 - Math.abs(dist) / 128; // 1 at 128, 0 at 0 or 255
      const adj = (lum - 128) * (clarityFactor - 1) * midMask;
      r += adj;
      g += adj;
      b += adj;
    }

    // 5. Contrast
    if (contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // 6. Saturation
    if (saturation !== 0) {
      const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = currentLum + (r - currentLum) * satMult;
      g = currentLum + (g - currentLum) * satMult;
      b = currentLum + (b - currentLum) * satMult;
    }

    // Clamp values
    data[i] = r > 255 ? 255 : r < 0 ? 0 : r;
    data[i + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
    data[i + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
  }

  // 7. Sharpness / Blur (Convolution)
  if (settings.sharpness && settings.sharpness !== 0) {
    let weights;
    if (settings.sharpness > 0) {
      // Sharpen
      const s = settings.sharpness / 100; // 0 to 1
      weights = [
        0, -s, 0,
        -s, 1 + 4*s, -s,
        0, -s, 0
      ];
    } else {
      // Blur
      const b = Math.abs(settings.sharpness) / 100; // 0 to 1
      const edge = b / 9;
      const center = 1 - (8 * edge);
      weights = [
        edge, edge, edge,
        edge, center, edge,
        edge, edge, edge
      ];
    }
    applyConvolution(imageData, imageData.width, imageData.height, weights);
  }

  return imageData;
}
