import { useState, useMemo } from 'react';
import styles from './MatrixTable.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    categoryMap: Record<string, string[]>;
    formatDate: (v: string) => string;
    formatAmount: (v: string) => string;
    attentionOnly: boolean;
    isAttentionDone: (displayIdx: number) => boolean;
};

const INITIAL_ROWS = 100;
const INCREMENT = 200;

export function MatrixTable({
    headers,
    rows,
    updateCell,
    isDirty,
    categoryMap,
    formatDate,
    formatAmount,
    attentionOnly,
    isAttentionDone
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
                        {visibleRows.map((row, i) => (
                            <tr key={i} className={attentionOnly && isAttentionDone(i) ? styles.rowResolved : ''}>
                                {row.map((cell, j) => {
                                    const isInOut = j === 5;
                                    const isCategory = j === 6;
                                    const isInCalc = j === 8;
                                    const isNote = j === 9;

                                    const categories = categoryMap[row[5]] || [];

                                    return (
                                        <td key={j} className={`${styles.td} ${isDirty(i, j) ? styles.dirty : ''}`}>
                                            {isInOut && (
                                                <div
                                                    className={`${styles.pill} ${cell === 'In' ? styles.pillIn : styles.pillOut} ${styles.clickablePill}`}
                                                    onClick={() => updateCell(i, j, cell === 'In' ? 'Out' : 'In')}>
                                                    {cell}
                                                </div>
                                            )}

                                            {isCategory && (
                                                <div className={`${styles.ghostWrapper} ${attentionOnly ? styles.showArrow : ''}`}>
                                                    <select
                                                        className={styles.ghostSelect}
                                                        value={cell}
                                                        onChange={e => updateCell(i, j, e.target.value)}>
                                                        <option value="">Select</option>
                                                        {categories.map(o => (
                                                            <option key={o}>{o}</option>
                                                        ))}
                                                    </select>
                                                    <span className={styles.ghostLabel}>{cell || 'Select'}</span>
                                                </div>
                                            )}

                                            {isInCalc && (
                                                <div
                                                    className={`${styles.pill} ${cell === 'Yes' ? styles.pillYes : styles.pillNo} ${styles.clickablePill}`}
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

                                            {!isInOut && !isCategory && !isInCalc && !isNote && (
                                                j === 2 ? <span className={styles.dateCell}>{formatDate(cell)}</span> :
                                                    j === 7 ? (
                                                        <span className={`${styles.amountCell} ${row[5] === 'In' ? styles.amountIn : ''}`}>
                                                            {formatAmount(cell)}
                                                        </span>
                                                    ) :
                                                        (j === 0 || j === 1 || j === 3) ? (
                                                            <span className={styles.secondaryText}>{cell}</span>
                                                        ) : (
                                                            <span title={cell}>{cell}</span>
                                                        )
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileOnly}>
                <div className={styles.cardList}>
                    {visibleRows.map((row, i) => {
                        const categories = categoryMap[row[5]] || [];
                        const isResolved = attentionOnly && isAttentionDone(i);

                        return (
                            <div key={i} className={`${styles.card} ${isResolved ? styles.cardResolved : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardMainInfo}>
                                        <span className={styles.cardPayee}>{row[4]}</span>
                                        <div className={styles.cardSubInfo}>
                                            <span>{row[0]}</span>
                                            <span className={styles.dot}>•</span>
                                            <span>{formatDate(row[2])}</span>
                                        </div>
                                    </div>
                                    <div className={`${styles.cardAmount} ${row[5] === 'In' ? styles.amountIn : ''}`}>
                                        {formatAmount(row[7])}
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Category</label>
                                        <div className={`${styles.mobileSelectWrapper} ${isDirty(i, 6) ? styles.dirtyBorder : ''}`}>
                                            <select
                                                className={styles.mobileSelect}
                                                value={row[6]}
                                                onChange={e => updateCell(i, 6, e.target.value)}>
                                                <option value="">Select Category</option>
                                                {categories.map(o => (
                                                    <option key={o}>{o}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Note</label>
                                        <div className={`${styles.mobileInputWrapper} ${isDirty(i, 9) ? styles.dirtyBorder : ''}`}>
                                            <textarea
                                                className={styles.mobileTextarea}
                                                value={row[9]}
                                                onChange={e => updateCell(i, 9, e.target.value)}
                                                placeholder="Add a note..."
                                                rows={1}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div
                                            className={`${styles.pill} ${row[5] === 'In' ? styles.pillIn : styles.pillOut} ${styles.clickablePill}`}
                                            onClick={() => updateCell(i, 5, row[5] === 'In' ? 'Out' : 'In')}>
                                            {row[5]}
                                        </div>
                                        <div
                                            className={`${styles.pill} ${row[8] === 'Yes' ? styles.pillYes : styles.pillNo} ${styles.clickablePill}`}
                                            onClick={() => updateCell(i, 8, row[8] === 'Yes' ? 'No' : 'Yes')}>
                                            Calc: {row[8]}
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