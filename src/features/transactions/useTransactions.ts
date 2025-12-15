import { useMemo, useState } from 'react';
import { readSheet } from '../../sheets/sheetsApi';
import { CATEGORY_MAP } from '../../domain/categories';

/* ================= TYPES ================= */

export type Filters = {
    bank: string[];
    acc: string[];
    month: string[];
    inout: string[];
    category: string[];
    calc: string[];
};

/* ================= HOOK ================= */

export function useTransactions() {
    const [rows, setRows] = useState<string[][]>([]);

    const [filters, setFilters] = useState<Filters>({
        bank: [],
        acc: [],
        month: [],
        inout: [],
        category: [],
        calc: []
    });

    /* ---------- data load ---------- */

    const loadTransactions = async (
        spreadsheetId: string,
        range: string,
        accessToken: string
    ) => {
        const data = await readSheet(spreadsheetId, range, accessToken);
        setRows(data);
    };

    const headers = rows[0] || [];
    const dataRows = rows.slice(1);

    /* ---------- slicer helpers ---------- */

    const distinct = (idx: number): string[] =>
        Array.from(new Set(dataRows.map(r => r[idx]).filter(Boolean)));

    /* ---------- filtering ---------- */

    const filteredRows = useMemo(() => {
        return dataRows.filter(r =>
            (!filters.bank.length || filters.bank.includes(r[0])) &&
            (!filters.acc.length || filters.acc.includes(r[1])) &&
            (!filters.month.length || filters.month.includes(r[3])) &&
            (!filters.inout.length || filters.inout.includes(r[5])) &&
            (!filters.category.length || filters.category.includes(r[6])) &&
            (!filters.calc.length || filters.calc.includes(r[8]))
        );
    }, [dataRows, filters]);

    /* ---------- cell update ---------- */

    const updateCell = (rowIdx: number, colIdx: number, value: string) => {
        setRows(prev => {
            const copy = [...prev];
            copy[rowIdx + 1] = [...copy[rowIdx + 1]];
            copy[rowIdx + 1][colIdx] = value;

            // enforce category validity when In/Out changes
            if (colIdx === 5) {
                const allowed = CATEGORY_MAP[value] || [];
                if (!allowed.includes(copy[rowIdx + 1][6])) {
                    copy[rowIdx + 1][6] = '';
                }
            }

            return copy;
        });
    };

    return {
        headers,
        rows,
        dataRows,
        filteredRows,
        filters,
        setFilters,
        distinct,
        updateCell,
        loadTransactions
    };
}
