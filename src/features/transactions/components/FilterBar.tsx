import type { Filters } from '../useTransactions';
import { MultiSelect } from './MultiSelect';
import { Toggle } from './Toggle';
import styles from './FilterBar.module.css';

type Props = {
    filters: Filters;
    setFilters: (f: Filters) => void;
    distinct: (key: number | 'month') => string[];
};

export function FilterBar({ filters, setFilters, distinct }: Props) {
    const updateFilter = (key: keyof Filters, value: string[]) => {
        setFilters({ ...filters, [key]: value });
    };

    const hasActiveFilters = Object.values(filters).some(val => Array.isArray(val) && val.length > 0) || filters.attentionOnly || filters.search.trim() !== '';

    return (
        <div className={styles.bar}>
            <div className={styles.searchContainer}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.searchIcon}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            <span className={styles.label}>FILTERS</span>

            <div className={styles.filters}>
                <MultiSelect
                    label="Bank"
                    options={distinct(1)}
                    selected={filters.bank}
                    onChange={(v) => updateFilter('bank', v)}
                />
                <MultiSelect
                    label="Account"
                    options={distinct(2)}
                    selected={filters.account}
                    onChange={(v) => updateFilter('account', v)}
                />
                <MultiSelect
                    label="Month"
                    options={distinct('month')}
                    selected={filters.month}
                    onChange={(v) => updateFilter('month', v)}
                />
                <MultiSelect
                    label="Flow"
                    options={distinct(9)}
                    selected={filters.flow}
                    onChange={(v) => updateFilter('flow', v)}
                />
                <MultiSelect
                    label="Category"
                    options={distinct(10)}
                    selected={filters.category}
                    onChange={(v) => updateFilter('category', v)}
                />
                <Toggle
                    label="Hide Excluded"
                    checked={filters.calc.includes('No') && filters.calc.length === 1}
                    onChange={(checked) => updateFilter('calc', checked ? ['No'] : [])}
                />

                {hasActiveFilters && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => setFilters({
                            bank: [],
                            account: [],
                            month: [],
                            flow: [],
                            category: [],
                            calc: [],
                            search: '',
                            attentionOnly: false
                        })}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        Clear All
                    </button>
                )}
            </div>
        </div>
    );
}
