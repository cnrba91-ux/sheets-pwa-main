import { useEffect, useState } from 'react';
import { initGoogleAuth, requestAccessToken } from './auth/googleAuth';

import { useTransactions } from './features/transactions/useTransactions';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { ImportModal } from './features/transactions/components/ImportModal';
import styles from './App.module.css';

/* ================= CONFIG ================= */

const CLIENT_ID = '1075777305463-k6611jptqjj5or1dnu7srj4npcp1bdtr.apps.googleusercontent.com';
const SPREADSHEET_ID = '1ciwAn12o7wAlurrUbdamPlsiw7gZC_QRWCmeEGD7dg4';
const RANGE = 'Transactions!A:M';

/* ================= APP ================= */

/* ================= APP ================= */

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const {
    headers,
    filteredRows,
    filters,
    setFilters,
    distinct,
    updateCell,
    saveChanges,
    hasPendingChanges,
    isSyncing,
    isDirty,
    loadTransactions,
    importTransactions,
    dataRows,
    accounts,
    attentionCount
  } = useTransactions();

  useEffect(() => {
    initGoogleAuth(CLIENT_ID);
  }, []);

  const handleLogin = () => {
    requestAccessToken(accessToken => {
      setToken(accessToken);
      loadTransactions(SPREADSHEET_ID, RANGE, accessToken);
    });
  };

  return (
    <div className={styles.app}>
      {/* ================= APP BAR ================= */}
      <header className={styles.appBar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>T</div>
          Tracker
        </div>

        {token && (
          <div className={styles.actions}>
            <button
              className={styles.importBtn}
              onClick={() => setIsImportOpen(true)}
              disabled={isSyncing}
              title="Import transactions by pasting data"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Import
            </button>

            <button
              className={styles.refreshBtn}
              onClick={() => loadTransactions(SPREADSHEET_ID, RANGE, token!)}
              disabled={isSyncing}
              title="Refresh data from Google Sheets"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>

            {hasPendingChanges && (
              <button
                className={styles.saveBtn}
                onClick={saveChanges}
                disabled={isSyncing}
              >
                {isSyncing ? 'Saving...' : 'Save to Sheet'}
              </button>
            )}
            {!hasPendingChanges && (
              <span className={styles.synced}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 6 }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Synced
              </span>
            )}
          </div>
        )}
      </header>

      {/* ================= LOGIN ================= */}
      {!token && (
        <div className={styles.center}>
          <button className={styles.primary} onClick={handleLogin}>
            Connect with Google
          </button>
        </div>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {token && (
        <TransactionsPage
          headers={headers as unknown as string[]}
          rows={filteredRows}
          filters={filters}
          setFilters={setFilters}
          distinct={distinct}
          updateCell={updateCell}
          isDirty={isDirty}
          attentionCount={attentionCount}
        />
      )}

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={importTransactions}
        dataRows={dataRows}
        accounts={accounts}
      />
    </div>
  );
}

export default App;
