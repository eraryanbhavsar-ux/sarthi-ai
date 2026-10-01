/**
 * Lightweight, zero-dependency client-side scene change detector
 * Samples live camera video feed to prevent redundant API calls to Gemini.
 */

let diffCanvas = null;
let diffCtx = null;
let previousImageData = null;

const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 24;
const DIFF_THRESHOLD = 14; // Average pixel difference (0-255) to trigger new scene analysis

/**
 * Check if the scene in front of the video element has significantly changed
 * @param {HTMLVideoElement} video
 * @returns {{ hasChanged: boolean, diffScore: number }}
 */
export function detectSceneChange(video) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return { hasChanged: false, diffScore: 0 };
  }

  if (!diffCanvas) {
    diffCanvas = document.createElement('canvas');
    diffCanvas.width = SAMPLE_WIDTH;
    diffCanvas.height = SAMPLE_HEIGHT;
    diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });
  }

  try {
    diffCtx.drawImage(video, 0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    const currentImageData = diffCtx.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;

    if (!previousImageData) {
      previousImageData = new Uint8ClampedArray(currentImageData);
      return { hasChanged: true, diffScore: 100 };
    }

    let totalDiff = 0;
    const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;

    // Compare grayscale values (R*0.299 + G*0.587 + B*0.114)
    for (let i = 0; i < currentImageData.length; i += 4) {
      const curGray =
        currentImageData[i] * 0.299 +
        currentImageData[i + 1] * 0.587 +
        currentImageData[i + 2] * 0.114;
      const prevGray =
        previousImageData[i] * 0.299 +
        previousImageData[i + 1] * 0.587 +
        previousImageData[i + 2] * 0.114;

      totalDiff += Math.abs(curGray - prevGray);
    }

    const averageDiff = totalDiff / pixelCount;
    const hasChanged = averageDiff >= DIFF_THRESHOLD;

    if (hasChanged) {
      // Update reference frame
      previousImageData.set(currentImageData);
    }

    return { hasChanged, diffScore: Math.round(averageDiff) };
  } catch (err) {
    console.warn('[SceneDetector] Error calculating scene difference:', err);
    return { hasChanged: true, diffScore: 50 };
  }
}

/**
 * Capture high-resolution JPEG snapshot from video element for AI analysis
 * @param {HTMLVideoElement} video
 * @param {number} maxDimension
 * @returns {string|null} base64 data URL
 */
export function captureRepresentativeFrame(video, maxDimension = 1280) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement('canvas');
  let width = video.videoWidth;
  let height = video.videoHeight;

  // Constrain dimensions to keep base64 payload nimble and fast
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Reset stored reference frame
 */
export function resetSceneDetector() {
  previousImageData = null;
}
