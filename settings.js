/**
 * -----------------------------------------------------------------------------
 * Tutors.com / Gmail Autoresponder Settings
 * -----------------------------------------------------------------------------
 */

module.exports = {
    // Omit Trailing Slashes
    credentialDir: './credentials',
    credentialName: 'client_secret.json',
    tokenDir: './credentials/token',
    tokenName: 'gmail_token.json',
    scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
    ],
};
