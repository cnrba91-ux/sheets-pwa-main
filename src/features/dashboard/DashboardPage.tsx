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
            const flow = r[9] || '';
            const exclude = r[11] || 'No';

            // Skip excluded transactions
            if (exclude === 'Yes') return;

            const credit = Math.abs(parseFloat((r[7] || '0').replace(/[^\d.-]/g, '')) || 0);
            const debit = Math.abs(parseFloat((r[6] || '0').replace(/[^\d.-]/g, '')) || 0);

            // Income: credits from "In" flow (salary, cashback, etc.)
            if (flow === 'In' && credit > 0) {
                tIncome += credit;
            }

            // Expenses: debits from Out, CC_Purchase, Savings
            // EXCLUDE: CC_Payment and Transfer (these are just moving money)
            if (['Out', 'CC_Purchase', 'Savings'].includes(flow) && debit > 0) {
                tExpense += debit;
            }

            const month = getMonthYear(r[0]);
            if (!month) return;

            if (!stats[month]) stats[month] = { income: 0, expense: 0 };

            // Monthly income
            if (flow === 'In' && credit > 0) {
                stats[month].income += credit;
            }

            // Monthly expenses (exclude CC_Payment and Transfer)
            if (['Out', 'CC_Purchase', 'Savings'].includes(flow) && debit > 0) {
                stats[month].expense += debit;
            }

            // Matrix data for Out, CC_Purchase, Savings, and Transfer
            if (['Out', 'CC_Purchase', 'Savings', 'Transfer'].includes(flow)) {
                matrixItems.push({
                    month,
                    flow,
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
