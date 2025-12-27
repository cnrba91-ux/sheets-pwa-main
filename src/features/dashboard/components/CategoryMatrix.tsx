import React, { useMemo } from 'react';
import styles from './CategoryMatrix.module.css';
import { formatCompactAmount } from '../../../domain/formatters';

interface MatrixData {
    month: string;
    flow: string;
    category: string;
    amount: number;
}

interface Props {
    data: MatrixData[];
    months: string[]; // List of months to show as columns
}

export function CategoryMatrix({ data, months }: Props) {
    const matrix = useMemo(() => {
        const flows = ['Out', 'Savings', 'Transfer'];
        const grid: Record<string, Record<string, number>> = {};
        const catTotals: Record<string, number> = {};
        const monthTotals: Record<string, number> = {};
        const flowTotals: Record<string, number> = {};
        let grandTotal = 0;

        // Initialize grid and populate totals
        data.forEach(d => {
            const key = `${d.flow}|${d.category}`;
            if (!grid[key]) {
                grid[key] = {};
                months.forEach(m => grid[key][m] = 0);
            }
            grid[key][d.month] += d.amount;
            catTotals[key] = (catTotals[key] || 0) + d.amount;
            monthTotals[d.month] = (monthTotals[d.month] || 0) + d.amount;
            flowTotals[d.flow] = (flowTotals[d.flow] || 0) + d.amount;
            grandTotal += d.amount;
        });

        const groupedCategories = flows.map(f => ({
            flow: f,
            total: flowTotals[f] || 0,
            items: Object.keys(catTotals)
                .filter(k => k.startsWith(`${f}|`))
                .sort((a, b) => catTotals[b] - catTotals[a])
        })).filter(g => g.items.length > 0);

        return {
            grid,
            groupedCategories,
            catTotals,
            monthTotals,
            grandTotal,
            maxAmount: Math.max(...Object.values(catTotals), 1)
        };
    }, [data, months]);

    const getHeatClass = (amount: number) => {
        if (amount <= 0) return styles.heatLevel0;
        const ratio = amount / (matrix.maxAmount / Math.max(months.length, 1));
        if (ratio < 0.1) return styles.heatLevel1;
        if (ratio < 0.3) return styles.heatLevel2;
        if (ratio < 0.6) return styles.heatLevel3;
        if (ratio < 1.0) return styles.heatLevel4;
        return styles.heatLevel5;
    };

    return (
        <div className={styles.card}>
            <div className={styles.title}>Spending Heatmap</div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={`${styles.th} ${styles.thSticky}`}>Category</th>
                            {months.map(m => (
                                <th key={m} className={styles.th}>{m.split(' ')[0]}</th>
                            ))}
                            <th className={`${styles.th} ${styles.thTotal}`}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.groupedCategories.map(group => (
                            <React.Fragment key={group.flow}>
                                <tr className={styles.flowRow}>
                                    <td colSpan={months.length + 2} className={styles.flowHeader}>
                                        {group.flow}
                                        <span className={styles.flowTotal}> — ₹ {formatCompactAmount(group.total)}</span>
                                    </td>
                                </tr>
                                {group.items.map(key => {
                                    const catName = key.split('|')[1];
                                    return (
                                        <tr key={key}>
                                            <td className={styles.tdCategory}>{catName || 'Uncategorized'}</td>
                                            {months.map(m => {
                                                const val = matrix.grid[key][m] || 0;
                                                return (
                                                    <td
                                                        key={m}
                                                        className={`${styles.td} ${styles.tdAmount} ${getHeatClass(val)}`}
                                                        title={`${catName} - ${m}: ${val.toLocaleString()}`}
                                                    >
                                                        {val > 0 ? formatCompactAmount(val) : '-'}
                                                    </td>
                                                );
                                            })}
                                            <td className={`${styles.td} ${styles.tdAmount} ${styles.thTotal}`} style={{ background: '#fdfdfd' }}>
                                                {formatCompactAmount(matrix.catTotals[key])}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}

                        {/* Footer Total Row */}
                        <tr className={styles.rowTotal}>
                            <td className={styles.tdCategory}>TOTAL</td>
                            {months.map(m => (
                                <td key={m} className={`${styles.td} ${styles.tdAmount}`}>
                                    {formatCompactAmount(matrix.monthTotals[m] || 0)}
                                </td>
                            ))}
                            <td className={`${styles.td} ${styles.tdAmount} ${styles.grandTotal}`}>
                                {formatCompactAmount(matrix.grandTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
