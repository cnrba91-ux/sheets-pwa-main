export interface Transaction {
    date: string;         // YYYY-MM-DD
    bank: string;         // e.g., "HDFC"
    account: string;      // e.g., "D-0902"
    refId: string;
    narration: string;    // Raw narration from bank
    payee: string;        // Clean merchant name
    debit: number;        // Debit amount
    credit: number;       // Credit amount
    netAmount: number;    // Net amount
    flow: string;         // "In", "Out", "CC_Purchase", "CC_Payment", "Transfer", "Savings"
    category: string;
    exclude: string; // "Yes" | "No"
    note: string;
    tags: string;
    linkedAccount: string;  // For transfers/CC payments: the other account
    linkedRefId: string;    // Group related transactions (e.g., billing cycle)
}

export interface Account {
    bank: string;
    accNum: string;
}

export interface Category {
    flow: string;
    category: string;
}

// Actual Google Sheet structure (16 columns)
export const SCHEMA = [
    'Date',
    'Bank',
    'Account',
    'Ref ID',
    'Narration',
    'Payee',
    'Debit',
    'Credit',
    'Net Amount',
    'Flow',
    'Category',
    'Exclude',
    'Note',
    'Tags',
    'Linked Account',
    'Linked Ref ID'
] as const;

export type SchemaColumn = typeof SCHEMA[number];

export function rowToTransaction(row: string[]): Transaction {
    return {
        date: row[0] || '',
        bank: row[1] || '',
        account: row[2] || '',
        refId: row[3] || '',
        narration: row[4] || '',
        payee: row[5] || '',
        debit: parseFloat((row[6] || '0').replace(/[^\d.-]/g, '')) || 0,
        credit: parseFloat((row[7] || '0').replace(/[^\d.-]/g, '')) || 0,
        netAmount: parseFloat((row[8] || '0').replace(/[^\d.-]/g, '')) || 0,
        flow: row[9] || '',
        category: row[10] || '',
        exclude: row[11] || 'No',
        note: row[12] || '',
        tags: row[13] || '',
        linkedAccount: row[14] || '',
        linkedRefId: row[15] || '',
    };
}

export function transactionToRow(t: Transaction): string[] {
    return [
        t.date,
        t.bank,
        t.account,
        t.refId,
        t.narration,
        t.payee,
        t.debit.toString(),
        t.credit.toString(),
        t.netAmount.toString(),
        t.flow,
        t.category,
        t.exclude,
        t.note,
        t.tags,
        t.linkedAccount,
        t.linkedRefId
    ];
}
