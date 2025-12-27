import { formatDate, formatAmount } from '../../domain/formatters';
import type { Filters } from './useTransactions';
import { MatrixTable } from './MatrixTable.tsx';
import styles from './TransactionsPage.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (key: number | 'month') => string[];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    categoryMap: Record<string, string[]>;
};

export function TransactionsPage({
    headers,
    rows,
    updateCell,
    isDirty,
    categoryMap,
    allTags
}: Omit<Props, 'filters' | 'setFilters' | 'distinct'> & { allTags: string[] }) {
    return (
        <div className={styles.canvas}>
            <MatrixTable
                headers={headers}
                rows={rows}
                updateCell={updateCell}
                isDirty={isDirty}
                categoryMap={categoryMap}
                allTags={allTags}
                formatDate={formatDate}
                formatAmount={formatAmount}
            />
        </div>
    );
}