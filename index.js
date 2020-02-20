/**
 * -----------------------------------------------------------------------------
 * Tutors.com / Gmail Autoresponder
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
    CronJob
} from 'cron';
import fs from 'fs';
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
        show: false,
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

    // Set marker for task completion.
    let success = false;

    for (let i = 0; i < emails.length; i + 1) {

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
                    const contact = {
                        defaultQuoteRemote: '60',
                        defaultQuoteInPerson: '100',
                        name: '',
                        city: '',
                        message: 'Dear <<CLIENT_NAME>>,\n\n\nI am Adam Shlomi, the founder of SoFlo SAT Tutoring. I scored an 800 on the Reading section and 770 on Math, went to Georgetown University, and have 5 years of tutoring experience. We analyze your child’s strengths and weaknesses through a free diagnostic test and then create a personalized strategy that will focus on their weak points and teach the tricks of the SAT/ACT.\n\n\nWe offer in-person tutoring in <<CLIENT_CITY>> for $<<QUOTE_IN_PERSON>>/hour, and Skype tutoring at the more affordable rate of $<<QUOTE_REMOTE>>/hour. Do you have time today or tomorrow for a quick call so I can learn more about your child and share my background?',
                    };

                    // Get the student name and reduce to the first name only.
                    const studentName = document.querySelector('.client-lead-customer .media-heading')
                        .innerText;
                    contact.name = studentName.replace(/( [A-Z]\.)/, '');

                    // Get the student city and reduce it to the city name only (hopefully).
                    const studentCity = document.querySelector('.client-lead-customer  .client-lead-customer-info')
                        .innerText;
                    contact.city = studentCity.replace(/(, [A-Z]{2})(.*)/, '');

                    // Place variables into message.
                    contact.message = contact.message.replace(/<<CLIENT_NAME>>/, contact.name);
                    contact.message = contact.message.replace(/<<CLIENT_CITY>>/, contact.city);
                    contact.message = contact.message.replace(/<<QUOTE_IN_PERSON>>/, contact.defaultQuoteInPerson);
                    contact.message = contact.message.replace(/<<QUOTE_REMOTE>>/, contact.defaultQuoteRemote);

                    return contact;
                })
                .then((result) => nightmare
                    .insert('#quote-price', result.defaultQuoteRemote)
                    .insert('#quote-message', result.message)
                    .wait(2000)
                    .click('#send-quote')
                    .wait('#template-content')
                    .wait(2000));

            // Flip success marker if finished.
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
                                    const contact = {
                                        defaultQuoteRemote: '60',
                                        defaultQuoteInPerson: '100',
                                        name: '',
                                        city: '',
                                        message: 'Dear <<CLIENT_NAME>>,\n\n\nI am Adam Shlomi, the founder of SoFlo SAT Tutoring. I scored an 800 on the Reading section and 770 on Math, went to Georgetown University, and have 5 years of tutoring experience. We analyze your child’s strengths and weaknesses through a free diagnostic test and then create a personalized strategy that will focus on their weak points and teach the tricks of the SAT/ACT.\n\n\nWe offer in-person tutoring in <<CLIENT_CITY>> for $<<QUOTE_IN_PERSON>>/hour, and Skype tutoring at the more affordable rate of $<<QUOTE_REMOTE>>/hour. Do you have time today or tomorrow for a quick call so I can learn more about your child and share my background?',
                                    };

                                    // Get the student name and reduce to the first name only.
                                    const studentName = document.querySelector('.client-lead-customer .media-heading')
                                        .innerText;
                                    contact.name = studentName.replace(/( [A-Z]\.)/, '');

                                    // Get the student city and reduce it to the city name only (hopefully).
                                    const studentCity = document.querySelector('.client-lead-customer  .client-lead-customer-info')
                                        .innerText;
                                    contact.city = studentCity.replace(/(, [A-Z]{2})(.*)/, '');

                                    // Place variables into message.
                                    contact.message = contact.message.replace(/<<CLIENT_NAME>>/, contact.name);
                                    contact.message = contact.message.replace(/<<CLIENT_CITY>>/, contact.city);
                                    contact.message = contact.message.replace(/<<QUOTE_IN_PERSON>>/, contact.defaultQuoteInPerson);
                                    contact.message = contact.message.replace(/<<QUOTE_REMOTE>>/, contact.defaultQuoteRemote);

                                    return contact;
                                })
                                .then((result) => nightmare.insert('#quote-price', result.defaultQuoteRemote)
                                    .insert('#quote-message', result.message)
                                    .wait(2000)
                                    .click('#send-quote')
                                    .wait('#template-content')
                                    .wait(2000));
                        }
                    }
                });

            // Flip success marker if finished.
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
                                    const contact = {
                                        defaultQuoteRemote: '60',
                                        defaultQuoteInPerson: '100',
                                        name: '',
                                        city: '',
                                        message: 'Dear <<CLIENT_NAME>>,\n\n\nI am Adam Shlomi, the founder of SoFlo SAT Tutoring. I scored an 800 on the Reading section and 770 on Math, went to Georgetown University, and have 5 years of tutoring experience. We analyze your child’s strengths and weaknesses through a free diagnostic test and then create a personalized strategy that will focus on their weak points and teach the tricks of the SAT/ACT.\n\n\nWe offer in-person tutoring in <<CLIENT_CITY>> for $<<QUOTE_IN_PERSON>>/hour, and Skype tutoring at the more affordable rate of $<<QUOTE_REMOTE>>/hour. Do you have time today or tomorrow for a quick call so I can learn more about your child and share my background?',
                                    };

                                    // Get the student name and reduce to the first name only.
                                    const studentName = document.querySelector('.client-lead-customer .media-heading')
                                        .innerText;
                                    contact.name = studentName.replace(/( [A-Z]\.)/, '');

                                    // Get the student city and reduce it to the city name only (hopefully).
                                    const studentCity = document.querySelector('.client-lead-customer  .client-lead-customer-info')
                                        .innerText;
                                    contact.city = studentCity.replace(/(, [A-Z]{2})(.*)/, '');

                                    // Place variables into message.
                                    contact.message = contact.message.replace(/<<CLIENT_NAME>>/, contact.name);
                                    contact.message = contact.message.replace(/<<CLIENT_CITY>>/, contact.city);
                                    contact.message = contact.message.replace(/<<QUOTE_IN_PERSON>>/, contact.defaultQuoteInPerson);
                                    contact.message = contact.message.replace(/<<QUOTE_REMOTE>>/, contact.defaultQuoteRemote);

                                    return contact;
                                })
                                .then((result) => nightmare.insert('#quote-price', result.defaultQuoteRemote)
                                    .insert('#quote-message', result.message)
                                    .wait(2000)
                                    .click('#send-quote')
                                    .wait('#template-content')
                                    .wait(2000));
                        }
                    }
                });

            // Flip success marker if finished.
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

    const result = 'There was an issue with the current round of email (payment required, server error, etc.). The admin has been notified.';

    return result;
}


/**
 * -----------------------------------------------------------------------------
 * Runtime
 * -----------------------------------------------------------------------------
 */

// Script runs periodically
const job = new CronJob('*/10 * * * *', () => {
    console.log('---------------------');
    console.log('Checking emails for new Tutors messages to reply to...');

    vo(init)((err, result) => {
        if (err) throw err;

        console.log(result);
    });

    console.log('Finished running the job!');
    console.log('---------------------');
}, null, false, 'America/New_York', null, true);

job.start();
