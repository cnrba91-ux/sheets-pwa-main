const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function readSheet(
    spreadsheetId: string,
    range: string,
    accessToken: string
) {
    const res = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );

    if (!res.ok) {
        throw new Error('Failed to read sheet');
    }

    const data = await res.json();
    return data.values || [];
}

export async function appendRow(
    spreadsheetId: string,
    range: string,
    values: string[],
    accessToken: string
) {
    const res = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [values]
            })
        }
    );

    if (!res.ok) {
        throw new Error('Failed to append row');
    }

    return res.json();
}
