/**
 * -----------------------------------------------------------------------------
 * Tutors.com Autoresponder
 *
 * Licensed under GPL v3.0:
 * https://github.com/jdaio/tutors-autoresponder/blob/master/LICENSE
 *
 * @license GPL-3.0-or-later
 *
 * @author Jamal Ali-Mohammed <https://digitalheat.co>
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
    google
} from 'googleapis';
import Nightmare from 'nightmare';
import {
    parse
} from 'node-html-parser';
import sendmail from 'sendmail';
import vo from 'vo';
import gmail from './components/gmail-tester/gmail-tester';
import settings from './settings';

const CLIENT_SECRET = `${settings.credentialDir}/${settings.credentialName}`;
const CLIENT_TOKEN = `${settings.credentialDir}/token/token.json`;


/**
 * -----------------------------------------------------------------------------
 * Check the user email inbox.
 * -----------------------------------------------------------------------------
 */

const getEmails = () => gmail.get_messages(
    CLIENT_SECRET,
    CLIENT_TOKEN, {
        subject: 'Tutoring for',
        from: 'support@tutors.com',
        to: '',
        include_body: true,
    },
);


/**
 * -----------------------------------------------------------------------------
 * Initialization
 * -----------------------------------------------------------------------------
 */

function* init() {
    // Initialize Nightmare
    const nightmare = new Nightmare({
        show: true,
        maxHeight: 1080,
        maxWidth: 1920,
    });

    // Check for emails.
    const emails = yield getEmails();

    // If emails aren't found, exit the process.
    if (!Array.isArray(emails) || !emails.length) {
        const result = 'No emails were found, the current process has ended.';
        return result;
    }

    // Establish success marker for script.
    let success = false;

    for (let i = 0; i < emails.length; i + 1) {
        success = false;
        const emailLinks = parse(emails[i].body.html)
            .querySelectorAll('a');
        let targetLink = '';

        emailLinks.forEach((link) => {
            if (link.rawText === 'View Request') {
                targetLink = link.attributes.href;
            }
        });

        yield nightmare
            .goto(targetLink)
            .wait(3000);

        const isQuote = yield nightmare.exists('#send-quote');

        if (isQuote) {
            yield nightmare.evaluate(() => {
                    let message = settings.defaultMessage;
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

                    // Place variables into message.
                    message = message.replace(/<<CLIENT_NAME>>/, student.name);
                    message = message.replace(/<<CLIENT_CITY>>/, student.city);
                    message = message.replace(/<<QUOTE_IN_PERSON>>/, settings.defaultQuoteInPerson);
                    message = message.replace(/<<QUOTE_REMOTE>>/, settings.defaultQuoteRemote);

                    return message;
                })
                .then((result) => nightmare.insert('#quote-price', settings.defaultQuoteRemote)
                    .insert('#quote-message', result)
                    .wait(2000)
                    .click('#send-quote')
                    .wait('#template-content')
                    .wait(2000));

            // If finished for this case, mark it as successful.
            success = true;
        } else if (!(isQuote) && (nightmare.url() !== 'https://tutors.com/pros/requests')) {
            yield nightmare
                .click('#header-requests a')
                .wait(3000)
                .evaluate(() => {
                    const requestBoxes = document.querySelectorAll('.request-box');
                    const requestLinks = [];

                    requestBoxes.forEach((newRequest) => {
                        const element = newRequest;
                        const newLink = element.querySelector('.request-head')
                            .getAttribute('href');

                        requestLinks.push(`https://tutors.com${newLink}`);
                    });

                    return requestLinks;
                })
                .then((nextRequests) => {
                    if (nextRequests.length > 0) {
                        for (let j = 0; j < nextRequests.length; j + 1) {
                            return nightmare
                                .goto(nextRequests[j])
                                .wait(3000)
                                .wait('#send-quote')
                                .evaluate(() => {
                                    let message = settings.defaultMessage;
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

                                    // Place variables into message.
                                    message = message.replace(/<<CLIENT_NAME>>/, student.name);
                                    message = message.replace(/<<CLIENT_CITY>>/, student.city);
                                    message = message.replace(/<<QUOTE_IN_PERSON>>/, settings.defaultQuoteInPerson);
                                    message = message.replace(/<<QUOTE_REMOTE>>/, settings.defaultQuoteRemote);

                                    return message;
                                })
                                .then((result) => nightmare.insert('#quote-price', settings.defaultQuoteRemote)
                                    .insert('#quote-message', result)
                                    .wait(2000)
                                    .click('#send-quote')
                                    .wait('#template-content')
                                    .wait(2000));
                        }
                    }
                });

            // If finished for this case, mark it as successful.
            success = true;
        }

        if (nightmare.url() === 'https://tutors.com/pros/requests') {
            yield nightmare.evaluate(() => {
                    const requestBoxes = document.querySelectorAll('.request-box');
                    const requestLinks = [];

                    requestBoxes.forEach((newRequest) => {
                        const element = newRequest;
                        const newLink = element.querySelector('.request-head')
                            .getAttribute('href');

                        requestLinks.push(`https://tutors.com${newLink}`);
                    });

                    return requestLinks;
                })
                .then((nextRequests) => {
                    if (nextRequests.length > 0) {
                        for (let j = 0; j < nextRequests.length; j + 1) {
                            return nightmare
                                .goto(nextRequests[j])
                                .wait(3000)
                                .wait('#send-quote')
                                .evaluate(() => {
                                    let message = settings.defaultMessage;
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

                                    // Place variables into message.
                                    message = message.replace(/<<CLIENT_NAME>>/, student.name);
                                    message = message.replace(/<<CLIENT_CITY>>/, student.city);
                                    message = message.replace(/<<QUOTE_IN_PERSON>>/, settings.defaultQuoteInPerson);
                                    message = message.replace(/<<QUOTE_REMOTE>>/, settings.defaultQuoteRemote);

                                    return message;
                                })
                                .then((result) => nightmare.insert('#quote-price', settings.defaultQuoteRemote)
                                    .insert('#quote-message', result)
                                    .wait(2000)
                                    .click('#send-quote')
                                    .wait('#template-content')
                                    .wait(2000));
                        }
                    }
                });

            // If finished for this case, mark it as successful.
            success = true;
        }

        if (success) {
            yield gmail.archive_message(
                CLIENT_SECRET,
                CLIENT_TOKEN,
                emails[0].id,
            );
        } else {
            break;
        }
    }

    yield nightmare.end();

    if (success) {
        // Return a result.
        const result = 'All emails have been successfully handled and messages replied to!';

        return result;
    }

    sendmail({
        from: settings.serverEmail,
        to: settings.adminEmail,
        subject: 'A tutors script needs your attention.',
        html: 'Mail of test sendmail.',
    }, (err, reply) => {
        console.log(err && err.stack);
        console.dir(reply);
    });

    const result = 'An unexpected page was encountered (either a website server error, payment page, or otherwise). An email has been sent to the owner.';

    return result;
}


/**
 * -----------------------------------------------------------------------------
 * Runtime
 * -----------------------------------------------------------------------------
 */

vo(init)((err, result) => {
    if (err) throw err;

    console.log(result);
});
