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
    loadTransactions
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
          <div className={styles.nav}>
            <button
              className={page === 'transactions' ? styles.navActive : styles.navBtn}
              onClick={() => setPage('transactions')}
            >
              All Transactions
            </button>

            <button
              className={page === 'actions' ? styles.navActive : styles.navBtn}
              onClick={() => setPage('actions')}
            >
              Action Required
            </button>
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
      {token && page === 'transactions' && (
        <TransactionsPage
          headers={headers}
          rows={filteredRows}
          filters={filters}
          setFilters={setFilters}
          distinct={distinct}
          updateCell={updateCell}
        />
      )}

      {/* ================= ACTIONS ================= */}
      {token && page === 'actions' && (
        <div className={styles.placeholder}>
          Action Required – Coming Soon
        </div>
      )}
    </div>
  );
}

export default App;
