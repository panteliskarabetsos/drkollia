const LS_PREFIX = "admin_settings:";

function safeJsonGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function clamp(n, min, max) {
  const x = Number.isFinite(Number(n)) ? Number(n) : min;
  return Math.min(max, Math.max(min, x));
}

export function readOfflineDevicePolicy() {
  return {
    autoLockMinutes: clamp(safeJsonGet("autoLockMinutes", 10), 0, 240),
    maxAttempts: clamp(safeJsonGet("maxAttempts", 6), 1, 20),
    cooldownSeconds: clamp(safeJsonGet("cooldownSeconds", 30), 0, 600),
  };
}
