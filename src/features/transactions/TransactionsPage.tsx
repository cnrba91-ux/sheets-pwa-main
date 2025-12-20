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
    distinct: (idx: number) => string[];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
    isDirty: (rowIdx: number, colIdx: number) => boolean;
    isAttentionDone: (displayIdx: number) => boolean;
};

export function TransactionsPage({
    headers,
    rows,
    filters,
    setFilters,
    distinct,
    updateCell,
    isDirty,
    isAttentionDone
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
                categoryMap={CATEGORY_MAP}
                formatDate={formatDate}
                formatAmount={formatAmount}
                attentionOnly={filters.attentionOnly}
                isAttentionDone={isAttentionDone}
            />
        </div>
    );
}