// app/lib/offlineAuth.js
"use client";

const USER_KEY = "offline_user";
const PIN_KEY = "offline_pin_hash";

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const offlineAuth = {
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
  async hasPin() {
    return !!localStorage.getItem(PIN_KEY);
  },
  async setPin(pin) {
    const user = await this.getUser();
    if (!user) throw new Error("No cached user");
    const hash = await sha256(`${user.email}|${pin}`);
    localStorage.setItem(PIN_KEY, hash);
  },
  async verifyPin(pin) {
    const user = await this.getUser();
    if (!user) return false;
    const saved = localStorage.getItem(PIN_KEY);
    // If no PIN set, allow offline without PIN
    if (!saved) return true;
    const hash = await sha256(`${user.email}|${pin}`);
    return hash === saved;
  },
  clear() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PIN_KEY);
  },
};
