/**
 * Lightweight, zero-dependency client-side scene change detector
 * Samples live camera video feed to prevent redundant API calls to Gemini.
 */

let diffCanvas = null;
let diffCtx = null;
let previousImageData = null;
let lastAnalyzedTimestamp = 0;

const SAMPLE_WIDTH = 32;
const SAMPLE_HEIGHT = 24;
// Balanced threshold (8): responsive to user moving objects/view, while ignoring camera sensor noise
const DIFF_THRESHOLD = 8;
// Heartbeat auto-refresh: if camera points at something continuously for > 7.5s, permit a refresh
const STALE_REFRESH_MS = 7500;

/**
 * Check if the scene in front of the video element has significantly changed
 * @param {HTMLVideoElement} video
 * @param {Object} options
 * @param {boolean} options.force - bypass duplicate suppression
 * @param {boolean} options.lastFailed - if previous attempt failed, do not suppress
 * @returns {{ hasChanged: boolean, diffScore: number, reason: string }}
 */
export function detectSceneChange(video, options = {}) {
  const { force = false, lastFailed = false } = options;

  if (
    !video ||
    typeof video.readyState !== 'number' ||
    video.readyState < 2 || // HTMLMediaElement.HAVE_CURRENT_DATA
    !video.videoWidth ||
    !video.videoHeight ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) {
    return { hasChanged: false, diffScore: 0, reason: 'VIDEO_NOT_READY' };
  }

  const now = Date.now();

  // If forced by user or previous request failed/retrying, always analyze
  if (force || lastFailed) {
    lastAnalyzedTimestamp = now;
    return { hasChanged: true, diffScore: 100, reason: force ? 'FORCED' : 'RETRY' };
  }

  // Periodic heartbeat refresh: ensure user isn't stuck waiting forever
  if (lastAnalyzedTimestamp > 0 && now - lastAnalyzedTimestamp >= STALE_REFRESH_MS) {
    lastAnalyzedTimestamp = now;
    return { hasChanged: true, diffScore: 50, reason: 'HEARTBEAT_REFRESH' };
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
      lastAnalyzedTimestamp = now;
      return { hasChanged: true, diffScore: 100, reason: 'FIRST_FRAME' };
    }

    let totalDiff = 0;
    const pixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;

    // Compare luminance values (R*0.299 + G*0.587 + B*0.114)
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
      previousImageData.set(currentImageData);
      lastAnalyzedTimestamp = now;
    }

    return {
      hasChanged,
      diffScore: Math.round(averageDiff),
      reason: hasChanged ? 'SCENE_DELTA' : 'STATIC_SCENE',
    };
  } catch (err) {
    console.warn('[SceneDetector] Error calculating scene difference:', err);
    lastAnalyzedTimestamp = now;
    return { hasChanged: true, diffScore: 50, reason: 'DETECTOR_ERROR_FALLBACK' };
  }
}

/**
 * Capture optimized JPEG snapshot from video element for AI analysis.
 * Target: ~1024px maximum dimension with 0.75 JPEG compression
 * for fast upload, smaller payloads, and reliable Gemini vision parsing.
 *
 * @param {HTMLVideoElement} video
 * @param {number} maxDimension
 * @param {number} quality
 * @returns {string|null} base64 data URL
 */
export function captureRepresentativeFrame(video, maxDimension = 1024, quality = 0.75) {
  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // Strict validation: video must have current data and non-zero dimensions
  if (
    !video ||
    typeof video.readyState !== 'number' ||
    video.readyState < 2 || // HTMLMediaElement.HAVE_CURRENT_DATA
    !video.videoWidth ||
    !video.videoHeight ||
    video.videoWidth <= 0 ||
    video.videoHeight <= 0
  ) {
    return null;
  }

  const canvas = document.createElement('canvas');
  let width = video.videoWidth;
  let height = video.videoHeight;

  // Scale down large camera frames (keeps aspect ratio)
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  if (width <= 0 || height <= 0) return null;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  // Validate output: must be a non-trivial JPEG string
  if (!dataUrl || !dataUrl.startsWith('data:image/jpeg;base64,') || dataUrl.length < 200) {
    console.warn('[SceneDetector] Generated empty or invalid canvas image data.');
    return null;
  }

  const captureDuration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
  const approxSizeBytes = Math.round((dataUrl.length * 3) / 4);

  const result = {
    base64: dataUrl,
    width,
    height,
    mimeType: 'image/jpeg',
    sizeBytes: approxSizeBytes,
    captureMs: captureDuration,
    toString: () => dataUrl,
  };

  return result;
}

/**
 * Reset stored reference frame and timestamp
 */
export function resetSceneDetector() {
  previousImageData = null;
  lastAnalyzedTimestamp = 0;
}
