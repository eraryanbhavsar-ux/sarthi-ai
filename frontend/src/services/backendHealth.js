import api from './api.js';

/**
 * SARTHI Backend Health & Cold-Start Coordinator
 * 
 * Safely handles cloud PaaS (Render free-tier) container spin-ups.
 * - Prevents multiple duplicate health pings via inFlightPromise deduplication.
 * - Caches warm status for 60 seconds to avoid unnecessary network traffic.
 * - Surfaces waking state after 3.5s without premature client aborts.
 * - Supports graceful controlled retries with exponential backoff.
 */

let lastHealthyTime = 0;
const WARM_TTL_MS = 60000; // 60 seconds cache
let inFlightPromise = null;

export const backendHealth = {
  /**
   * Check if backend was confirmed healthy recently
   */
  isWarm() {
    return Date.now() - lastHealthyTime < WARM_TTL_MS;
  },

  /**
   * Mark backend as currently warm (called after any successful API response)
   */
  markWarm() {
    lastHealthyTime = Date.now();
  },

  /**
   * Execute a single deduplicated health check
   */
  async checkHealth({ timeoutMs = 90000, signal } = {}) {
    if (this.isWarm()) {
      return { status: 'healthy', cached: true };
    }

    // Share existing in-flight check to prevent server hammering
    if (inFlightPromise) {
      return inFlightPromise;
    }

    inFlightPromise = (async () => {
      try {
        const res = await api.get('/health', {
          timeout: timeoutMs,
          signal,
        });
        if (res.data?.status === 'healthy') {
          lastHealthyTime = Date.now();
          return { status: 'healthy', data: res.data };
        }
        throw new Error('Backend returned unexpected health status');
      } finally {
        inFlightPromise = null;
      }
    })();

    return inFlightPromise;
  },

  /**
   * Ensure backend is warm and ready before dispatching expensive operations.
   * Notifies caller if backend is waking up (takes > 3.5s).
   */
  async ensureReady({ onWakingStateChange, timeoutMs = 90000, signal, maxRetries = 1 } = {}) {
    if (this.isWarm()) {
      if (typeof onWakingStateChange === 'function') {
        onWakingStateChange(false);
      }
      return { ready: true, cached: true };
    }

    let wakingTimer = null;
    let didTriggerWaking = false;

    if (typeof onWakingStateChange === 'function') {
      wakingTimer = setTimeout(() => {
        didTriggerWaking = true;
        onWakingStateChange(true);
      }, 3500);
    }

    let attempts = 0;
    while (attempts <= maxRetries) {
      try {
        const result = await this.checkHealth({ timeoutMs, signal });
        if (wakingTimer) clearTimeout(wakingTimer);
        if (didTriggerWaking && typeof onWakingStateChange === 'function') {
          onWakingStateChange(false);
        }
        return { ready: true, attempts: attempts + 1, ...result };
      } catch (err) {
        attempts++;
        const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
        if (isAbort || attempts > maxRetries) {
          if (wakingTimer) clearTimeout(wakingTimer);
          if (typeof onWakingStateChange === 'function') {
            onWakingStateChange(false);
          }
          throw err;
        }
        // Controlled backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  },

  /**
   * Non-blocking background warmup ping
   */
  warmup() {
    if (!this.isWarm() && !inFlightPromise) {
      this.checkHealth({ timeoutMs: 90000 }).catch(() => {
        // Silent background catch
      });
    }
  },
};

export default backendHealth;
