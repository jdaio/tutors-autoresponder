/**
 * -----------------------------------------------------------------------------
 * Module & Settings Import
 * -----------------------------------------------------------------------------
 */

// Import Core Node Modules
import fs from 'fs';
import readline from 'readline';

// Import Google Node APIs
import {
    google,
} from 'googleapis';

// Responder Settings
import settings from './settings';

// Set Additional Script Variables
const gmail = google.gmail('v1');
const secretPath = `${settings.credentialDir}/${settings.credentialName}`;
const tokenPath = `${settings.tokenDir}/${settings.tokenName}`;


/**
 * -----------------------------------------------------------------------------
 * Get Client Secrets
 * -----------------------------------------------------------------------------
 */

fs.readFile(secretPath, (err, content) => {
    if (err) {
        console.log(`Error loading client secret file: ${err}`);
        return false;
    }

    authorizeClient(JSON.parse(content), authTest);
});

function authTest() {
    console.log('Authentication successful.');
    return false;
}

/**
 * -----------------------------------------------------------------------------
 * Authorize Client
 *
 * @description Creates an OAuth2 client with the given credentials, then
 *              executes the given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * -----------------------------------------------------------------------------
 */

function authorizeClient(credentials, callback) {
    // Get information from client secret json.
    const clientId = credentials.installed.client_id;
    const clientSecret = credentials.installed.client_secret;
    const redirectUrl = credentials.installed.redirect_uris[0];

    // Creat new OAuth2 client.
    const {
        OAuth2,
    } = google.auth;
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    // Check if a token already exists, if not create a token.
    fs.readFile(tokenPath, (err, token) => {
        if (err) {
            getNewToken(oauth2Client, callback);

            return false;
        }

        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
    });
}

/**
 * Get New Token
 *
 * @description Gets and stores new token after prompting for user
 *              authorization, then executes the given callback with the
 *              authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *                                     client.
 */

function getNewToken(oauth2Client, callback) {
    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: settings.scopes,
    });

    console.log(`Authorize this app by visiting this url: ${authorizationUrl}`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the code from the page here:', (code) => {
        rl.close();

        oauth2Client.getToken(code, (err, token) => {
            if (err) {
                console.log(`Error while trying to retrieve access token: ${err}`);

                return false;
            }

            oauth2Client.credentials = token;
            storeToken(token);
            callback(oauth2Client);
        });
    });
}

/**
 * Store Token
 *
 * @description Writes token to disk be used in later.
 *
 * @param {Object} token The token to store to disk.
 */

function storeToken(token) {
    try {
        fs.mkdirSync(settings.tokenDir);
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }

    // Provides a callback function for fsWriteFile.
    function confirmToken() {
        return false;
    }

    fs.writeFile(tokenPath, JSON.stringify(token), confirmToken);

    console.log(`Token stored to: ${tokenPath}`);
}
