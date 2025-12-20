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
export async function batchUpdateSheet(
    spreadsheetId: string,
    sheetName: string,
    changes: { rowIdx: number; colIdx: number; value: string }[],
    accessToken: string
) {
    const data = changes.map(c => {
        const colLetter = colIndexToLetter(c.colIdx);
        return {
            range: sheetName ? `${sheetName}!${colLetter}${c.rowIdx + 1}` : `${colLetter}${c.rowIdx + 1}`,
            values: [[c.value]]
        };
    });

    const res = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                valueInputOption: 'USER_ENTERED',
                data
            })
        }
    );

    if (!res.ok) {
        throw new Error('Failed to batch update sheet');
    }

    return res.json();
}

export async function updateCellInSheet(
    spreadsheetId: string,
    sheetName: string,
    rowIdx: number,
    colIdx: number,
    value: string,
    accessToken: string
) {
    const colLetter = colIndexToLetter(colIdx);
    const range = sheetName
        ? `${sheetName}!${colLetter}${rowIdx + 1}`
        : `${colLetter}${rowIdx + 1}`;

    const res = await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [[value]]
            })
        }
    );

    if (!res.ok) {
        throw new Error('Failed to update cell');
    }

    return res.json();
}

function colIndexToLetter(index: number): string {
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
}
