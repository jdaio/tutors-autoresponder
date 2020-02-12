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
import Nightmare from 'nightmare';
import gmail from './components/gmail-tester/gmail-tester';
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

const nightmare = new Nightmare({
    show: true,
    maxHeight: 1080,
    maxWidth: 1920,
});

function sendMessages(urlArray = [], count = 0) {
    return nightmare
        .goto(urlArray[count])
        .wait(2000)
        .evaluate(() => {
            const student = {
                name: '',
                city: '',
            };

            // Get the student name and reduce to the first name only.
            const studentName = document.querySelector('.client-lead-customer .media-heading')
                .innerText;
            student.name = studentName.replace(/( [A-Z]\.)/, '');

            // Get the student city and reduce it to the city name only (hopefully).
            const studentCity = document.querySelector('.client-lead-customer  .client-lead-customer-info')
                .innerText;
            student.city = studentCity.replace(/(, [A-Z]{2})(.*)/, '');

            return student;
        })
        .then((result) => nightmare.wait(1000)
            .insert('#quote-price', settings.defaultQuoteSkype)
            .wait(1000)
            .insert('#quote-message', `Hi ${result.name},\n\nWe offer in-person tutoring in ${result.city} for $${settings.defaultQuoteInPerson} an hour, and Skype tutoring at the more affordable rate of $${settings.defaultQuoteSkype} an hour. Do you have time today or tomorrow for a quick call so I can learn more about your child and share my background?\n\nThanks,\nAdam`)
            .wait(1000)
            .click('#send-quote')
            .wait(5000))
        .then(() => {
            if (count < urlArray.length) {
                return sendMessages(urlArray, count + 1);
            }

            if (count === urlArray.length) {
                return false;
            }

            return false;
        });
}

async function init() {
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

    await nightmare
        .then(() => sendMessages(requestLinks))
        .then(() => nightmare.end(() => console.log('Links successfully completed.')));
}

init();
