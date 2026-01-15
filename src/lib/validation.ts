/**
 * Validation Utilities for Hotel Yonanda
 */

// ============================================
// Guest Validation
// ============================================

export interface GuestValidationResult {
    isValid: boolean;
    errors: {
        name?: string;
        address?: string;
        ktp_number?: string;
        phone?: string;
    };
}

export interface GuestInput {
    name: string;
    address: string;
    ktp_number: string;
    phone?: string;
}

/**
 * Validate guest input data
 */
export function validateGuestData(input: GuestInput): GuestValidationResult {
    const errors: GuestValidationResult['errors'] = {};

    // Name validation
    if (!input.name || input.name.trim().length === 0) {
        errors.name = 'Nama tamu wajib diisi';
    } else if (input.name.trim().length < 2) {
        errors.name = 'Nama tamu minimal 2 karakter';
    }

    // Address validation
    if (!input.address || input.address.trim().length === 0) {
        errors.address = 'Alamat wajib diisi';
    } else if (input.address.trim().length < 5) {
        errors.address = 'Alamat minimal 5 karakter';
    }

    // KTP validation
    if (!input.ktp_number || input.ktp_number.trim().length === 0) {
        errors.ktp_number = 'Nomor KTP wajib diisi';
    } else {
        const ktpClean = input.ktp_number.replace(/\D/g, '');
        if (ktpClean.length < 16) {
            errors.ktp_number = 'Nomor KTP harus 16 digit';
        } else if (ktpClean.length > 16) {
            errors.ktp_number = 'Nomor KTP maksimal 16 digit';
        }
    }

    // Phone validation (optional but if provided, must be valid)
    if (input.phone && input.phone.trim().length > 0) {
        const phoneClean = input.phone.replace(/\D/g, '');
        if (phoneClean.length < 10) {
            errors.phone = 'Nomor HP minimal 10 digit';
        } else if (phoneClean.length > 15) {
            errors.phone = 'Nomor HP maksimal 15 digit';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
}

// ============================================
// Masking Utilities
// ============================================

/**
 * Mask KTP number for public display
 * Example: "2434123456785647" → "2434********5647"
 */
export function maskKtp(ktp: string): string {
    if (!ktp || ktp.length <= 8) return ktp;
    const first = ktp.slice(0, 4);
    const last = ktp.slice(-4);
    const middle = '*'.repeat(ktp.length - 8);
    return `${first}${middle}${last}`;
}

/**
 * Mask phone number for public display
 * Example: "081234567890" → "0812****7890"
 */
export function maskPhone(phone: string): string {
    if (!phone || phone.length <= 8) return phone;
    const first = phone.slice(0, 4);
    const last = phone.slice(-4);
    const middle = '*'.repeat(phone.length - 8);
    return `${first}${middle}${last}`;
}

/**
 * Mask address for public display (partial)
 * Shows first 10 chars + "..."
 */
export function maskAddress(address: string): string {
    if (!address || address.length <= 15) return address;
    return address.slice(0, 10) + '...';
}

// ============================================
// Formatting Utilities
// ============================================

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(new Date(timestamp));
}

/**
 * Format short date (DD/MM/YYYY HH:mm)
 */
export function formatShortDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Clean KTP input (remove non-numeric characters)
 */
export function cleanKtpInput(input: string): string {
    return input.replace(/\D/g, '').slice(0, 16);
}

/**
 * Clean phone input (remove non-numeric characters)
 */
export function cleanPhoneInput(input: string): string {
    return input.replace(/\D/g, '').slice(0, 15);
}
