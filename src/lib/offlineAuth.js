"use client";

const USER_KEY = "offline_user";
const RECORD_KEY = "offlineAuth.record"; // device-provision record (salt+blob etc)
const SESSION_KEY = "offline_session"; // short-lived offline session

// device policy keys (localStorage) written by /admin/settings
const POLICY_PREFIX = "admin_settings:";
const POLICY_KEYS = {
  autoLockMinutes: "autoLockMinutes",
  maxAttempts: "maxAttempts",
  cooldownSeconds: "cooldownSeconds",
};

// runtime/offline flags
const LOCK_KEY = "offlineAuth:locked";
const LAST_ACTIVITY_KEY = "offlineAuth:lastActivity";

// defaults
const MIN_PIN = 6;
const DEFAULT_SESSION_HOURS = 12;
// legacy fallback if policy missing
const LEGACY_MAX_TRIES = 5;
const DEFAULT_MAX_ATTEMPTS = 6; // matches your settings UI default
const DEFAULT_COOLDOWN_SECONDS = 30;
const DEFAULT_AUTOLOCK_MINUTES = 10;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(u8) {
  return btoa(String.fromCharCode(...u8));
}
function fromB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function clamp(n, min, max) {
  const x = Number.isFinite(Number(n)) ? Number(n) : min;
  return Math.min(max, Math.max(min, x));
}

// ---- policy read (admin_settings:*) ----
function policyGet(key, fallback) {
  try {
    const raw = localStorage.getItem(POLICY_PREFIX + key);
    if (raw == null) return fallback;
    // settings page stores JSON values
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readDevicePolicy(rec) {
  // if table/settings missing, fallback to record->legacy constants
  const fallbackMax =
    (rec && typeof rec.maxTries === "number" ? rec.maxTries : null) ??
    DEFAULT_MAX_ATTEMPTS ??
    LEGACY_MAX_TRIES;

  return {
    autoLockMinutes: clamp(
      policyGet(POLICY_KEYS.autoLockMinutes, DEFAULT_AUTOLOCK_MINUTES),
      0,
      240
    ),
    maxAttempts: clamp(policyGet(POLICY_KEYS.maxAttempts, fallbackMax), 1, 20),
    cooldownSeconds: clamp(
      policyGet(POLICY_KEYS.cooldownSeconds, DEFAULT_COOLDOWN_SECONDS),
      0,
      600
    ),
  };
}

// ---- record helpers ----
function getRecord() {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setRecord(rec) {
  localStorage.setItem(RECORD_KEY, JSON.stringify(rec));
}

// ---- session helpers ----
function startSession(userId, hours = DEFAULT_SESSION_HOURS) {
  const exp = Date.now() + hours * 60 * 60 * 1000;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, exp }));
  try {
    sessionStorage.setItem("offline_mode", "1");
  } catch {}
  // unlocked state
  try {
    localStorage.removeItem(LOCK_KEY);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {}
}
function endSession() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem("offline_mode");
}
function hasActiveSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    return typeof s.exp === "number" && Date.now() < s.exp;
  } catch {
    return false;
  }
}

// ---- lock helpers ----
function isLocked() {
  try {
    return localStorage.getItem(LOCK_KEY) === "1";
  } catch {
    return false;
  }
}
function setLocked(flag) {
  try {
    localStorage.setItem(LOCK_KEY, flag ? "1" : "0");
  } catch {}
}
function touchActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {}
}
function getLastActivity() {
  try {
    const n = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(n) ? n : Date.now();
  } catch {
    return Date.now();
  }
}

// ---- crypto ----
async function deriveKey(pin, saltU8) {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltU8, iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function makeRecord(user, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = enc.encode(`ok:${user.id}:${user.email || ""}`);
  const blob = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload)
  );

  return {
    v: 2,
    userId: user.id,
    email: user.email ?? null,
    salt: toB64(salt),
    iv: toB64(iv),
    blob: toB64(blob),

    // lockout/attempt state
    tries: 0,
    lockUntil: 0,

    // keep for backward-compat fallback
    sessionHours: 12,
    maxTries: LEGACY_MAX_TRIES,
  };
}

async function verifyAgainstRecord(rec, pin) {
  const salt = fromB64(rec.salt);
  const iv = fromB64(rec.iv);
  const blob = fromB64(rec.blob);
  const key = await deriveKey(pin, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    blob
  );
  const plain = dec.decode(plainBuf);
  return plain.startsWith("ok:");
}

// ---- attempt/cooldown state ----
function getLockRemainingSeconds(rec) {
  const until = Number(rec?.lockUntil || 0);
  if (!until) return 0;
  const now = Date.now();
  return until > now ? Math.ceil((until - now) / 1000) : 0;
}

