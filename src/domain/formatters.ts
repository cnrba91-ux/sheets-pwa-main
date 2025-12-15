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
    const num = Number(value);

    if (isNaN(num)) {
        return value;
    }

    return `₹ ${num.toLocaleString('en-IN')}`;
}
