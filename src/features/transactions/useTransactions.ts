import { useMemo, useState } from 'react';
import { readSheet, batchUpdateSheet, appendRows } from '../../sheets/sheetsApi';
import { CATEGORY_MAP } from '../../domain/categories';
import { getTransactionFingerprint, parseAnyDate, getMonthFromDate, getPayeeWords } from '../../domain/formatters';

/* ================= TYPES ================= */

export type Filters = {
    bank: string[];
    acc: string[];
    month: string[];
    inout: string[];
    category: string[];
    calc: string[];
    attentionOnly: boolean;
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
    const [attentionIndices, setAttentionIndices] = useState<Set<number>>(new Set());

    const [filters, setFilters] = useState<Filters>({
        bank: [],
        acc: [],
        month: [],
        inout: [],
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
        const data = await readSheet(spreadsheetId, range, accessToken);

        // First pass: build a map of (Payee + InOut) -> Category for auto-tagging
        // Row indices: 4 is Payee, 5 is In/Out, 6 is Category
        const payeeMap: Record<string, string> = {};
        data.forEach((r: string[], i: number) => {
            if (i === 0) return;
            const payee = r[4]?.trim().toLowerCase();
            const inOut = r[5]?.trim();
            const category = r[6]?.trim();

            if (payee && inOut && category && category !== 'Select' && category !== '') {
                const key = `${payee}|${inOut}`;
                payeeMap[key] = category;
            }
        });

        // Second pass: Process rows and apply auto-tagging
        const newPending: Record<string, PendingChange> = {};
        const attention = new Set<number>();

        const processed = data.map((r: string[], i: number) => {
            if (i === 0) return r; // headers
            const copy = [...r];

            const categoryEmpty = !copy[6] || copy[6] === 'Select' || copy[6] === '';
            const inCalcEmpty = !copy[8] || copy[8].trim() === '';

            // 1. Auto-tag Category if empty and we have a history for this payee
            if (categoryEmpty) {
                const payee = copy[4]?.trim().toLowerCase();
                const inOut = copy[5]?.trim();
                const key = `${payee}|${inOut}`;
                const suggested = payeeMap[key];

                if (suggested) {
                    copy[6] = suggested;
                    newPending[`${i}-6`] = { rowIdx: i, colIdx: 6, value: suggested };
                }
                // Still add to attention so user reviews it (it will show as "resolved" but dirty)
                attention.add(i);
            }

            // 2. Auto-default In/Calc (8) to 'Yes' if blank
            if (inCalcEmpty) {
                copy[8] = 'Yes';
                newPending[`${i}-8`] = { rowIdx: i, colIdx: 8, value: 'Yes' };
                attention.add(i);
            }

            return copy;
        });

        setRows(processed);
        setPendingChanges(prev => ({ ...prev, ...newPending }));
        setAttentionIndices(attention);
        setCreds({ spreadsheetId, range, accessToken });
    };

    const headers = useMemo(() => rows[0] || [], [rows]);
    const dataRows = useMemo(() => rows.slice(1) as string[][], [rows]);

    /* ---------- slicer helpers (optimized) ---------- */

    const distinctValues = useMemo(() => {
        const maps: Record<number, Set<string>> = {
            0: new Set(), 1: new Set(), 3: new Set(),
            5: new Set(), 6: new Set(), 8: new Set()
        };
        dataRows.forEach(r => {
            [0, 1, 3, 5, 6, 8].forEach(idx => {
                const val = r[idx] || '';
                maps[idx].add(val);
            });
        });
        return maps;
    }, [dataRows]);

    const distinct = (idx: number): string[] =>
        Array.from(distinctValues[idx] || []).sort();

    /* ---------- filtering & sorting ---------- */

    const filteredRows = useMemo(() => {
        // First, augment rows with their original index to survive sorting/filtering
        const augmented = dataRows.map((r, i) => ({ data: r, index: i + 1 }));

        const filtered = augmented.filter(({ data: r, index: originalIdx }) => {
            // Apply Attention filter if active - it acts as a base filter
            if (filters.attentionOnly && !attentionIndices.has(originalIdx)) {
                return false;
            }

            // Combine with other active filters
            const matchesBank = !filters.bank.length || filters.bank.includes(r[0] || '');
            const matchesAcc = !filters.acc.length || filters.acc.includes(r[1] || '');
            const matchesMonth = !filters.month.length || filters.month.includes(r[3] || '');
            const matchesInout = !filters.inout.length || filters.inout.includes(r[5] || '');
            const matchesCategory = !filters.category.length || filters.category.includes(r[6] || '');
            const matchesCalc = !filters.calc.length || filters.calc.includes(r[8] || '');

            return matchesBank && matchesAcc && matchesMonth && matchesInout && matchesCategory && matchesCalc;
        });

        // Sort by Date (index 2) - Latest First
        return filtered.sort((a, b) => {
            const timeA = new Date(a.data[2]).getTime();
            const timeB = new Date(b.data[2]).getTime();
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });
    }, [dataRows, filters, pendingChanges, attentionIndices]);

    const actionCount = useMemo(() => {
        return attentionIndices.size;
    }, [attentionIndices]);


    /* ---------- cell update (local only) ---------- */

    const updateCell = (originalIdx: number, colIdx: number, value: string) => {
        setRows(prev => {
            const copy = [...prev];
            copy[originalIdx] = [...copy[originalIdx]];
            copy[originalIdx][colIdx] = value;

            // Check if this row now needs attention (if it didn't before)
            const categoryEmpty = !copy[originalIdx][6] || copy[originalIdx][6] === 'Select' || copy[originalIdx][6] === '';
            const inCalcEmpty = !copy[originalIdx][8] || copy[originalIdx][8].trim() === '';
            if (categoryEmpty || inCalcEmpty) {
                setAttentionIndices(prevSet => {
                    const next = new Set(prevSet);
                    next.add(originalIdx);
                    return next;
                });
            }

            // enforce category validity when In/Out changes
            if (colIdx === 5) {
                const allowed = CATEGORY_MAP[value] || [];
                if (!allowed.includes(copy[originalIdx][6])) {
                    copy[originalIdx][6] = '';
                    // also track the cleared category as a pending change
                    setPendingChanges(prev => ({
                        ...prev,
                        [`${originalIdx}-6`]: { rowIdx: originalIdx, colIdx: 6, value: '' }
                    }));
                }
            }
            return copy;
        });

        // Add to pending changes
        setPendingChanges(prev => ({
            ...prev,
            [`${originalIdx}-${colIdx}`]: { rowIdx: originalIdx, colIdx, value }
        }));
    };

    /* ---------- batch save ---------- */

    const saveChanges = async () => {
        if (!creds || Object.keys(pendingChanges).length === 0) return;

        setIsSyncing(true);
        try {
            const sheetName = creds.range.includes('!') ? creds.range.split('!')[0] : '';
            const changesArray = Object.values(pendingChanges);

            await batchUpdateSheet(
                creds.spreadsheetId,
                sheetName,
                changesArray,
                creds.accessToken
            );

            setPendingChanges({});
            // Reset attention indices to only those that STILL need it after save
            setAttentionIndices(() => {
                const next = new Set<number>();
                dataRows.forEach((r, i) => {
                    const idx = i + 1;
                    const catEmpty = !r[6] || r[6] === 'Select' || r[6] === '';
                    const calcEmpty = !r[8] || r[8].trim() === '';
                    if (catEmpty || calcEmpty) next.add(idx);
                });
                return next;
            });
            alert('Successfully saved all changes to Google Sheets!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSyncing(false);
        }
    };

    const importTransactions = async (newRows: string[][], bank: string, acc: string) => {
        if (!creds) return;
        setIsSyncing(true);
        try {
            // Fingerprint includes Bank + Acc for better uniqueness if applicable, 
            // but the user wants deduplication against EXISTING rows.
            // Existing rows already have bank/acc.
            const existingFingerprints = new Set<string>();
            dataRows.forEach(r => {
                existingFingerprints.add(getTransactionFingerprint(r[2], r[7], r[4]));
            });

            const toImport: string[][] = [];
            let duplicateCount = 0;

            for (const row of newRows) {
                // Pre-fill metadata
                row[0] = bank;
                row[1] = acc;

                // Auto-Month from Date (row[2])
                if (row[2]) {
                    row[3] = getMonthFromDate(row[2]);
                }

                // Default In/Out to 'Out' if not provided (row[5])
                if (!row[5]) {
                    row[5] = 'Out';
                }

                // Default In Calc? to 'Yes' (row[8])
                row[8] = 'Yes';

                const fingerprint = getTransactionFingerprint(row[2], row[7], row[4]);
                if (existingFingerprints.has(fingerprint)) {
                    duplicateCount++;
                    continue;
                }

                const fuzzyMatch = dataRows.find(r => {
                    const dateMatch = parseAnyDate(r[2]) === parseAnyDate(row[2]);
                    const amountMatch = Math.abs(parseFloat(r[7].replace(/[^\d.-]/g, ''))) === Math.abs(parseFloat(row[7].replace(/[^\d.-]/g, '')));

                    if (dateMatch && amountMatch) {
                        const newWords = getPayeeWords(row[4]);
                        const existingWords = getPayeeWords(r[4]);
                        const noteWords = getPayeeWords(r[9] || '');

                        // Check if narrations share significant words
                        const intersection = Array.from(newWords).filter(w => existingWords.has(w) || noteWords.has(w));

                        // If they share at least 1 significant word (>2 chars) on same date/amount, it's a duplicate
                        return intersection.length > 0;
                    }
                    return false;
                });

                if (fuzzyMatch) {
                    duplicateCount++;
                    continue;
                }

                // Ensure row has correct length (10 columns A-J)
                const fullRow = new Array(10).fill('');
                row.forEach((val, idx) => { if (idx < 10) fullRow[idx] = val; });
                toImport.push(fullRow);
            }

            if (toImport.length > 0) {
                await appendRows(creds.spreadsheetId, creds.range, toImport, creds.accessToken);
                await loadTransactions(creds.spreadsheetId, creds.range, creds.accessToken);
                alert(`Imported ${toImport.length} transactions. Skipped ${duplicateCount} duplicates.`);
            } else {
                alert(`No new transactions found. ${duplicateCount} duplicates skipped.`);
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import transactions.');
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
            return originalIdx !== undefined && !!pendingChanges[`${originalIdx}-${colIdx}`];
        },
        updateCell: (displayIdx: number, colIdx: number, value: string) => {
            const originalIdx = filteredRows[displayIdx]?.index;
            if (originalIdx !== undefined) {
                updateCell(originalIdx, colIdx, value);
            }
        },
        loadTransactions,
        actionCount,
        importTransactions,
        isAttentionDone: (displayIdx: number) => {
            const row = filteredRows[displayIdx]?.data;
            if (!row) return false;
            const categoryDone = !!row[6] && row[6] !== 'Select' && row[6] !== '';
            const inCalcDone = !!row[8] && row[8].trim() !== '';
            return categoryDone && inCalcDone;
        }
    };
}