export const offlineAuth = {
  // ---------- cached user ----------
  async saveUser({ id, email, name, role }) {
    localStorage.setItem(USER_KEY, JSON.stringify({ id, email, name, role }));
  },
  async getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  },

  // ---------- capability & session ----------
  isEnabled() {
    return !!getRecord();
  },
  hasPin() {
    return !!getRecord();
  },
  hasActiveSession,

  // ---------- lock state ----------
  isLocked() {
    return isLocked();
  },
  lock() {
    // lock immediately + end offline session
    setLocked(true);
    endSession();
  },
  unlockFlag() {
    setLocked(false);
    touchActivity();
  },
  touchActivity() {
    touchActivity();
  },

  // seconds remaining if locked out by attempts
  getLockRemainingSeconds() {
    const rec = getRecord();
    return getLockRemainingSeconds(rec);
  },

  // info to show in UI
  getAttemptState() {
    const rec = getRecord();
    if (!rec) return null;
    const policy = readDevicePolicy(rec);

    const lockRemainingSeconds = getLockRemainingSeconds(rec);
    const tries = Number(rec.tries || 0);
    const attemptsLeft =
      lockRemainingSeconds > 0 ? 0 : Math.max(0, policy.maxAttempts - tries);

    return {
      tries,
      maxAttempts: policy.maxAttempts,
      attemptsLeft,
      lockRemainingSeconds,
      cooldownSeconds: policy.cooldownSeconds,
      autoLockMinutes: policy.autoLockMinutes,
    };
  },

  // ---------- provision / change / verify ----------
  async enable(userId, pin) {
    if (!pin || pin.length < MIN_PIN) throw new Error("PIN too short");
    const cached = await this.getUser();
    const user = cached?.id
      ? cached
      : { id: userId, email: cached?.email ?? null };
    if (!user?.id) throw new Error("No cached user");
    const rec = await makeRecord(user, pin);
    setRecord(rec);
    return true;
  },

  // Back-compat: setPin(pin) -> enable(currentUser, pin)
  async setPin(pin) {
    const user = await this.getUser();
    if (!user) throw new Error("No cached user");
    return this.enable(user.id, pin);
  },

  /**
   * New: detailed result (better for UI).
   * - ok
   * - reason: "ok" | "cooldown" | "wrong_pin" | "locked_out" | "not_provisioned"
   * - attemptsLeft / remainingSeconds
   */
  async verifyPinDetailed(pin) {
    const rec = getRecord();
    if (!rec) return { ok: false, reason: "not_provisioned" };

    const now = Date.now();
    const policy = readDevicePolicy(rec);

    // active lockout (cooldown)
    const remaining = getLockRemainingSeconds(rec);
    if (remaining > 0) {
      return { ok: false, reason: "cooldown", remainingSeconds: remaining };
    }

    try {
      const ok = await verifyAgainstRecord(rec, pin);
      if (!ok) throw new Error("bad pin");

      // success -> reset lockout + unlock flag
      rec.tries = 0;
      rec.lockUntil = 0;
      setRecord(rec);

      setLocked(false);
      startSession(rec.userId, rec.sessionHours || DEFAULT_SESSION_HOURS);
      touchActivity();

      return { ok: true, reason: "ok" };
    } catch {
      // wrong pin -> count attempts
      rec.tries = (rec.tries || 0) + 1;

      if (rec.tries >= policy.maxAttempts) {
        // lockout for fixed cooldownSeconds
        rec.lockUntil = now + policy.cooldownSeconds * 1000;
        rec.tries = 0; // reset tries after lockout window starts
        setRecord(rec);

        return {
          ok: false,
          reason: "locked_out",
          remainingSeconds: policy.cooldownSeconds,
        };
      }

      setRecord(rec);
      return {
        ok: false,
        reason: "wrong_pin",
        attemptsLeft: Math.max(0, policy.maxAttempts - rec.tries),
      };
    }
  },

  // Back-compat: keep boolean return
  async verifyPin(pin) {
    const res = await this.verifyPinDetailed(pin);
    return !!res.ok;
  },

  async changePin(oldPin, newPin) {
    const rec = getRecord();
    if (!rec) return false;
    if (!newPin || newPin.length < MIN_PIN) throw new Error("PIN too short");

    const ok = await verifyAgainstRecord(rec, oldPin).catch(() => false);
    if (!ok) return false;

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(newPin, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const payload = enc.encode(`ok:${rec.userId}:${rec.email || ""}`);
    const blob = new Uint8Array(
      await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload)
    );

    rec.salt = toB64(salt);
    rec.iv = toB64(iv);
    rec.blob = toB64(blob);
    rec.tries = 0;
    rec.lockUntil = 0;
    setRecord(rec);

    // keep unlocked session state consistent
    setLocked(false);
    touchActivity();

    return true;
  },

  disable() {
    localStorage.removeItem(RECORD_KEY);
    localStorage.removeItem(LOCK_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    endSession();
  },

  clear() {
    this.disable();
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Used by Settings "clear offline data"
   * Best effort wipe: record/session/lockout flags (keeps cached user).
   */
  async clearDevice() {
    try {
      localStorage.removeItem(RECORD_KEY);
      localStorage.removeItem(LOCK_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {}
    try {
      endSession();
    } catch {}
    return true;
  },

  /**
   * Auto-lock by inactivity. Call this once when offline area is unlocked.
   * Returns cleanup() to stop listeners.
   */
  startAutoLockTimer(onLock) {
    const rec = getRecord();
    const policy = readDevicePolicy(rec);

    if (policy.autoLockMinutes <= 0) return () => {};

    const mark = () => touchActivity();

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointerdown",
    ];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    mark();

    const interval = setInterval(() => {
      // if already locked or no active session, nothing to do
      if (isLocked()) return;
      if (!hasActiveSession()) return;

      const last = getLastActivity();
      const idleMs = Date.now() - last;
      const limitMs = policy.autoLockMinutes * 60 * 1000;

      if (idleMs >= limitMs) {
        setLocked(true);
        endSession();
        if (typeof onLock === "function") onLock();
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  },
};

export default offlineAuth;
