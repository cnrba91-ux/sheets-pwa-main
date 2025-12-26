import { useState, useMemo } from 'react';
import { FLOW_OPTIONS } from '../../domain/categories';
import styles from './MatrixTable.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    categoryMap: Record<string, string[]>;
    formatDate: (v: string) => string;
    formatAmount: (v: string) => string;
};

const INITIAL_ROWS = 200;
const INCREMENT = 200;

export function MatrixTable({
    headers,
    rows,
    updateCell,
    isDirty,
    categoryMap,
    formatDate,
    formatAmount
}: Props) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);

    // Reset visible count when filters change (rows change)
    useMemo(() => {
        setVisibleCount(INITIAL_ROWS);
    }, [rows]);

    const visibleRows = rows.slice(0, visibleCount);
    const hasMore = rows.length > visibleCount;

    return (
        <section className={styles.wrap}>
            {/* Desktop Table View */}
            <div className={styles.desktopOnly}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {headers.map(h => (
                                <th key={h} className={styles.th}>{h}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {visibleRows.map((row, i) => {
                            const needsAttention = !row[10] || row[10] === 'Select';
                            return (
                                <tr key={i} className={needsAttention ? styles.rowAttention : ''}>
                                    {headers.map((_, j) => {
                                        const cell = row[j] ?? '';
                                        const isFlow = j === 9;
                                        const isCategory = j === 10;
                                        const isImpactsBudget = j === 11;
                                        const isNote = j === 12;

                                        const categories = categoryMap[row[9] ?? ''] || [];

                                        return (
                                            <td key={j} className={`${styles.td} ${isDirty(i, j) ? styles.dirty : ''}`}>
                                                {isFlow && (
                                                    <div className={styles.ghostWrapper}>
                                                        <select
                                                            className={`${styles.ghostSelect} ${cell === 'In' ? styles.textGreen : cell === 'Out' ? styles.textRed : styles.textBlue}`}
                                                            value={cell}
                                                            onChange={e => updateCell(i, j, e.target.value)}>
                                                            {FLOW_OPTIONS.map((o: string) => (
                                                                <option key={o} value={o}>{o}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {isCategory && (
                                                    <div className={styles.ghostWrapper}>
                                                        <select
                                                            className={styles.ghostSelect}
                                                            value={cell}
                                                            onChange={e => updateCell(i, j, e.target.value)}>
                                                            <option value="">Select</option>
                                                            {categories.map(o => (
                                                                <option key={o} value={o}>{o}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {isImpactsBudget && (
                                                    <div
                                                        className={styles.clickableText}
                                                        onClick={() => updateCell(i, j, cell === 'Yes' ? 'No' : 'Yes')}>
                                                        {cell}
                                                    </div>
                                                )}

                                                {isNote && (
                                                    <input
                                                        className={styles.noteInput}
                                                        value={cell}
                                                        onChange={e => updateCell(i, j, e.target.value)}
                                                        placeholder="Add note..."
                                                    />
                                                )}

                                                {!isFlow && !isCategory && !isImpactsBudget && !isNote && (
                                                    j === 0 ? <span className={styles.dateCell}>{formatDate(cell)}</span> :
                                                        j === 8 ? (
                                                            <span className={`${styles.amountCell} ${row[9] === 'In' ? styles.amountIn : row[9] === 'Out' ? styles.amountOut : ''}`}>
                                                                {formatAmount(cell)}
                                                            </span>
                                                        ) :
                                                            (j === 1 || j === 2 || j === 3 || j === 4) ? (
                                                                <span className={styles.secondaryText}>{cell}</span>
                                                            ) : (
                                                                <span title={cell}>{cell}</span>
                                                            )
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileOnly}>
                <div className={styles.cardList}>
                    {visibleRows.map((row, i) => {
                        const categories = categoryMap[row[9] ?? ''] || [];
                        const needsAttention = !row[10] || row[10] === 'Select';

                        return (
                            <div key={i} className={`${styles.card} ${needsAttention ? styles.cardAttention : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardMainInfo}>
                                        <span className={styles.cardPayee}>{row[5]}</span>
                                        <div className={styles.cardSubInfo}>
                                            <span>{row[1]} • {row[2]}</span>
                                            <span className={styles.secondaryText}>•</span>
                                            <span>{formatDate(row[0])}</span>
                                        </div>
                                    </div>
                                    <div className={`${styles.cardAmount} ${row[9] === 'In' ? styles.amountIn : row[9] === 'Out' ? styles.amountOut : ''}`}>
                                        {formatAmount(row[8])}
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Category</label>
                                        <div className={`${styles.mobileSelectWrapper} ${isDirty(i, 10) ? styles.dirtyBorder : ''}`}>
                                            <select
                                                className={styles.mobileSelect}
                                                value={row[10] ?? ''}
                                                onChange={e => updateCell(i, 10, e.target.value)}>
                                                <option value="">Select Category</option>
                                                {categories.map((o: string) => (
                                                    <option key={o}>{o}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Note</label>
                                        <div className={`${styles.mobileInputWrapper} ${isDirty(i, 12) ? styles.dirtyBorder : ''}`}>
                                            <textarea
                                                className={styles.mobileTextarea}
                                                value={row[12] ?? ''}
                                                onChange={e => updateCell(i, 12, e.target.value)}
                                                placeholder="Add a note..."
                                                rows={1}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.mobileSelectWrapper} style={{ width: 'fit-content' }}>
                                            <select
                                                className={styles.mobileSelect}
                                                style={{ paddingRight: '2.5rem' }}
                                                value={row[9]}
                                                onChange={e => updateCell(i, 9, e.target.value)}>
                                                {FLOW_OPTIONS.map((o: string) => (
                                                    <option key={o} value={o}>{o}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div
                                            className={styles.clickableText}
                                            onClick={() => updateCell(i, 11, row[11] === 'Yes' ? 'No' : 'Yes')}>
                                            Exclude: {row[11]}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {hasMore && (
                <div className={styles.loadMoreContainer}>
                    <button
                        className={styles.loadMoreBtn}
                        onClick={() => setVisibleCount(prev => prev + INCREMENT)}
                    >
                        Load More (Showing {visibleCount} of {rows.length})
                    </button>
                </div>
            )}
        </section>
    );
}