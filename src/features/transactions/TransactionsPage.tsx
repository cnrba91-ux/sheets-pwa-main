import { CATEGORY_MAP, IN_OUT_OPTIONS, IN_CALC_OPTIONS } from '../../domain/categories';
import { formatDate, formatAmount } from '../../domain/formatters';
import type { Filters } from './useTransactions';
import { MatrixTable } from './MatrixTable.tsx';
import { SlicersPanel } from './SlicersPanel';

type Props = {
    headers: string[];
    rows: string[][];
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (idx: number) => string[];
    updateCell: (rowIdx: number, colIdx: number, value: string) => void;
};

export function TransactionsPage({
    headers,
    rows,
    filters,
    setFilters,
    distinct,
    updateCell
}: Props) {
    return (
        <div style={styles.canvas}>
            <SlicersPanel
                filters={filters}
                setFilters={setFilters}
                distinct={distinct}
            />

            <MatrixTable
                headers={headers}
                rows={rows}
                updateCell={updateCell}
                categoryMap={CATEGORY_MAP}
                inOutOptions={IN_OUT_OPTIONS}
                inCalcOptions={IN_CALC_OPTIONS}
                formatDate={formatDate}
                formatAmount={formatAmount}
            />
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    canvas: { display: 'flex', height: 'calc(100vh - 56px)' }
};