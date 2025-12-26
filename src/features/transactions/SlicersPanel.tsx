import type { Filters } from './useTransactions';
import styles from './SlicersPanel.module.css';

type Props = {
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (idx: number) => string[];
};

export function SlicersPanel({ filters, setFilters, distinct }: Props) {
    return (
        <aside className={styles.slicers}>
            <div className={styles.slicersHeader}>
                <div className={styles.slicersTitle}>Filters</div>
            </div>

            <Slicer title="Bank" values={distinct(1)} selected={filters.bank}
                onChange={v => setFilters({ ...filters, bank: v })} />

            <Slicer title="Account" values={distinct(2)} selected={filters.account}
                onChange={v => setFilters({ ...filters, account: v })} />

            <Slicer title="Flow" values={distinct(9)} selected={filters.flow}
                onChange={v => setFilters({ ...filters, flow: v })} />

            <Slicer title="Category" values={distinct(10)} selected={filters.category}
                onChange={v => setFilters({ ...filters, category: v })} />

            <Slicer title="Impacts Budget?" values={distinct(11)} selected={filters.calc}
                onChange={v => setFilters({ ...filters, calc: v })} />
        </aside>
    );
}

function Slicer({
    title,
    values,
    selected,
    onChange
}: {
    title: string;
    values: string[];
    selected: string[];
    onChange: (v: string[]) => void;
}) {
    return (
        <div className={styles.slicer}>
            <div className={styles.title}>{title}</div>
            {values.map(v => (
                <label key={v} className={styles.item}>
                    <input
                        type="checkbox"
                        checked={selected.includes(v)}
                        onChange={e =>
                            onChange(
                                e.target.checked
                                    ? [...selected, v]
                                    : selected.filter(x => x !== v)
                            )
                        }
                    />
                    {v || '(empty)'}
                </label>
            ))}
        </div>
    );
}