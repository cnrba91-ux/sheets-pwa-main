import React, { useState, useMemo } from 'react';
import { FLOW_OPTIONS } from '../../domain/categories';
import { getMonthYear } from '../../domain/formatters';
import { TagInput } from './components/TagInput';
import styles from './MatrixTable.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    categoryMap: Record<string, string[]>;
    allTags: string[];
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
    allTags,
    formatDate,
    formatAmount
}: Props) {
    const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);
    const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

    const toggleMonth = (month: string) => {
        setCollapsedMonths(prev => {
            const next = new Set(prev);
            if (next.has(month)) next.delete(month);
            else next.add(month);
            return next;
        });
    };

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
                            {[1, 2, 4, 5, 8, 9, 10, 13, 12, 11, 14, 15].map((idx) => (
                                <th key={idx} className={styles.th}>{headers[idx]}</th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {(() => {
                            let lastMonth = '';
                            let lastDate = '';
                            return visibleRows.map((row, i) => {
                                const currentMonth = getMonthYear(row[0]) || 'Unknown';
                                const currentDate = formatDate(row[0]);

                                const showMonthHeader = currentMonth !== lastMonth;
                                const isCollapsed = collapsedMonths.has(currentMonth);

                                if (showMonthHeader) lastMonth = currentMonth;

                                const showDateHeader = !isCollapsed && currentDate !== lastDate;
                                if (showDateHeader) lastDate = currentDate;

                                const categories = categoryMap[row[9] ?? ''] || [];
                                const needsAttention = !row[10] || row[10] === 'Select' || (row[10] && !categories.includes(row[10]));

                                // Flow Icon Mapping
                                const flowIcons: Record<string, string> = {
                                    'In': '↑',
                                    'Out': '↓',
                                    'CC_Purchase': '💳',
                                    'CC_Payment': '🔄',
                                    'Savings': '💰',
                                    'Transfer': '⇄'
                                };

                                return (
                                    <React.Fragment key={i}>
                                        {showMonthHeader && (
                                            <tr className={styles.monthHeader} onClick={() => toggleMonth(currentMonth)}>
                                                <td colSpan={12} className={styles.monthHeaderTd}>
                                                    <div className={styles.monthHeaderLayout}>
                                                        <span className={`${styles.collapseIcon} ${isCollapsed ? styles.collapsed : ''}`}>
                                                            ▼
                                                        </span>
                                                        <span className={styles.monthHeaderText}>{currentMonth}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {!isCollapsed && showDateHeader && (
                                            <tr className={styles.dateHeader}>
                                                <td colSpan={12} className={styles.dateHeaderTd}>
                                                    {currentDate}
                                                </td>
                                            </tr>
                                        )}

                                        {!isCollapsed && (
                                            <tr className={needsAttention ? styles.rowAttention : ''}>
                                                {[1, 2, 4, 5, 8, 9, 10, 13, 12, 11, 14, 15].map((j) => {
                                                    const cell = row[j] ?? '';
                                                    const isFlow = j === 9;
                                                    const isCategory = j === 10;
                                                    const isImpactsBudget = j === 11;
                                                    const isNote = j === 12;
                                                    const isTags = j === 13;
                                                    const isLinkedAccount = j === 14;
                                                    const isLinkedRefId = j === 15;
                                                    const isAmount = j === 8;

                                                    const categories = categoryMap[row[9] ?? ''] || [];

                                                    return (
                                                        <td key={j} className={`${styles.td} ${isDirty(i, j) ? styles.dirty : ''}`}>
                                                            {isFlow && (
                                                                <div className={styles.flowSelectWrapper}>
                                                                    <span className={`${styles.flowIcon} ${cell === 'In' ? styles.textGreen : cell === 'Out' ? styles.textRed : cell === 'Savings' ? styles.textBlue : styles.textBlue}`}>
                                                                        {flowIcons[cell] || '•'}
                                                                    </span>
                                                                    <select
                                                                        className={styles.ghostSelect}
                                                                        style={{ position: 'absolute', opacity: 0, inset: 0, width: '100%', cursor: 'pointer' }}
                                                                        value={cell}
                                                                        onChange={e => updateCell(i, j, e.target.value)}>
                                                                        {FLOW_OPTIONS.map((o: string) => (
                                                                            <option key={o} value={o}>{o}</option>
                                                                        ))}
                                                                    </select>
                                                                    <span className={styles.flowText}>{cell}</span>
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
                                                                <label className={styles.checkboxContainer} title={cell === 'Yes' ? 'Excluded' : 'Included'}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={cell === 'Yes'}
                                                                        onChange={() => updateCell(i, j, cell === 'Yes' ? 'No' : 'Yes')}
                                                                    />
                                                                    <span className={styles.checkmark}></span>
                                                                </label>
                                                            )}

                                                            {isNote && (
                                                                <input
                                                                    className={styles.noteInput}
                                                                    value={cell}
                                                                    onChange={e => updateCell(i, j, e.target.value)}
                                                                    placeholder="Add note..."
                                                                />
                                                            )}

                                                            {isTags && (
                                                                <TagInput
                                                                    value={cell}
                                                                    onChange={val => updateCell(i, j, val)}
                                                                    suggestions={allTags}
                                                                />
                                                            )}

                                                            {isLinkedAccount && (
                                                                <input
                                                                    className={styles.noteInput}
                                                                    value={cell}
                                                                    onChange={e => updateCell(i, j, e.target.value)}
                                                                    placeholder="Linked account..."
                                                                />
                                                            )}

                                                            {isLinkedRefId && (
                                                                <input
                                                                    className={styles.noteInput}
                                                                    value={cell}
                                                                    onChange={e => updateCell(i, j, e.target.value)}
                                                                    placeholder="Ref ID..."
                                                                />
                                                            )}

                                                            {!isFlow && !isCategory && !isImpactsBudget && !isNote && !isTags && !isLinkedAccount && !isLinkedRefId && (
                                                                isAmount ? (
                                                                    <span className={`${styles.amountCell} ${row[9] === 'In' ? styles.amountIn : row[9] === 'Out' ? styles.amountOut : ''}`}>
                                                                        {formatAmount(cell)}
                                                                    </span>
                                                                ) : (
                                                                    <span title={cell}>{cell}</span>
                                                                )
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            });
                        })()}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className={styles.mobileOnly}>
                <div className={styles.cardList}>
                    {visibleRows.map((row, i) => {
                        const categories = categoryMap[row[9] ?? ''] || [];
                        const needsAttention = !row[10] || row[10] === 'Select' || (row[10] && !categories.includes(row[10]));

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

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Linked Account</label>
                                        <div className={`${styles.mobileInputWrapper} ${isDirty(i, 14) ? styles.dirtyBorder : ''}`}>
                                            <input
                                                className={styles.mobileTextarea}
                                                value={row[14] ?? ''}
                                                onChange={e => updateCell(i, 14, e.target.value)}
                                                placeholder="Linked account..."
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Linked Ref ID</label>
                                        <div className={`${styles.mobileInputWrapper} ${isDirty(i, 15) ? styles.dirtyBorder : ''}`}>
                                            <input
                                                className={styles.mobileTextarea}
                                                value={row[15] ?? ''}
                                                onChange={e => updateCell(i, 15, e.target.value)}
                                                placeholder="Ref ID..."
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
                                        <div className={styles.fieldGroup} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span className={styles.fieldLabel}>Exclude</span>
                                            <label className={styles.checkboxContainer} style={{ width: 'auto', height: 'auto' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={row[11] === 'Yes'}
                                                    onChange={() => updateCell(i, 11, row[11] === 'Yes' ? 'No' : 'Yes')}
                                                />
                                                <span className={styles.checkmark}></span>
                                            </label>
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