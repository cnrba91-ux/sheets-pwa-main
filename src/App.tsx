import { useEffect, useState } from 'react';
import { initGoogleAuth, requestAccessToken } from './auth/googleAuth';

import { useTransactions } from './features/transactions/useTransactions';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import styles from './App.module.css';

/* ================= CONFIG ================= */

const CLIENT_ID = '1075777305463-k6611jptqjj5or1dnu7srj4npcp1bdtr.apps.googleusercontent.com';
const SPREADSHEET_ID = '11cvtf3h0ok8lrBBzt2hGAN3j2hfxF1bW4MMgW4S_XEQ';
const RANGE = 'A:J';

type Page = 'transactions' | 'actions';

/* ================= APP ================= */

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('transactions');

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
    actionCount,
    isAttentionDone
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

  const switchToTransactions = () => {
    setPage('transactions');
    setFilters({ ...filters, attentionOnly: false });
  };

  const switchToActions = () => {
    setPage('actions');
    setFilters({ ...filters, attentionOnly: true });
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
          <div className={styles.nav}>
            <button
              className={page === 'transactions' ? styles.navActive : styles.navBtn}
              onClick={switchToTransactions}
            >
              All Transactions
            </button>

            <button
              className={page === 'actions' ? styles.navActive : styles.navBtn}
              onClick={switchToActions}
            >
              Action Required
              {actionCount > 0 && <span className={styles.badge}>{actionCount}</span>}
            </button>
          </div>
        )}

        {token && (
          <div className={styles.actions}>
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

      {/* ================= TRANSACTIONS / ACTIONS ================= */}
      {token && (
        <TransactionsPage
          headers={headers}
          rows={filteredRows}
          filters={filters}
          setFilters={setFilters}
          distinct={distinct}
          updateCell={updateCell}
          isDirty={isDirty}
          isAttentionDone={isAttentionDone}
        />
      )}
    </div>
  );
}

export default App;
