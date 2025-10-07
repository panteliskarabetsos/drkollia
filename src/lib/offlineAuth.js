// app/lib/offlineAuth.js
"use client";

const USER_KEY = "offline_user";
const RECORD_KEY = "offlineAuth.record"; // device-provision record (salt+blob etc)
const SESSION_KEY = "offline_session"; // short-lived offline session
const MIN_PIN = 6;
const MAX_TRIES = 5;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(u8) {
  return btoa(String.fromCharCode(...u8));
}
function fromB64(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

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

function startSession(userId, hours = 12) {
  const exp = Date.now() + hours * 60 * 60 * 1000;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, exp }));
  try {
    sessionStorage.setItem("offline_mode", "1");
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
  const payload = enc.encode(`ok:${user.id}:${user.email || ""}`); // device-bound check blob
  const blob = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload)
  );
  return {
    v: 1,
    userId: user.id,
    email: user.email ?? null,
    salt: toB64(salt),
    iv: toB64(iv),
    blob: toB64(blob),
    tries: 0,
    lockUntil: 0,
    sessionHours: 12,
    maxTries: MAX_TRIES,
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
  }, // device is provisioned for offline (PIN set)
  hasPin() {
    return !!getRecord();
  }, // alias
  hasActiveSession, // true when user has unlocked with PIN (not expired)

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

  async verifyPin(pin) {
    const rec = getRecord();
    if (!rec) return false; // not provisioned → cannot unlock
    const now = Date.now();
    if (rec.lockUntil && now < rec.lockUntil) return false;

    try {
      const ok = await verifyAgainstRecord(rec, pin);
      if (!ok) throw new Error("bad pin");
      rec.tries = 0;
      rec.lockUntil = 0;
      setRecord(rec);
      startSession(rec.userId, rec.sessionHours);
      return true;
    } catch {
      // simple exponential backoff after MAX_TRIES
      rec.tries = (rec.tries || 0) + 1;
      if (rec.tries >= (rec.maxTries || MAX_TRIES)) {
        const over = rec.tries - (rec.maxTries || MAX_TRIES); // 0,1,2…
        const mins = Math.min(60, Math.max(1, 2 ** over)); // 1,2,4,8… up to 60
        rec.lockUntil = now + mins * 60_000;
      }
      setRecord(rec);
      return false;
    }
  },

  async changePin(oldPin, newPin) {
    const rec = getRecord();
    if (!rec) return false;
    if (!newPin || newPin.length < MIN_PIN) throw new Error("PIN too short");

    const ok = await verifyAgainstRecord(rec, oldPin).catch(() => false);
    if (!ok) return false;

    // Re-encrypt check blob with a fresh salt/iv and new PIN
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
    return true;
  },

  disable() {
    localStorage.removeItem(RECORD_KEY);
    endSession();
  },

  clear() {
    this.disable();
    localStorage.removeItem(USER_KEY);
  },
};

export default offlineAuth;
