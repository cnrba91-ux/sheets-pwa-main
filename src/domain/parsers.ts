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
                    note: ''
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
                    note: ''
                };
            });
        }
    },
    {
        name: 'IDFC Savings',
        id: 'idfc-savings',
        detect: (text) => text.includes('Payment type') && text.includes('Transaction description'),
        parse: (text, bank, accountName) => {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const headerIdx = lines.findIndex(l => l.includes('Payment type'));
            if (headerIdx === -1) return [];
            const dataLines = lines.slice(headerIdx + 1);

            return dataLines.map(line => {
                const cols = line.split('\t');
                const date = parseAnyDate(cols[0] || '');
                const narration = cols[2] || '';
                const amountStr = (cols[5] || '0').replace(/[^\d.-]/g, '');
                const netAmount = parseFloat(amountStr);
                const flow = netAmount < 0 ? 'Out' : 'In';

                return {
                    date,
                    bank,
                    account: accountName,
                    refId: '',
                    narration,
                    payee: extractPayee(narration),
                    debit: netAmount < 0 ? Math.abs(netAmount) : 0,
                    credit: netAmount > 0 ? netAmount : 0,
                    netAmount,
                    flow,
                    category: '',
                    exclude: 'No',
                    note: ''
                };
            });
        }
    }
];

function extractPayee(narration: string): string {
    if (!narration) return 'Unknown';
    let p = narration.split('-')[1] || narration.split('to VPA')[1] || narration;
    p = p.split('-')[0].trim();
    if (!p) p = narration;
    return p.replace(/\d+/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() || 'Unknown';
}
