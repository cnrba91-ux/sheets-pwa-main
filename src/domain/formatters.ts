// src/domain/formatters.ts

export function formatDate(value: string): string {
    if (!value) return '';

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return value; // fallback if Google Sheets sends unexpected format
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export function formatAmount(value: string): string {
    const raw = value.replace(/[^\d.-]/g, '');
    const num = Number(raw);

    if (isNaN(num)) {
        return value;
    }

    const rounded = Math.round(num);
    return `₹ ${rounded.toLocaleString('en-IN')}`;
}
/**
 * Safely parses various date formats including DD/MM/YY and DD/MM/YYYY
 */
export function parseAnyDate(val: string): string {
    if (!val) return '0000-00-00';

    // Try manual parsing for DD/MM/YY or DD/MM/YYYY FIRST (Common in India/UK)
    const parts = val.split(/[/\-.]/);
    if (parts.length === 3) {
        const d1 = parseInt(parts[0]);
        const d2 = parseInt(parts[1]);
        const d3 = parseInt(parts[2]);

        if (!isNaN(d1) && !isNaN(d2) && !isNaN(d3)) {
            // Assume DD/MM/YY if d3 is small, or DD/MM/YYYY if d3 > 100
            let year = d3;
            if (year < 100) year += 2000;

            // Basic validation to ensure it's likely a date
            if (d2 >= 1 && d2 <= 12 && d1 >= 1 && d1 <= 31) {
                const date = new Date(year, d2 - 1, d1);
                // Adjust for local time zone offset to ensure ISO string is correct date
                const offset = date.getTimezoneOffset() * 60000;
                const localDate = new Date(date.getTime() - offset);
                if (!isNaN(date.getTime())) return localDate.toISOString().split('T')[0];
            }
        }
    }

    // Standard JS parsing fallback (e.g. for "10 Dec 2025" or ISO strings)
    let d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

    return '0000-00-00';
}

export function normalizePayee(payee: string): string {
    if (!payee) return '';
    return payee
        .toLowerCase()
        .replace(/^(upi|imps|neft|rtgs|pos|cash|tfr|vpa|atw|atm)-/g, '') // Remove bank prefixes
        .replace(/[^\w\s]/g, ' ') // Replace special characters with space
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
}

/**
 * Returns a set of unique words from a payee string for fuzzy matching.
 */
export function getPayeeWords(payee: string): Set<string> {
    const normalized = normalizePayee(payee);
    const stopWords = new Set(['dear', 'customer', 'debited', 'from', 'account', 'your', 'upi', 'transaction', 'reference', 'number', 'immediately', 'calling', 'block', 'authorised', 'auth', 'than', 'this', 'that', 'with', 'paid', 'sent', 'bank', 'vpa']);

    return new Set(
        normalized.split(' ')
            .filter(w => {
                // Keep words > 2 chars that aren't stop words
                if (w.length <= 2 || stopWords.has(w)) return false;
                // If it's a number, it must be at least 4 digits (to avoid dates/small amounts but catch Ref IDs)
                if (/^\d+$/.test(w) && w.length < 4) return false;
                return true;
            })
    );
}

/**
 * Extracts potential reference numbers (6+ digits) from a string.
 */
export function extractRefIds(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/\d{6,}/g);
    return matches || [];
}

/**
 * Generates a unique-ish fingerprint for a transaction to detect duplicates.
 * Format: date|amount|normalizedPayee
 */
export function getTransactionFingerprint(date: string, amount: string, payee: string): string {
    const d = parseAnyDate(date);
    const a = Math.abs(parseFloat(amount.replace(/[^\d.-]/g, '')) || 0).toFixed(0);
    const p = normalizePayee(payee).replace(/\s/g, ''); // Compact for fingerprint
    return `${d}|${a}|${p}`;
}

/**
 * Extracts month and year in MMM YYYY format (e.g., Dec 2025)
 * Handles local date correctly to avoid timezone shifts.
 */
export function getMonthYear(dateStr: string): string {
    if (!dateStr) return '';
    const iso = parseAnyDate(dateStr);
    if (iso === '0000-00-00') return '';

    // Create date from parts to treat it as local date (00:00:00 local)
    // transforming "2025-12-01" to Dec 1st, 00:00 local time
    const parts = iso.split('-');
    const safeDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    return safeDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}
