/**
 * LocalStorage Utility for UI State Only
 * 
 * @description ONLY for UI state management.
 * NEVER store sensitive data (name, address, KTP, phone) here.
 */

// Allowed keys for UI state
export const UI_KEYS = {
    ACTIVE_GUEST_ID: 'activeGuestId',
    SELECTED_GUEST_ID: 'selectedGuestId',  // For reusing existing guest
    SELECTED_ROOMS: 'selectedRoomNumbers',
    CURRENT_FLOW: 'currentFlowStep',
    PAYMENT_METHOD: 'selectedPaymentMethod',
    LAST_PAGE: 'lastVisitedPage',
} as const;

export type UIKey = typeof UI_KEYS[keyof typeof UI_KEYS];
export type FlowStep = 'form' | 'preview' | 'print';
export type PaymentMethodUI = 'CASH' | 'QRIS';

// ============================================
// Generic Getters/Setters
// ============================================

/**
 * Set UI state value
 */
export function setUIState(key: UIKey, value: string | string[] | null): void {
    if (value === null) {
        localStorage.removeItem(key);
    } else if (Array.isArray(value)) {
        localStorage.setItem(key, JSON.stringify(value));
    } else {
        localStorage.setItem(key, value);
    }
}

/**
 * Get UI state value as string
 */
export function getUIState(key: UIKey): string | null {
    return localStorage.getItem(key);
}

/**
 * Get UI state value as array
 */
export function getUIStateArray(key: UIKey): string[] {
    const value = localStorage.getItem(key);
    if (!value) return [];
    try {
        return JSON.parse(value);
    } catch {
        return [];
    }
}

/**
 * Clear single UI state
 */
export function clearUIState(key: UIKey): void {
    localStorage.removeItem(key);
}

/**
 * Clear all UI state (after transaction complete or checkout)
 */
export function clearAllUIState(): void {
    Object.values(UI_KEYS).forEach((key) => {
        localStorage.removeItem(key);
    });
}

// ============================================
// Specific State Helpers
// ============================================

/**
 * Get active guest ID from UI state
 */
export function getActiveGuestId(): string | null {
    return getUIState(UI_KEYS.ACTIVE_GUEST_ID);
}

/**
 * Set active guest ID
 */
export function setActiveGuestId(id: string | null): void {
    setUIState(UI_KEYS.ACTIVE_GUEST_ID, id);
}

/**
 * Get selected room numbers
 */
export function getSelectedRooms(): string[] {
    return getUIStateArray(UI_KEYS.SELECTED_ROOMS);
}

/**
 * Set selected room numbers
 */
export function setSelectedRooms(rooms: string[]): void {
    setUIState(UI_KEYS.SELECTED_ROOMS, rooms);
}

/**
 * Add room to selection
 */
export function addSelectedRoom(roomNumber: string): void {
    const current = getSelectedRooms();
    if (!current.includes(roomNumber)) {
        setSelectedRooms([...current, roomNumber]);
    }
}

/**
 * Remove room from selection
 */
export function removeSelectedRoom(roomNumber: string): void {
    const current = getSelectedRooms();
    setSelectedRooms(current.filter((r) => r !== roomNumber));
}

/**
 * Clear room selection
 */
export function clearSelectedRooms(): void {
    clearUIState(UI_KEYS.SELECTED_ROOMS);
}

/**
 * Get current flow step
 */
export function getCurrentFlowStep(): FlowStep {
    const step = getUIState(UI_KEYS.CURRENT_FLOW);
    if (step === 'form' || step === 'preview' || step === 'print') {
        return step;
    }
    return 'form';
}

/**
 * Set current flow step
 */
export function setCurrentFlowStep(step: FlowStep): void {
    setUIState(UI_KEYS.CURRENT_FLOW, step);
}

/**
 * Get selected payment method
 */
export function getSelectedPaymentMethod(): PaymentMethodUI | null {
    const method = getUIState(UI_KEYS.PAYMENT_METHOD);
    if (method === 'CASH' || method === 'QRIS') {
        return method;
    }
    return null;
}

/**
 * Set selected payment method
 */
export function setSelectedPaymentMethod(method: PaymentMethodUI | null): void {
    setUIState(UI_KEYS.PAYMENT_METHOD, method);
}

/**
 * Get last visited page
 */
export function getLastVisitedPage(): string | null {
    return getUIState(UI_KEYS.LAST_PAGE);
}

/**
 * Set last visited page
 */
export function setLastVisitedPage(page: string): void {
    setUIState(UI_KEYS.LAST_PAGE, page);
}

// ============================================
// Transaction Lifecycle
// ============================================

/**
 * Clear all transaction-related state
 * Call this after receipt is printed
 */
export function clearTransactionState(): void {
    clearUIState(UI_KEYS.SELECTED_ROOMS);
    clearUIState(UI_KEYS.CURRENT_FLOW);
    clearUIState(UI_KEYS.PAYMENT_METHOD);
}

/**
 * Clear all state after final checkout
 * Call this when guest checks out all rooms
 */
export function clearCheckoutState(): void {
    clearUIState(UI_KEYS.ACTIVE_GUEST_ID);
    clearUIState(UI_KEYS.SELECTED_ROOMS);
    clearUIState(UI_KEYS.CURRENT_FLOW);
    clearUIState(UI_KEYS.PAYMENT_METHOD);
}
