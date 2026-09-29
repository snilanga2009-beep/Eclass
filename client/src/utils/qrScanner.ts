import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Robust, client-side QR code decoder for both Android & iOS.
 * Handles high-resolution smartphone photos (12MP - 48MP) by downscaling
 * them onto an offscreen canvas before decoding, preventing OOM crashes and
 * ensuring instant decoding in milliseconds.
 */

interface ScanOptions {
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Decode an image via canvas + jsQR at given dimension
 */
function scanCanvasWithJsQR(
  source: ImageBitmap | HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    // Pass 1: standard & inverted
    let code = jsQR(imageData.data, targetWidth, targetHeight, {
      inversionAttempts: 'attemptBoth'
    });
    if (code && code.data && code.data.trim()) {
      return code.data.trim();
    }

    // Pass 2: High-contrast binarization
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const avg = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const val = avg > 128 ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);

    code = jsQR(data, targetWidth, targetHeight, {
      inversionAttempts: 'attemptBoth'
    });
    if (code && code.data && code.data.trim()) {
      return code.data.trim();
    }

    // Pass 3: Center crop (70% center)
    const cropW = Math.round(targetWidth * 0.7);
    const cropH = Math.round(targetHeight * 0.7);
    const startX = Math.round((targetWidth - cropW) / 2);
    const startY = Math.round((targetHeight - cropH) / 2);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
    if (cropCtx) {
      cropCtx.drawImage(source, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
      const cropData = cropCtx.getImageData(0, 0, cropW, cropH);
      code = jsQR(cropData.data, cropW, cropH, {
        inversionAttempts: 'attemptBoth'
      });
      if (code && code.data && code.data.trim()) {
        return code.data.trim();
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Decode QR code from a user-captured image File or Blob (e.g. from camera input)
 */
export async function decodeQRFromFile(file: File, options: ScanOptions = {}): Promise<string> {
  // Strategy 1: Try modern createImageBitmap with EXIF orientation handling
  if (typeof createImageBitmap !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' as any });
      const origW = bitmap.width;
      const origH = bitmap.height;

      // Try scale 1: 900px
      const scale1 = Math.min(1, 900 / Math.max(origW, origH));
      const w1 = Math.round(origW * scale1);
      const h1 = Math.round(origH * scale1);
      let result = scanCanvasWithJsQR(bitmap, w1, h1);
      if (result) return result;

      // Try scale 2: 1300px
      const scale2 = Math.min(1, 1300 / Math.max(origW, origH));
      const w2 = Math.round(origW * scale2);
      const h2 = Math.round(origH * scale2);
      result = scanCanvasWithJsQR(bitmap, w2, h2);
      if (result) return result;
    } catch (e) {
      console.warn('createImageBitmap strategy failed, falling back to Image loader:', e);
    }
  }

  // Strategy 2: Traditional Image element with object URL
  const imgResult = await new Promise<string | null>((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) {
        resolve(null);
        return;
      }

      // Try 960px
      const scale = Math.min(1, 960 / Math.max(w, h));
      const targetW = Math.round(w * scale);
      const targetH = Math.round(h * scale);

      const res = scanCanvasWithJsQR(img, targetW, targetH);
      resolve(res);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });

  if (imgResult) return imgResult;

  // Strategy 3: Fallback to Html5Qrcode.scanFile
  try {
    let dummyDiv = document.getElementById('qr-hidden-decoder-anchor');
    if (!dummyDiv) {
      dummyDiv = document.createElement('div');
      dummyDiv.id = 'qr-hidden-decoder-anchor';
      dummyDiv.style.display = 'none';
      document.body.appendChild(dummyDiv);
    }
    const html5QrCode = new Html5Qrcode('qr-hidden-decoder-anchor');
    const fallbackText = await html5QrCode.scanFile(file, false);
    if (fallbackText && fallbackText.trim()) {
      return fallbackText.trim();
    }
  } catch (fallbackErr) {
    console.warn('Html5Qrcode scanFile fallback also failed:', fallbackErr);
  }

  throw new Error('No QR code detected in the photo. Please make sure the QR code is centered, well-lit, and in focus, or type the Student ID directly.');
}

/**
 * Decode QR code from a live HTMLVideoElement frame
 */
export function decodeQRFromVideo(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string | null {
  if (video.readyState !== video.HAVE_ENOUGH_DATA) {
    return null;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;

  // Scale down if video stream is large (e.g. 1080p or 4K back camera)
  const maxDim = 640;
  let targetW = width;
  let targetH = height;
  if (width > maxDim || height > maxDim) {
    const ratio = Math.min(maxDim / width, maxDim / height);
    targetW = Math.round(width * ratio);
    targetH = Math.round(height * ratio);
  }

  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, targetW, targetH);
  const imageData = ctx.getImageData(0, 0, targetW, targetH);

  const code = jsQR(imageData.data, targetW, targetH, {
    inversionAttempts: 'dontInvert'
  });

  return code && code.data ? code.data.trim() : null;
}
