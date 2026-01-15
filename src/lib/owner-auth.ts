/**
 * Owner Authentication Module
 * 
 * @description PIN-based authentication for Owner Admin Menu
 * - PIN stored as SHA-256 hash in IndexedDB
 * - Lockout after 3 failed attempts (15 minutes)
 * - Default PIN: 0000 (must be changed on first use)
 */

const LOCKOUT_KEY = 'owner_lockout';
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

interface LockoutState {
    failedAttempts: number;
    lockoutUntil: number | null;
}

// ============================================
// PIN Hashing with Web Crypto API
// ============================================

/**
 * Hash a PIN using SHA-256
 */
export async function hashPin(pin: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
    const inputHash = await hashPin(pin);
    return inputHash === storedHash;
}

// ============================================
// Lockout Management (LocalStorage)
// ============================================

/**
 * Get current lockout state
 */
export function getLockoutState(): LockoutState {
    try {
        const stored = localStorage.getItem(LOCKOUT_KEY);
        if (!stored) {
            return { failedAttempts: 0, lockoutUntil: null };
        }
        return JSON.parse(stored);
    } catch {
        return { failedAttempts: 0, lockoutUntil: null };
    }
}

/**
 * Save lockout state
 */
function saveLockoutState(state: LockoutState): void {
    localStorage.setItem(LOCKOUT_KEY, JSON.stringify(state));
}

/**
 * Check if currently locked out
 */
export function isLockedOut(): boolean {
    const state = getLockoutState();
    if (!state.lockoutUntil) return false;

    const now = Date.now();
    if (now >= state.lockoutUntil) {
        // Lockout expired, reset
        clearFailedAttempts();
        return false;
    }
    return true;
}

/**
 * Get remaining lockout time in seconds
 */
export function getRemainingLockoutTime(): number {
    const state = getLockoutState();
    if (!state.lockoutUntil) return 0;

    const now = Date.now();
    const remaining = state.lockoutUntil - now;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Record a failed PIN attempt
 * Returns true if now locked out
 */
export function recordFailedAttempt(): boolean {
    const state = getLockoutState();
    state.failedAttempts += 1;

    if (state.failedAttempts >= MAX_ATTEMPTS) {
        state.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
        saveLockoutState(state);
        return true;
    }

    saveLockoutState(state);
    return false;
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(): number {
    const state = getLockoutState();
    return Math.max(0, MAX_ATTEMPTS - state.failedAttempts);
}

/**
 * Clear failed attempts (on successful login or after lockout expires)
 */
export function clearFailedAttempts(): void {
    saveLockoutState({ failedAttempts: 0, lockoutUntil: null });
}

// ============================================
// Logo Tap Detection (Session State)
// ============================================

const TAP_SESSION_KEY = 'logo_tap_count';
const TAP_TIMEOUT_MS = 2000; // Reset after 2 seconds of no taps
const REQUIRED_TAPS = 5;

interface TapState {
    count: number;
    lastTapTime: number;
}

/**
 * Record a logo tap and check if menu should show
 * Returns true if tap count reached threshold
 */
export function recordLogoTap(): boolean {
    const now = Date.now();
    let state: TapState;

    try {
        const stored = sessionStorage.getItem(TAP_SESSION_KEY);
        state = stored ? JSON.parse(stored) : { count: 0, lastTapTime: 0 };
    } catch {
        state = { count: 0, lastTapTime: 0 };
    }

    // Reset if too much time has passed
    if (now - state.lastTapTime > TAP_TIMEOUT_MS) {
        state.count = 0;
    }

    state.count += 1;
    state.lastTapTime = now;

    sessionStorage.setItem(TAP_SESSION_KEY, JSON.stringify(state));

    if (state.count >= REQUIRED_TAPS) {
        // Reset tap count after successful reveal
        sessionStorage.removeItem(TAP_SESSION_KEY);
        return true;
    }

    return false;
}

/**
 * Get current tap count (for feedback)
 */
export function getCurrentTapCount(): number {
    try {
        const stored = sessionStorage.getItem(TAP_SESSION_KEY);
        if (!stored) return 0;
        const state: TapState = JSON.parse(stored);
        // Check if taps are still valid
        if (Date.now() - state.lastTapTime > TAP_TIMEOUT_MS) {
            return 0;
        }
        return state.count;
    } catch {
        return 0;
    }
}

// ============================================
// Default PIN Setup
// ============================================

// Default PIN hash for "0000"
export const DEFAULT_PIN_HASH = '9af15b336e6a9619928537df30b2e6a2376569fcf9d7e773eccede65606529a0';
