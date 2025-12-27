import styles from './DashboardStats.module.css';
import { formatAmount, formatCompactAmount } from '../../../domain/formatters';

interface Props {
    totalIncome: number;
    totalExpense: number;
}

export function DashboardStats({ totalIncome, totalExpense }: Props) {
    const savings = totalIncome - totalExpense;
    const savingsPercent = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <span className={styles.label}>Total Income</span>
                <span className={`${styles.value} ${styles.income}`}>
                    ₹ {formatCompactAmount(totalIncome)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{formatAmount(totalIncome)}</span>
            </div>

            <div className={styles.card}>
                <span className={styles.label}>Total Expense</span>
                <span className={`${styles.value} ${styles.expense}`}>
                    ₹ {formatCompactAmount(totalExpense)}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{formatAmount(totalExpense)}</span>
            </div>

            <div className={styles.card}>
                <span className={styles.label}>Net Savings</span>
                <span className={`${styles.value} ${styles.savings}`}>
                    ₹ {formatCompactAmount(savings)}
                </span>
                <span style={{ fontSize: '0.8rem', color: savings >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    {savingsPercent.toFixed(1)}% of income
                </span>
            </div>
        </div>
    );
}
