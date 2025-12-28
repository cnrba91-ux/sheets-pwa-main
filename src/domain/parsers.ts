import type { Transaction } from './types';
import { parseAnyDate } from './formatters';

export interface BankTemplate {
    name: string;
    id: string;
    detect: (text: string) => boolean;
    parse: (text: string, bank: string, accountName: string) => Transaction[];
}

// Helper to strip leading zeros from Ref IDs (e.g. 0000123 -> 123)
function cleanRefId(ref: string): string {
    if (!ref) return '';
    const cleaned = ref.replace(/['"]+/g, '').trim();
    if (/^\d+$/.test(cleaned)) {
        return cleaned.replace(/^0+/, '') || '0';
    }
    return cleaned;
}

// Helper to detect if a narration is a credit card payment
function isCCPaymentNarration(narration: string): boolean {
    const upper = narration.toUpperCase();
    return upper.includes('CREDIT CARD') ||
        upper.includes('CC PAYMENT') ||
        upper.includes('CARD PAYMENT') ||
        upper.includes('AUTOPAY') && upper.includes('CARD');
}

// Helper to detect if a narration is cashback/reward
function isCashbackNarration(narration: string): boolean {
    const upper = narration.toUpperCase();
    return upper.includes('CASHBACK') ||
        upper.includes('REWARD') ||
        upper.includes('CASH BACK');
}

// Helper to extract linked account from CC payment narration
function extractLinkedAccount(narration: string): string {
    const upper = narration.toUpperCase();

    // Try to extract bank name
    if (upper.includes('AXIS')) return 'AXIS CC';
    if (upper.includes('HDFC')) return 'HDFC CC';
    if (upper.includes('ICICI')) return 'ICICI CC';
    if (upper.includes('SBI')) return 'SBI CC';
    if (upper.includes('KOTAK')) return 'KOTAK CC';

    return '';
}

// Helper to generate billing cycle reference (e.g., "NOV_2025_BILL")
function getBillingCycleRef(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${month}_${year}_BILL`;
}


export const BANK_TEMPLATES: BankTemplate[] = [
    {
        name: 'HDFC Savings',
        id: 'hdfc-savings',
        detect: (text) => text.includes('Narration') && text.includes('Chq./Ref.No.'),
        parse: (text, bank, accountName) => {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const headerIdx = lines.findIndex(l => l.includes('Narration'));
            if (headerIdx === -1) return [];

            // Dynamic Column Mapping
            const headers = lines[headerIdx].split('\t').map(h => h.trim().toLowerCase());
            const dateIdx = headers.findIndex(h => h.includes('date'));
            const narrationIdx = headers.findIndex(h => h.includes('narration'));
            const refIdx = headers.findIndex(h => h.includes('ref.no') || h.includes('chq'));
            const debitIdx = headers.findIndex(h => h.includes('withdrawal') || h.includes('debit'));
            const creditIdx = headers.findIndex(h => h.includes('deposit') || h.includes('credit'));

            const dataLines = lines.slice(headerIdx + 1);

            return dataLines.map(line => {
                const cols = line.split('\t');
                const date = parseAnyDate(cols[dateIdx] || '');
                const narration = cols[narrationIdx] || '';
                const ref = refIdx !== -1 ? cols[refIdx] : '';

                const debitStr = (debitIdx !== -1 ? cols[debitIdx] : '0') || '0';
                const creditStr = (creditIdx !== -1 ? cols[creditIdx] : '0') || '0';

                const debit = parseFloat(debitStr.replace(/[^\d.-]/g, '')) || 0;
                const credit = parseFloat(creditStr.replace(/[^\d.-]/g, '')) || 0;

                const netAmount = credit - debit;

                // Smart flow detection
                let flow = debit > 0 ? 'Out' : 'In';
                let linkedAccount = '';
                let linkedRefId = '';

                // Detect CC payment
                if (debit > 0 && isCCPaymentNarration(narration)) {
                    flow = 'CC_Payment';
                    linkedAccount = extractLinkedAccount(narration);
                    linkedRefId = getBillingCycleRef(date);
                }

                return {
                    date,
                    bank,
                    account: accountName,
                    refId: cleanRefId(ref),
                    narration,
                    payee: extractPayee(narration),
                    debit,
                    credit,
                    netAmount,
                    flow,
                    category: '',
                    exclude: 'No',
                    note: '',
                    tags: '',
                    linkedAccount,
                    linkedRefId
                };
            });
        }
    },
    {
        name: 'Axis Credit Card',
        id: 'axis-cc',
        detect: (text) => text.includes('Transaction Details') && text.includes('Debit/Credit'),
        parse: (text, bank, accountName) => {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const headerIdx = lines.findIndex(l => l.includes('Transaction Details'));
            if (headerIdx === -1) return [];
            const dataLines = lines.slice(headerIdx + 1);

            return dataLines.map(line => {
                const cols = line.split('\t');
                const date = parseAnyDate(cols[0] || '');
                const narration = cols[1] || '';
                const amount = parseFloat((cols[3] || '0').replace(/[^\d.-]/g, '')) || 0;
                const isCredit = (cols[4] || '').includes('Credit');

                // Smart flow detection for CC
                let flow: string;
                let linkedAccount = '';
                let linkedRefId = getBillingCycleRef(date);

                if (isCredit) {
                    // Credit on CC = either payment received or cashback
                    if (isCashbackNarration(narration)) {
                        flow = 'In'; // Cashback is income
                    } else {
                        flow = 'CC_Payment'; // Payment received from bank account
                        // Try to detect which bank account paid
                        linkedAccount = extractLinkedAccount(narration) || 'Bank Account';
                    }
                } else {
                    // Debit on CC = purchase
                    flow = 'CC_Purchase';
                }

                return {
                    date,
                    bank,
                    account: accountName,
                    refId: '',
                    narration,
                    payee: extractPayee(narration),
                    debit: isCredit ? 0 : amount,
                    credit: isCredit ? amount : 0,
                    netAmount: isCredit ? amount : -amount,
                    flow,
                    category: '',
                    exclude: 'No',
                    note: '',
                    tags: '',
                    linkedAccount,
                    linkedRefId
                };
            });
        }
    },
    {
        name: 'IDFC Savings',
        id: 'idfc-savings',
        detect: (text) => text.includes('Transaction Date') && text.includes('Particulars') && text.includes('Cheque No.'),
        parse: (text, bank, accountName) => {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const headerIdx = lines.findIndex(l => l.includes('Transaction Date'));
            if (headerIdx === -1) return [];

            const headers = lines[headerIdx].split('\t').map(h => h.trim().toLowerCase());
            const dateIdx = headers.findIndex(h => h.includes('transaction date'));
            const narrationIdx = headers.findIndex(h => h.includes('particulars'));
            const refIdx = headers.findIndex(h => h.includes('cheque'));
            const debitIdx = headers.findIndex(h => h.includes('debit'));
            const creditIdx = headers.findIndex(h => h.includes('credit'));

            const dataLines = lines.slice(headerIdx + 1);

            return dataLines.map(line => {
                const cols = line.split('\t');
                const date = parseAnyDate(cols[dateIdx] || '');
                const narration = (cols[narrationIdx] || '').trim();
                const ref = refIdx !== -1 ? cols[refIdx] : '';

                const debitStr = (debitIdx !== -1 ? cols[debitIdx] : '0') || '0';
                const creditStr = (creditIdx !== -1 ? cols[creditIdx] : '0') || '0';

                const debit = parseFloat(debitStr.replace(/[^\d.-]/g, '')) || 0;
                const credit = parseFloat(creditStr.replace(/[^\d.-]/g, '')) || 0;

                const netAmount = credit - debit;

                // Smart flow detection
                let flow = credit > 0 ? 'In' : 'Out';
                let linkedAccount = '';
                let linkedRefId = '';

                // Detect CC payment
                if (debit > 0 && isCCPaymentNarration(narration)) {
                    flow = 'CC_Payment';
                    linkedAccount = extractLinkedAccount(narration);
                    linkedRefId = getBillingCycleRef(date);
                }

                return {
                    date,
                    bank,
                    account: accountName,
                    refId: cleanRefId(ref),
                    narration,
                    payee: extractPayee(narration),
                    debit,
                    credit,
                    netAmount,
                    flow,
                    category: '',
                    exclude: 'No',
                    note: '',
                    tags: '',
                    linkedAccount,
                    linkedRefId
                };
            });
        }
    }
];

function extractPayee(narration: string): string {
    if (!narration) return 'Unknown';

    // 1. Common UPI patterns: UPI/NAME/REF/... or UPI/REF/NAME/...
    if (narration.toUpperCase().startsWith('UPI')) {
        const parts = narration.split('/');
        // Often the 2nd or 3rd part is the name/merchant
        const candidate = parts[2] || parts[3] || parts[1] || narration;
        if (candidate && !/^\d+$/.test(candidate)) {
            return candidate.trim();
        }
    }

    // 2. Generic separators
    let p = narration.split('-')[1] || narration.split('to VPA')[1] || narration;
    p = p.split('-')[0].trim();
    if (!p) p = narration;

    // Clean up numbers and extra spaces
    return p.replace(/\d+/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() || 'Unknown';
}
