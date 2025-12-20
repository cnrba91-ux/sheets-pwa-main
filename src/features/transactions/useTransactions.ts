import { useMemo, useState } from 'react';
import { readSheet, batchUpdateSheet } from '../../sheets/sheetsApi';
import { CATEGORY_MAP } from '../../domain/categories';

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

        // Auto-default In/Calc (8) to 'Yes' if blank
        const newPending: Record<string, PendingChange> = {};
        const attention = new Set<number>();

        const processed = data.map((r: string[], i: number) => {
            if (i === 0) return r; // headers
            const copy = [...r];

            const categoryEmpty = !copy[6] || copy[6] === 'Select' || copy[6] === '';
            const inCalcEmpty = !copy[8] || copy[8].trim() === '';

            // If In/Calc (8) is blank, default to 'Yes'
            if (inCalcEmpty) {
                copy[8] = 'Yes';
                newPending[`${i}-8`] = { rowIdx: i, colIdx: 8, value: 'Yes' };
                attention.add(i);
            }

            if (categoryEmpty) {
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
    }, [dataRows, filters, pendingChanges]);

    const actionCount = useMemo(() => {
        return dataRows.filter((r) => {
            const row = r;
            const categoryEmpty = !row[6] || row[6] === 'Select' || row[6] === '';
            const inCalcEmpty = !row[8] || row[8].trim() === '';
            return categoryEmpty || inCalcEmpty;
        }).length;
    }, [dataRows]);

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
        isAttentionDone: (displayIdx: number) => {
            const row = filteredRows[displayIdx]?.data;
            if (!row) return false;
            const categoryDone = !!row[6] && row[6] !== 'Select' && row[6] !== '';
            const inCalcDone = !!row[8] && row[8].trim() !== '';
            return categoryDone && inCalcDone;
        }
    };
}
