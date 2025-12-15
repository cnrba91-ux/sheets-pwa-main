let tokenClient: any = null;

export function initGoogleAuth(clientId: string) {
    if (!window.google) {
        throw new Error('Google Identity Services not loaded');
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: () => { }
    });
}

export function requestAccessToken(
    onSuccess: (token: string) => void,
    onError?: (error: any) => void
) {
    if (!tokenClient) {
        throw new Error('Google Auth not initialized');
    }

    tokenClient.callback = (response: any) => {
        if (response.error) {
            onError?.(response);
        } else {
            onSuccess(response.access_token);
        }
    };

    tokenClient.requestAccessToken({ prompt: '' });
}
