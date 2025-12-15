import { useEffect, useState } from 'react';
import { initGoogleAuth, requestAccessToken } from './auth/googleAuth';
import { readSheet, appendRow } from './sheets/sheetsApi';

const CLIENT_ID = '1075777305463-k6611jptqjj5or1dnu7srj4npcp1bdtr.apps.googleusercontent.com';
const SPREADSHEET_ID = '1ap8fxHqIO3vnM8-VAhKwproUpR1bQHJZg-Baleqtz-Q';
const RANGE = 'A:C';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [rows, setRows] = useState<string[][]>([]);

  useEffect(() => {
    initGoogleAuth(CLIENT_ID);
  }, []);

  const handleLogin = () => {
    requestAccessToken(token => {
      setToken(token);
      loadData(token);
    });
  };

  const loadData = async (accessToken: string) => {
    const data = await readSheet(SPREADSHEET_ID, RANGE, accessToken);
    setRows(data);
  };

  const handleAddRow = async () => {
    if (!token) return;

    await appendRow(
      SPREADSHEET_ID,
      RANGE,
      [new Date().toISOString(), 'PWA', 'Hello'],
      token
    );

    loadData(token);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Sheets PWA</h1>

      {!token && (
        <button onClick={handleLogin}>
          Connect with Google
        </button>
      )}

      {token && (
        <>
          <button onClick={handleAddRow}>
            Add Row
          </button>

          <ul>
            {rows.map((row, i) => (
              <li key={i}>{row.join(' | ')}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
