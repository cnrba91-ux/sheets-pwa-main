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
                const flow = debit > 0 ? 'Out' : 'In';

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
                    tags: ''
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
                const flow = isCredit ? 'Transfer' : 'Out';

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
                    tags: ''
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
                const flow = credit > 0 ? 'In' : 'Out';

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
                    tags: ''
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
