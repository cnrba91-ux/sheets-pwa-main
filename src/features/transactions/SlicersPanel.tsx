import type { Filters } from './useTransactions';

type Props = {
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (idx: number) => string[];
};

export function SlicersPanel({ filters, setFilters, distinct }: Props) {
    return (
        <aside style={styles.slicers}>
            <Slicer title="Bank" values={distinct(0)} selected={filters.bank}
                onChange={v => setFilters({ ...filters, bank: v })} />

            <Slicer title="Account" values={distinct(1)} selected={filters.acc}
                onChange={v => setFilters({ ...filters, acc: v })} />

            <Slicer title="Month" values={distinct(3)} selected={filters.month}
                onChange={v => setFilters({ ...filters, month: v })} />

            <Slicer title="In / Out" values={distinct(5)} selected={filters.inout}
                onChange={v => setFilters({ ...filters, inout: v })} />

            <Slicer title="Category" values={distinct(6)} selected={filters.category}
                onChange={v => setFilters({ ...filters, category: v })} />

            <Slicer title="In Calc?" values={distinct(8)} selected={filters.calc}
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
        <div style={styles.slicer}>
            <div style={styles.title}>{title}</div>
            {values.map(v => (
                <label key={v} style={styles.item}>
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
                    {v}
                </label>
            ))}
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    slicers: {
        width: 260,
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        padding: 12,
        overflowY: 'auto'
    },
    slicer: { marginBottom: 16 },
    title: { fontWeight: 600, marginBottom: 6 },
    item: { display: 'flex', gap: 6, fontSize: 13 }
};