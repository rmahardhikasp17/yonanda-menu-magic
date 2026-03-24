/**
 * Validation Utilities for Hotel Yonanda
 *
 * Only validation logic lives here.
 * Formatting, masking, and cleaning utilities are in @/lib/utils.ts
 */

// Re-export from utils.ts for backward compatibility
export { maskKtp, maskPhone, maskAddress, formatCurrency, formatDate, formatShortDate, cleanKtpInput, cleanPhoneInput } from '@/lib/utils';

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

