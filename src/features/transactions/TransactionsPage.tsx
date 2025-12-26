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
    categoryMap: Record<string, string[]>;
};

export function TransactionsPage({
    headers,
    rows,
    filters,
    setFilters,
    distinct,
    updateCell,
    isDirty,
    categoryMap
}: Props) {
    return (
        <div className={styles.canvas}>
            <FilterBar
                filters={filters}
                setFilters={setFilters}
                distinct={distinct}
            />

            <MatrixTable
                headers={headers}
                rows={rows}
                updateCell={updateCell}
                isDirty={isDirty}
                categoryMap={categoryMap}
                formatDate={formatDate}
                formatAmount={formatAmount}
            />
        </div>
    );
}