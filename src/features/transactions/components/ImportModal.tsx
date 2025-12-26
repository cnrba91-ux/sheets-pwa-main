import { useState, useMemo } from 'react';
import { getTransactionFingerprint, parseAnyDate, getPayeeWords, extractRefIds } from '../../../domain/formatters';
import styles from './ImportModal.module.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImport: (rows: string[][], bank: string, acc: string) => void;
    headers: string[];
    distinct: (idx: number) => string[];
    dataRows: string[][];
};

export function ImportModal({ isOpen, onClose, onImport, headers, distinct, dataRows }: Props) {
    const [pastedData, setPastedData] = useState('');
    const [mapping, setMapping] = useState<Record<number, number>>({}); // colIdx in pasted -> colIdx in sheet
    const [step, setStep] = useState<'paste' | 'map' | 'review'>('paste');
    const [selectedBank, setSelectedBank] = useState('');
    const [selectedAcc, setSelectedAcc] = useState('');

    const parsedRows = useMemo(() => {
        if (!pastedData.trim()) return [];
        const lines = pastedData.trim().split('\n');
        const dataLines = lines.slice(1);
        if (dataLines.length === 0) return [];

        const firstLine = dataLines[0];
        const delimiter = firstLine.includes('\t') ? '\t' : (firstLine.includes(',') ? ',' : '\t');

        return dataLines.map(line => line.split(delimiter).map(cell => cell.trim()));
    }, [pastedData]);

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPastedData(e.target.value);
        if (e.target.value.trim()) {
            setStep('map');
        }
    };

    const handleImport = () => {
        onImport(analysis.newToImport, selectedBank, selectedAcc);
        reset();
    };

    const analysis = useMemo(() => {
        if (step !== 'review') return { newToImport: [], duplicates: [], total: 0 };

        const mapped = parsedRows.map(pRow => {
            const sheetRow = new Array(headers.length).fill('');
            Object.entries(mapping).forEach(([pIdx, sIdx]) => {
                sheetRow[sIdx] = pRow[parseInt(pIdx)] || '';
            });
            return sheetRow;
        });

        // Index existing Reference IDs from NOTES (Column J / index 9)
        const refIdMap = new Map<string, string[]>(); // refId -> [date|amount]
        dataRows.forEach(r => {
            const ids = extractRefIds(r[9] || '');
            const date = parseAnyDate(r[2]);
            const amount = Math.abs(parseFloat(r[7].replace(/[^\d.-]/g, '')) || 0).toFixed(0);
            ids.forEach(id => {
                if (!refIdMap.has(id)) refIdMap.set(id, []);
                refIdMap.get(id)!.push(`${date}|${amount}`);
            });
        });

        const existingFingerprints = new Set(dataRows.map(r => getTransactionFingerprint(r[2], r[7], r[4])));

        const newToImport: string[][] = [];
        const duplicates: { row: string[]; reason: string }[] = [];

        mapped.forEach(row => {
            const date = parseAnyDate(row[2]);
            const amount = Math.abs(parseFloat(row[7].replace(/[^\d.-]/g, '')) || 0).toFixed(0);

            // 1. Check Exact Fingerprint (Date + Amount + Normalized Payee)
            const fingerprint = getTransactionFingerprint(row[2], row[7], row[4]);
            if (existingFingerprints.has(fingerprint)) {
                duplicates.push({ row, reason: 'Exact match' });
                return;
            }

            // 2. Check Ref IDs from Current Row (Statement Narration) vs Index (Email Note)
            const currentRowIds = extractRefIds(row[4] || '');
            let foundRefMatch = false;
            for (const id of currentRowIds) {
                const matches = refIdMap.get(id);
                if (matches) {
                    // Check if date and amount also match for security
                    const isFullMatch = matches.includes(`${date}|${amount}`);
                    if (isFullMatch) {
                        foundRefMatch = true;
                        break;
                    }
                }
            }

            if (foundRefMatch) {
                duplicates.push({ row, reason: 'Reference match (from Note)' });
                return;
            }

            // 3. Fallback word match - check if Narration words exist in existing email Notes
            const fuzzyMatch = dataRows.find(r => {
                const dMatch = parseAnyDate(r[2]) === date;
                const aMatch = Math.abs(parseFloat(r[7].replace(/[^\d.-]/g, '')) || 0).toFixed(0) === amount;
                if (dMatch && aMatch) {
                    const newW = getPayeeWords(row[4]);
                    const noteW = getPayeeWords(r[9] || '');
                    // Does the note contain significantly similar payee info?
                    return Array.from(newW).some(w => noteW.has(w));
                }
                return false;
            });

            if (fuzzyMatch) {
                duplicates.push({ row, reason: 'Possible match' });
            } else {
                newToImport.push(row);
            }
        });

        return { newToImport, duplicates, total: parsedRows.length };
    }, [step, parsedRows, mapping, dataRows, headers]);

    const reset = () => {
        setPastedData('');
        setMapping({});
        setStep('paste');
        onClose();
    };

    if (!isOpen) return null;

    const previewRow = parsedRows[0] || [];

    return (
        <div className={styles.overlay} onClick={reset}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <h3>Import Transactions</h3>
                    <button className={styles.closeBtn} onClick={reset}>&times;</button>
                </header>

                <div className={styles.body}>
                    <div className={styles.steps}>
                        <div className={`${styles.step} ${step === 'paste' ? styles.activeStep : ''}`}>1. Paste</div>
                        <div className={`${styles.step} ${step === 'map' ? styles.activeStep : ''}`}>2. Map</div>
                        <div className={`${styles.step} ${step === 'review' ? styles.activeStep : ''}`}>3. Review</div>
                    </div>

                    {step === 'paste' && (
                        <div className={styles.stepContainer}>
                            <p className={styles.instruction}>
                                Paste rows from Excel, CSV, or your bank portal below.
                            </p>
                            <textarea
                                className={styles.textarea}
                                placeholder="Date	Payee	Amount..."
                                value={pastedData}
                                onChange={handlePaste}
                                autoFocus
                            />
                        </div>
                    )}

                    {step === 'map' && (
                        <div className={styles.stepContainer}>
                            <div className={styles.metaSelectors}>
                                <div className={styles.metaRow}>
                                    <label className={styles.metaLabel}>Select Bank</label>
                                    <select
                                        className={styles.select}
                                        value={selectedBank}
                                        onChange={e => setSelectedBank(e.target.value)}
                                    >
                                        <option value="">-- Select Bank --</option>
                                        {distinct(0).map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className={styles.metaRow}>
                                    <label className={styles.metaLabel}>Select Account</label>
                                    <select
                                        className={styles.select}
                                        value={selectedAcc}
                                        onChange={e => setSelectedAcc(e.target.value)}
                                    >
                                        <option value="">-- Select Account --</option>
                                        {distinct(1).map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            <p className={styles.instruction} style={{ marginTop: '1.5rem' }}>
                                Map your columns to the Sheet fields. (Header row skipped)
                            </p>
                            <div className={styles.mapperGrid}>
                                {previewRow.map((cell, pIdx) => (
                                    <div key={pIdx} className={styles.mapperCol}>
                                        <div className={styles.previewCell} title={cell}>
                                            {cell || <span className={styles.empty}>Empty</span>}
                                        </div>
                                        <select
                                            className={styles.select}
                                            value={mapping[pIdx] ?? ''}
                                            onChange={e => setMapping({ ...mapping, [pIdx]: parseInt(e.target.value) })}
                                        >
                                            <option value="">Skip Column</option>
                                            {headers.map((h, sIdx) => (
                                                <option key={sIdx} value={sIdx}>{h}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'review' && (
                        <div className={styles.analysis}>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <span className={styles.statValue}>{analysis.total}</span>
                                    <span className={styles.statLabel}>Total Rows</span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={`${styles.statValue} ${styles.statusNew}`}>{analysis.newToImport.length}</span>
                                    <span className={styles.statLabel}>To Import</span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={`${styles.statValue} ${styles.statusDup}`}>{analysis.duplicates.length}</span>
                                    <span className={styles.statLabel}>Duplicates</span>
                                </div>
                            </div>

                            <div className={styles.previewList}>
                                {analysis.newToImport.map((row, i) => (
                                    <div key={`new-${i}`} className={styles.previewItem}>
                                        <div className={styles.previewMain}>
                                            <span className={styles.previewPayee}>{row[4]}</span>
                                            <span className={styles.previewMeta}>{row[2]} • {row[7]}</span>
                                        </div>
                                        <span className={`${styles.statusPill} ${styles.statusNew}`}>New</span>
                                    </div>
                                ))}
                                {analysis.duplicates.map((item, i) => (
                                    <div key={`dup-${i}`} className={styles.previewItem} style={{ opacity: 0.6 }}>
                                        <div className={styles.previewMain}>
                                            <span className={styles.previewPayee}>{item.row[4]}</span>
                                            <span className={styles.previewMeta}>{item.row[2]} • {item.row[7]}</span>
                                        </div>
                                        <span className={`${styles.statusPill} ${styles.statusDup}`}>{item.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className={styles.footer}>
                    {step === 'map' && (
                        <button className={styles.secondary} onClick={() => setStep('paste')}>
                            Back
                        </button>
                    )}
                    {step === 'review' && (
                        <button className={styles.secondary} onClick={() => setStep('map')}>
                            Back
                        </button>
                    )}

                    {step === 'map' && (
                        <button
                            className={styles.primary}
                            disabled={!selectedBank || !selectedAcc || Object.keys(mapping).length === 0}
                            onClick={() => setStep('review')}
                        >
                            Analyze Data
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            className={styles.primary}
                            disabled={analysis.newToImport.length === 0}
                            onClick={handleImport}
                        >
                            Import {analysis.newToImport.length} Transactions
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
