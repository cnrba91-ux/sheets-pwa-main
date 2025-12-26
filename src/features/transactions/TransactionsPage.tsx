import { CATEGORY_MAP } from '../../domain/categories';
import { formatDate, formatAmount } from '../../domain/formatters';
import type { Filters } from './useTransactions';
import { MatrixTable } from './MatrixTable.tsx';
import { FilterBar } from './components/FilterBar';
import styles from './TransactionsPage.module.css';

type Props = {
    headers: string[];
    rows: string[][];
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (key: number | 'month') => string[];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    attentionCount: number;
};

export function TransactionsPage({
    headers,
    rows,
    filters,
    setFilters,
    distinct,
    updateCell,
    isDirty,
    attentionCount
}: Props) {
    return (
        <div className={styles.canvas}>
            <FilterBar
                filters={filters}
                setFilters={setFilters}
                distinct={distinct}
                attentionCount={attentionCount}
            />

            <MatrixTable
                headers={headers}
                rows={rows}
                updateCell={updateCell}
                isDirty={isDirty}
                categoryMap={CATEGORY_MAP}
                formatDate={formatDate}
                formatAmount={formatAmount}
            />
        </div>
    );
}