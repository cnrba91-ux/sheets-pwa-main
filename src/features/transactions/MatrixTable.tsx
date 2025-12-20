import styles from './MatrixTable.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    categoryMap: Record<string, string[]>;
    inOutOptions: string[];
    inCalcOptions: string[];
    formatDate: (v: string) => string;
    formatAmount: (v: string) => string;
};

export function MatrixTable({
    headers,
    rows,
    updateCell,
    categoryMap,
    inOutOptions,
    inCalcOptions,
    formatDate,
    formatAmount
}: Props) {
    return (
        <section className={styles.wrap}>
            <div className={styles.header}>
                <h2 className={styles.title}>Transactions</h2>
                <p className={styles.subtitle}>Showing {rows.length} items</p>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {headers.map(h => (
                            <th key={h} className={styles.th}>{h}</th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => {
                                const isInOut = j === 5;
                                const isCategory = j === 6;
                                const isInCalc = j === 8;
                                const isNote = j === 9;

                                const categories = categoryMap[row[5]] || [];

                                return (
                                    <td key={j} className={styles.td}>
                                        {isInOut && (
                                            <select value={cell}
                                                onChange={e => updateCell(i, j, e.target.value)}>
                                                {inOutOptions.map(o => (
                                                    <option key={o}>{o}</option>
                                                ))}
                                            </select>
                                        )}

                                        {isCategory && (
                                            <select value={cell}
                                                onChange={e => updateCell(i, j, e.target.value)}>
                                                <option value="">Select</option>
                                                {categories.map(o => (
                                                    <option key={o}>{o}</option>
                                                ))}
                                            </select>
                                        )}

                                        {isInCalc && (
                                            <select value={cell}
                                                onChange={e => updateCell(i, j, e.target.value)}>
                                                {inCalcOptions.map(o => (
                                                    <option key={o}>{o}</option>
                                                ))}
                                            </select>
                                        )}

                                        {isNote && (
                                            <input
                                                value={cell}
                                                onChange={e => updateCell(i, j, e.target.value)}
                                            />
                                        )}

                                        {!isInOut && !isCategory && !isInCalc && !isNote && (
                                            j === 2 ? formatDate(cell) :
                                                j === 7 ? formatAmount(cell) :
                                                    cell
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}