import { useMemo, useState } from 'react';
import styles from './IncomeExpenseChart.module.css';
import { formatAmount, formatCompactAmount } from '../../../domain/formatters';

interface ChartData {
    month: string;
    income: number;
    expense: number;
}

interface Props {
    data: ChartData[];
}

export function IncomeExpenseChart({ data }: Props) {
    const [hovered, setHovered] = useState<{ idx: number; type: 'income' | 'expense' } | null>(null);

    const chartData = useMemo(() => {
        // Take last 6 months to keep it clean
        return data.slice(-6);
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className={styles.card}>
                <div className={styles.title}>Monthly Income vs Expense</div>
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                    No data available
                </div>
            </div>
        );
    }

    const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1000);
    const height = 300;
    const width = 1000;
    const margin = { top: 40, right: 20, bottom: 60, left: 80 };

    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    const barWidth = (chartWidth / chartData.length) * 0.32;
    const gap = (chartWidth / chartData.length) * 0.08;


    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.title}>Monthly Performance</div>
                <div className={styles.legend}>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.dotIncome}`} />
                        Income
                    </div>
                    <div className={styles.legendItem}>
                        <div className={`${styles.dot} ${styles.dotExpense}`} />
                        Expense
                    </div>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg}>
                    <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => (
                        <g key={tick}>
                            <line
                                x1={margin.left}
                                y1={margin.top + chartHeight * (1 - tick)}
                                x2={width - margin.right}
                                y2={margin.top + chartHeight * (1 - tick)}
                                className={styles.gridLine}
                            />
                            <text
                                x={margin.left - 10}
                                y={margin.top + chartHeight * (1 - tick) + 4}
                                className={`${styles.label} ${styles.yLabel}`}
                            >
                                {tick === 0 ? '0' : formatCompactAmount(maxVal * tick)}
                            </text>
                        </g>
                    ))}

                    {/* Bars */}
                    {chartData.map((d, i) => {
                        const x = margin.left + (i * (chartWidth / chartData.length)) + (chartWidth / chartData.length / 2);
                        const iHeight = (d.income / maxVal) * chartHeight;
                        const eHeight = (d.expense / maxVal) * chartHeight;

                        return (
                            <g key={d.month} className={styles.barGroup}>
                                {/* Income Bar */}
                                <rect
                                    x={x - barWidth - gap / 2}
                                    y={margin.top + chartHeight - iHeight}
                                    width={barWidth}
                                    height={iHeight}
                                    rx="4"
                                    className={`${styles.bar} ${styles.incomeBar}`}
                                    onMouseEnter={() => setHovered({ idx: i, type: 'income' })}
                                    onMouseLeave={() => setHovered(null)}
                                />
                                {iHeight > 10 && (
                                    <text
                                        x={x - barWidth / 2 - gap / 2}
                                        y={margin.top + chartHeight - iHeight - 5}
                                        className={`${styles.dataLabel} ${styles.incomeLabel}`}
                                    >
                                        {formatCompactAmount(d.income)}
                                    </text>
                                )}

                                {/* Expense Bar */}
                                <rect
                                    x={x + gap / 2}
                                    y={margin.top + chartHeight - eHeight}
                                    width={barWidth}
                                    height={eHeight}
                                    rx="4"
                                    className={`${styles.bar} ${styles.expenseBar}`}
                                    onMouseEnter={() => setHovered({ idx: i, type: 'expense' })}
                                    onMouseLeave={() => setHovered(null)}
                                />
                                {eHeight > 10 && (
                                    <text
                                        x={x + barWidth / 2 + gap / 2}
                                        y={margin.top + chartHeight - eHeight - 5}
                                        className={`${styles.dataLabel} ${styles.expenseLabel}`}
                                    >
                                        {formatCompactAmount(d.expense)}
                                    </text>
                                )}

                                {/* X-Axis Label */}
                                <text
                                    x={x}
                                    y={height - margin.bottom + 20}
                                    className={styles.label}
                                >
                                    {d.month}
                                </text>
                            </g>
                        );
                    })}

                    <line
                        x1={margin.left}
                        y1={margin.top + chartHeight}
                        x2={width - margin.right}
                        y2={margin.top + chartHeight}
                        className={styles.axis}
                    />
                </svg>

                {hovered && (
                    <div
                        className={styles.tooltip}
                        style={{
                            left: margin.left + (hovered.idx * (chartWidth / chartData.length)) + (chartWidth / chartData.length / 2),
                            top: margin.top + chartHeight - ((hovered.type === 'income' ? chartData[hovered.idx].income : chartData[hovered.idx].expense) / maxVal * chartHeight) - 40,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{chartData[hovered.idx].month}</div>
                        <div style={{ color: hovered.type === 'income' ? '#34d399' : '#f87171' }}>
                            {hovered.type === 'income' ? 'Income: ' : 'Expense: '}
                            {formatAmount(String(hovered.type === 'income' ? chartData[hovered.idx].income : chartData[hovered.idx].expense))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
