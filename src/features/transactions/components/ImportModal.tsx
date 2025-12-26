import { useState, useMemo } from 'react';
import { BANK_TEMPLATES } from '../../../domain/parsers';
import type { BankTemplate } from '../../../domain/parsers';
import { transactionToRow } from '../../../domain/types';
import type { Transaction, Account } from '../../../domain/types';
import styles from './ImportModal.module.css';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onImport: (rows: string[][]) => void;
    dataRows: string[][];
    accounts: Account[];
};

export function ImportModal({ isOpen, onClose, onImport, dataRows, accounts }: Props) {
    const [pastedData, setPastedData] = useState('');
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [detectedTemplate, setDetectedTemplate] = useState<BankTemplate | null>(null);
    const [selectedBank, setSelectedBank] = useState<string>('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Derived lists
    const uniqueBanks = useMemo(() => Array.from(new Set(accounts.map(a => a.bank))), [accounts]);
    const filteredAccounts = useMemo(() => accounts.filter(a => a.bank === selectedBank), [accounts, selectedBank]);

    const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPastedData(e.target.value);
        setError(null);
    };



    const analyzeData = () => {
        if (!selectedAccount) {
            setError('Please select an account.');
            return;
        }
        if (!pastedData.trim()) {
            setError('Please paste some data.');
            return;
        }

        // Try to auto-detect
        const template = BANK_TEMPLATES.find(t => t.detect(pastedData));
        if (template) {
            setDetectedTemplate(template);
            setStep('review');
        } else {
            setError('Could not identify the bank format from the text. Please ensure it matches supported formats (HDFC, Axis, IDFC).');
        }
    };

    const importItems = useMemo(() => {
        if (!detectedTemplate || !pastedData.trim() || !selectedAccount) return [];

        try {
            return detectedTemplate.parse(pastedData, selectedAccount.bank, selectedAccount.accNum);
        } catch (e) {
            console.error(e);
            return [];
        }
    }, [detectedTemplate, pastedData, selectedAccount]);

    const analysis = useMemo(() => {
        if (step !== 'review') return { newItems: [], duplicates: [] };

        const existingRefs = new Set(dataRows.map(r => r[3]).filter(id => id));
        const newItems: Transaction[] = [];
        const duplicates: { t: Transaction; reason: string }[] = [];

        importItems.forEach(t => {
            if (t.refId && existingRefs.has(t.refId)) {
                duplicates.push({ t, reason: 'Duplicate Ref ID' });
            } else {
                const isDup = dataRows.some(r =>
                    r[0] === t.date &&
                    Math.abs(parseFloat(r[8] || '0')) === Math.abs(t.netAmount) &&
                    (r[5] || '').toLowerCase().includes((t.payee || '').toLowerCase().split(' ')[0])
                );

                if (isDup && !t.refId) {
                    duplicates.push({ t, reason: 'Similar transaction exists' });
                } else {
                    newItems.push(t);
                }
            }
        });

        return { newItems, duplicates };
    }, [step, importItems, dataRows]);

    const handleImport = () => {
        const rows = analysis.newItems.map(item => transactionToRow(item));
        onImport(rows);
        reset();
    };

    const reset = () => {
        setPastedData('');
        setStep('input');
        setDetectedTemplate(null);
        setSelectedBank('');
        setSelectedAccount(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h3>Import Wizard</h3>
                        {detectedTemplate && step === 'review' && (
                            <span className={styles.templateTag}>
                                {detectedTemplate.name} Detected
                            </span>
                        )}
                    </div>
                    <button className={styles.closeBtn} onClick={reset}>&times;</button>
                </header>

                <div className={styles.body}>
                    {/* STEPPER */}
                    <div className={styles.steps}>
                        <div className={`${styles.step} ${step === 'input' ? styles.activeStep : ''}`}>
                            <div className={styles.stepNum}>1</div>
                            <span>Import Details</span>
                        </div>
                        <div className={`${styles.step} ${step === 'review' ? styles.activeStep : ''}`}>
                            <div className={styles.stepNum}>2</div>
                            <span>Review & Import</span>
                        </div>
                    </div>

                    {/* STEP 1: INPUT (Select + Paste) */}
                    {step === 'input' && (
                        <div className={styles.stepContainer}>
                            {/* Account Selectors - Pills */}
                            <div className={styles.selectionRow}>
                                <div>
                                    <label className={styles.fieldLabel}>Bank</label>
                                    <div className={styles.pillContainer}>
                                        {uniqueBanks.map(b => (
                                            <button
                                                key={b}
                                                className={`${styles.pill} ${selectedBank === b ? styles.pillActive : ''}`}
                                                onClick={() => {
                                                    setSelectedBank(b);
                                                    setSelectedAccount(null);
                                                    setError(null);
                                                }}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={styles.fieldLabel}>Account</label>
                                    <div className={styles.pillContainer}>
                                        {!selectedBank && (
                                            <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic', padding: '0.25rem 0' }}>Select a bank first</span>
                                        )}
                                        {selectedBank && filteredAccounts.map(a => (
                                            <button
                                                key={a.accNum}
                                                className={`${styles.pill} ${selectedAccount?.accNum === a.accNum ? styles.pillActive : ''}`}
                                                onClick={() => {
                                                    setSelectedAccount(a);
                                                    setError(null);
                                                }}
                                            >
                                                {a.accNum}
                                            </button>
                                        ))}
                                        {selectedBank && filteredAccounts.length === 0 && (
                                            <span style={{ fontSize: '0.9rem', color: '#ef4444' }}>No accounts found for {selectedBank}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className={styles.instruction}>
                                Paste your Bank Statement text below.
                            </p>
                            <textarea
                                className={styles.textarea}
                                placeholder="Paste copied data from your PDF or Excel statement here..."
                                value={pastedData}
                                onChange={handlePaste}
                            />
                            {error && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>{error}</div>}
                        </div>
                    )}

                    {/* STEP 2: REVIEW */}
                    {step === 'review' && (
                        <div className={styles.analysis}>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <span className={styles.statValue}>{importItems.length}</span>
                                    <span className={styles.statLabel}>Found</span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={`${styles.statValue} ${styles.statusNew}`}>{analysis.newItems.length}</span>
                                    <span className={styles.statLabel}>To Import</span>
                                </div>
                                <div className={styles.statCard}>
                                    <span className={`${styles.statValue} ${styles.statusDup}`}>{analysis.duplicates.length}</span>
                                    <span className={styles.statLabel}>Duplicates</span>
                                </div>
                            </div>

                            <div className={styles.previewList}>
                                {analysis.newItems.length === 0 && analysis.duplicates.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIcon}>🔍</div>
                                        <p>No valid transactions found to import.</p>
                                    </div>
                                )}

                                {analysis.newItems.map((t, i) => (
                                    <div key={`new-${i}`} className={styles.previewItem}>
                                        <div className={styles.previewMain}>
                                            <span className={styles.previewPayee}>{t.payee || t.narration}</span>
                                            <span className={styles.previewMeta}>
                                                {t.date} • {t.flow} • <span style={{ fontFamily: 'monospace' }}>{t.refId || 'No Ref'}</span>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, color: t.netAmount > 0 ? '#10b981' : '#ef4444' }}>
                                                {t.netAmount > 0 ? '+' : ''}{t.netAmount}
                                            </div>
                                            <span className={`${styles.statusPill} ${styles.new}`}>New</span>
                                        </div>
                                    </div>
                                ))}

                                {analysis.duplicates.map((item, i) => (
                                    <div key={`dup-${i}`} className={styles.previewItem} style={{ opacity: 0.6, background: '#f8fafc' }}>
                                        <div className={styles.previewMain}>
                                            <span className={styles.previewPayee}>{item.t.payee || item.t.narration}</span>
                                            <span className={styles.previewMeta}>{item.t.date} • {item.reason}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, color: '#9ca3af' }}>
                                                {item.t.netAmount}
                                            </div>
                                            <span className={`${styles.statusPill} ${styles.dup}`}>Duplicate</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <footer className={styles.footer}>
                    {/* Secondary Button */}
                    {step === 'input' && (
                        <button className={styles.secondary} onClick={onClose}>Cancel</button>
                    )}
                    {step === 'review' && (
                        <button className={styles.secondary} onClick={() => setStep('input')}>Back</button>
                    )}

                    {/* Primary Button */}
                    {step === 'input' && (
                        <button
                            className={styles.primary}
                            onClick={analyzeData}
                        >
                            Analyze & Review
                        </button>
                    )}

                    {step === 'review' && (
                        <button
                            className={styles.primary}
                            disabled={analysis.newItems.length === 0}
                            onClick={handleImport}
                        >
                            Import {analysis.newItems.length} Transactions
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}
