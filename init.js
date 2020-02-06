/**
 * -----------------------------------------------------------------------------
 * Tutors.com / Gmail Autoresponder
 *
 * Licensed under GPL v3.0:
 * https://github.com/jdaio/tutors-autoresponder/blob/master/LICENSE
 *
 * @license GPL-3.0-or-later
 *
 * @author Jamal Ali-Mohammed <https://jdaio.github.io>
 *
 * @version 1.0.0
 * -----------------------------------------------------------------------------
 */


/**
 * -----------------------------------------------------------------------------
 * Module & Settings Import
 * -----------------------------------------------------------------------------
 */

import {
    parse
} from 'node-html-parser';
import gmail from 'gmail-tester';
import Nightmare from 'nightmare';
import settings from './settings';

/**
 * -----------------------------------------------------------------------------
 * Check Email Inbox
 * -----------------------------------------------------------------------------
 */
const checkEmails = () => gmail.get_messages(
    `${settings.credentialDir}/${settings.credentialName}`,
    `${settings.tokenDir}/${settings.tokenName}`, {
        from: 'support@tutors.com',
        to: '',
        subject: 'Tutoring for',
        include_body: true,
        wait_time_sec: 10,
        max_wait_time_sec: 30,
    },
);

/**
 * -----------------------------------------------------------------------------
 * Initialization
 * -----------------------------------------------------------------------------
 */

async function init() {
    const nightmare = new Nightmare({
        show: true,
        maxHeight: 1080,
        maxWidth: 1920,
    });
    const retrievedEmails = await checkEmails();
    const requestLinks = [];

    if (retrievedEmails) {
        retrievedEmails.forEach((email) => {
            const links = parse(email.body.html)
                .querySelectorAll('a');

            links.forEach((link) => {
                if (link.rawText === 'View Request') {
                    requestLinks.push(link.attributes.href);
                }
            });
        });

        console.log('Emails have been retrieved and links stored.');
    }

    /* Set Variables for New Student Info */
    await nightmare
        .goto(requestLinks[0])
        .wait('#send-quote')
        .wait(3000)
        .insert('#quote-price', '60')
        .insert('#quote-message', 'Your typed message will go here.')
        .wait(15000)
        .end();
}

init();
