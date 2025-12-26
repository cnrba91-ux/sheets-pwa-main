import { useMemo, useState } from 'react';
import { readSheet, batchUpdateSheet, appendRows } from '../../sheets/sheetsApi';
import { getMonthYear, getTransactionFingerprint } from '../../domain/formatters';
import { SCHEMA } from '../../domain/types';
import { CATEGORY_MAP, ACCOUNTS } from '../../domain/categories';

/* ================= TYPES ================= */

export type Filters = {
    bank: string[];
    account: string[];
    month: string[];
    flow: string[];
    category: string[];
    calc: string[];
    attentionOnly?: boolean;
};



type Credentials = {
    spreadsheetId: string;
    range: string;
    accessToken: string;
} | null;

type PendingChange = {
    rowIdx: number;
    colIdx: number;
    value: string;
};

/* ================= HOOK ================= */

export function useTransactions() {
    const [rows, setRows] = useState<string[][]>([]);
    const [creds, setCreds] = useState<Credentials>(null);
    const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});
    const [isSyncing, setIsSyncing] = useState(false);

    const [filters, setFilters] = useState<Filters>({
        bank: [],
        account: [],
        month: [],
        flow: [],
        category: [],
        calc: [],
        attentionOnly: false
    });

    /* ---------- data load ---------- */

    const loadTransactions = async (
        spreadsheetId: string,
        range: string,
        accessToken: string
    ) => {
        setIsSyncing(true);
        try {
            // Load Main Transactions
            let data = await readSheet(spreadsheetId, range, accessToken).catch(() => []);

            // If Transcations sheet is empty or headers missing, initialize it
            if (data.length === 0 || !data[0] || data[0][0] !== SCHEMA[0]) {
                const headerRow = [...SCHEMA];
                await appendRows(spreadsheetId, range, [headerRow], accessToken);
                data = [headerRow];
            }

            // First pass: auto-tagging map (payee + flow -> category)
            const payeeMap: Record<string, string> = {};
            data.forEach((r: string[], i: number) => {
                if (i === 0) return;
                const payee = (r[5] || '').trim().toLowerCase();
                const flow = (r[9] || '').trim();
                const category = (r[10] || '').trim();
                if (payee && flow && category && category !== 'Select' && category !== '') {
                    payeeMap[`${payee}|${flow}`] = category;
                }
            });

            const newPending: Record<string, PendingChange> = {};

            const processed = data.map((r: string[], i: number) => {
                if (i === 0) return r;
                // Ensure row has full length of SCHEMA (fill missing trailing columns with empty strings)
                const copy = new Array(SCHEMA.length).fill('');
                r.forEach((val, k) => { if (k < SCHEMA.length) copy[k] = val; });

                // Auto-fill Category based on previous history
                const categoryEmpty = !copy[10] || copy[10] === 'Select' || copy[10] === '';
                const excludeEmpty = !copy[11] || copy[11].trim() === '';

                if (categoryEmpty) {
                    const payee = (copy[5] || '').trim().toLowerCase();
                    const flow = (copy[9] || '').trim();
                    const key = `${payee}|${flow}`;
                    const suggested = payeeMap[key];
                    if (suggested) {
                        copy[10] = suggested;
                        newPending[`${i}-10`] = { rowIdx: i, colIdx: 10, value: suggested };
                    }
                }

                if (excludeEmpty) {
                    copy[11] = 'No';
                    newPending[`${i}-11`] = { rowIdx: i, colIdx: 11, value: 'No' };
                }

                return copy;
            });

            setRows(processed);
            setPendingChanges(prev => ({ ...prev, ...newPending }));
            setCreds({ spreadsheetId, range, accessToken });
        } catch (error) {
            console.error('Load failed:', error);
            alert('Failed to load transactions. Check console for details.');
        } finally {
            setIsSyncing(false);
        }
    };

    const headers = SCHEMA;
    const dataRows = useMemo(() => rows.slice(1) as string[][], [rows]);

    /* ---------- slicer helpers ---------- */

    const distinctValues = useMemo(() => {
        // Updated indices: 1: Bank, 2: Account, 9: Flow, 10: Category, 11: Exclude
        const maps: Record<string, Set<string>> = {
            1: new Set(), 2: new Set(), 9: new Set(), 10: new Set(), 11: new Set(),
            month: new Set()
        };
        dataRows.forEach(r => {
            [1, 2, 9, 10, 11].forEach(idx => {
                const val = (r[idx] || '').trim();
                if (val) maps[idx].add(val);
            });
            // Extract Month
            const m = getMonthYear(r[0]);
            if (m) maps['month'].add(m);
        });
        return maps;
    }, [dataRows]);

    const distinct = (key: number | 'month'): string[] => {
        const arr = Array.from(distinctValues[key] || []);
        if (key === 'month') {
            // Sort months chronologically descending
            return arr.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        }
        return arr.sort();
    };

    /* ---------- filtering & sorting ---------- */

    const filteredRows = useMemo(() => {
        const augmented = dataRows.map((r, i) => ({ data: r, index: i + 1 }));

        const filtered = augmented.filter(({ data: r, index: actualRowIdx }) => {
            const matchesBank = !filters.bank.length || filters.bank.includes(r[1] || '');
            const matchesAcc = !filters.account.length || filters.account.includes(r[2] || '');
            const matchesMonth = !filters.month.length || filters.month.includes(getMonthYear(r[0]));
            const matchesFlow = !filters.flow.length || filters.flow.includes(r[9] || '');
            const matchesCategory = !filters.category.length || filters.category.includes(r[10] || '');
            const matchesExclude = !filters.calc.length || filters.calc.includes(r[11] || '');

            const needsAttention = !r[10] || r[10] === 'Select'; // Category empty
            const isDirty = !!pendingChanges[`${actualRowIdx}-10`]; // Locally modified category

            if (filters.attentionOnly && !needsAttention && !isDirty) return false;

            return matchesBank && matchesAcc && matchesMonth && matchesFlow && matchesCategory && matchesExclude;
        });

        return filtered.sort((a, b) => {
            const timeA = new Date(a.data[0]).getTime();
            const timeB = new Date(b.data[0]).getTime();
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
    }, [dataRows, filters]);

    const attentionCount = useMemo(() => {
        return dataRows.filter(r => !r[10] || r[10] === 'Select').length;
    }, [dataRows]);

    const updateCell = (originalIdx: number, colIdx: number, value: string) => {
        setRows(prev => {
            const copy = [...prev];
            copy[originalIdx] = [...copy[originalIdx]];
            copy[originalIdx][colIdx] = value;
            return copy;
        });

        setPendingChanges(prev => ({
            ...prev,
            [`${originalIdx}-${colIdx}`]: { rowIdx: originalIdx, colIdx, value }
        }));
    };

    const saveChanges = async () => {
        if (!creds || Object.keys(pendingChanges).length === 0) return;
        setIsSyncing(true);
        try {
            const sheetName = creds.range.split('!')[0];
            await batchUpdateSheet(creds.spreadsheetId, sheetName, Object.values(pendingChanges), creds.accessToken);
            setPendingChanges({});

            // If we were in "New Entries" view and everything is tagged, go back to all transactions
            if (filters.attentionOnly) {
                const stillNeedsAttention = rows.slice(1).some(r => !r[10] || r[10] === 'Select');
                if (!stillNeedsAttention) {
                    setFilters(prev => ({ ...prev, attentionOnly: false }));
                }
            }

            alert('Changes saved!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save.');
        } finally {
            setIsSyncing(false);
        }
    };

    const importTransactions = async (newRows: string[][]) => {
        if (!creds) return;
        setIsSyncing(true);
        try {
            const existingRefIds = new Set(dataRows.map(r => r[3]).filter(id => id));
            const existingFingerprints = new Set(dataRows.map(r => getTransactionFingerprint(r[0], r[8], r[5])));

            const toImport: string[][] = [];
            let duplicates = 0;

            for (const row of newRows) {
                // Check 1: Ref ID (Strongest Match)
                if (row[3] && existingRefIds.has(row[3])) {
                    duplicates++;
                    continue;
                }

                // Check 2: Fingerprint (Heuristic Match for missing Ref IDs)
                const fingerprint = getTransactionFingerprint(row[0], row[8], row[5]);
                if (existingFingerprints.has(fingerprint)) {
                    duplicates++;
                    continue;
                }

                const fullRow = new Array(SCHEMA.length).fill('');
                row.forEach((v, idx) => { if (idx < SCHEMA.length) fullRow[idx] = v; });
                toImport.push(fullRow);
            }

            if (toImport.length > 0) {
                await appendRows(creds.spreadsheetId, creds.range, toImport, creds.accessToken);
                await loadTransactions(creds.spreadsheetId, creds.range, creds.accessToken);
                alert(`Imported ${toImport.length}. Skipped ${duplicates}.`);
            } else {
                alert(`No new rows. ${duplicates} skipped.`);
            }
        } finally {
            setIsSyncing(false);
        }
    };

    return {
        headers,
        rows,
        dataRows,
        filteredRows: filteredRows.map(f => f.data),
        filters,
        setFilters,
        distinct,
        hasPendingChanges: Object.keys(pendingChanges).length > 0,
        isSyncing,
        saveChanges,
        isDirty: (displayIdx: number, colIdx: number) => {
            const originalIdx = filteredRows[displayIdx]?.index;
            return !!pendingChanges[`${originalIdx}-${colIdx}`];
        },
        updateCell: (displayIdx: number, colIdx: number, value: string) => {
            const originalIdx = filteredRows[displayIdx]?.index;
            if (originalIdx) updateCell(originalIdx, colIdx, value);
        },
        loadTransactions,
        importTransactions,
        categoryMap: CATEGORY_MAP,
        accounts: ACCOUNTS,
        attentionCount
    };
}
