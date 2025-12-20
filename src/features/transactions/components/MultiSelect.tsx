import { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';

type Props = {
    label: string;
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
};

export function MultiSelect({ label, options, selected, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const handleSelectAll = () => {
        const newSet = new Set([...selected, ...filteredOptions]);
        onChange(Array.from(newSet));
    };

    const handleClear = () => {
        onChange([]);
    };

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={`${styles.trigger} ${selected.length > 0 ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {label}
                {selected.length > 0 && <span className={styles.count}>{selected.length}</span>}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={isOpen ? styles.chevronOpen : ''}
                >
                    <path d="M6 8l4 4 4-4" />
                </svg>
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <input
                        className={styles.search}
                        placeholder={`Search ${label}...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />

                    <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={handleSelectAll}>
                            Select All
                        </button>
                        <button className={styles.actionBtn} onClick={handleClear}>
                            Clear
                        </button>
                    </div>

                    <div className={styles.list}>
                        {filteredOptions.length === 0 ? (
                            <div className={styles.option} style={{ justifyContent: 'center' }}>
                                No results
                            </div>
                        ) : (
                            filteredOptions.map(opt => (
                                <label key={opt} className={styles.option}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selected.includes(opt)}
                                        onChange={() => handleSelect(opt)}
                                    />
                                    {opt || '(Empty)'}
                                </label>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
