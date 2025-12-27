import { useMemo } from 'react';
import { getMonthYear } from '../../domain/formatters';
import { IncomeExpenseChart } from './components/IncomeExpenseChart';
import { DashboardStats } from './components/DashboardStats';
import { CategoryMatrix } from './components/CategoryMatrix';
import styles from './DashboardPage.module.css';

interface Props {
    data: string[][];
}

export function DashboardPage({ data }: Props) {
    const { monthlyData, totalIncome, totalExpense, matrixData, months } = useMemo(() => {
        const stats: Record<string, { income: number; expense: number }> = {};
        const matrixItems: Array<{ month: string, flow: string, category: string, amount: number }> = [];
        let tIncome = 0;
        let tExpense = 0;

        data.forEach(r => {
            const credit = Math.abs(parseFloat((r[7] || '0').replace(/[^\d.-]/g, '')) || 0);
            const debit = Math.abs(parseFloat((r[6] || '0').replace(/[^\d.-]/g, '')) || 0);

            tIncome += credit;
            tExpense += debit;

            const month = getMonthYear(r[0]);
            if (!month) return;

            if (!stats[month]) stats[month] = { income: 0, expense: 0 };
            stats[month].income += credit;
            stats[month].expense += debit;

            // Matrix data for Out, Savings, and Transfer
            if (r[9] === 'Out' || r[9] === 'Savings' || r[9] === 'Transfer') {
                matrixItems.push({
                    month,
                    flow: r[9],
                    category: r[10] || 'Uncategorized',
                    amount: debit
                });
            }
        });

        const sortedMonthly = Object.entries(stats)
            .map(([month, vals]) => ({
                month,
                ...vals
            }))
            .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        const monthList = sortedMonthly.map(m => m.month);

        return {
            monthlyData: sortedMonthly,
            totalIncome: tIncome,
            totalExpense: tExpense,
            matrixData: matrixItems,
            months: monthList
        };
    }, [data]);

    return (
        <div className={styles.canvas}>
            <h1 className={styles.title}>Analytics Overview</h1>

            <DashboardStats
                totalIncome={totalIncome}
                totalExpense={totalExpense}
            />

            <div className={styles.grid}>
                <div className={styles.chartSlot}>
                    <IncomeExpenseChart data={monthlyData} />
                </div>
                <div className={styles.matrixSlot}>
                    <CategoryMatrix data={matrixData} months={months} />
                </div>
            </div>
        </div>
    );
}
