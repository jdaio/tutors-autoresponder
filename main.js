/**
 * -----------------------------------------------------------------------------
 * Module & Settings Import
 * -----------------------------------------------------------------------------
 */

// Import required node modules.
const fs = require('fs');
const Nightmare = require('nightmare');
const {
    parse
} = require('node-html-parser');
const nodemailer = require('nodemailer');
const vo = require('vo');

// Import required components.
const gmail = require('./components/gmail-tester/gmail-tester.js');

// Import script settings.
const settings = require('./settings.js');

// Setup constants for JSON keys.
const CLIENT_SECRET = `${settings.credentialDir}/google/${settings.credentialGoogle}`;
const CLIENT_TOKEN = `${settings.credentialDir}/google/token/token.json`;
const CLIENT_SMTP = `${settings.credentialDir}/smtp/${settings.credentialSmtp}`;


/**
 * -----------------------------------------------------------------------------
 * Setup SMTP Email Connectivity
 * -----------------------------------------------------------------------------
 */

// Parse SMTP JSON credentials.
const clientSmtp = JSON.parse(fs.readFileSync(CLIENT_SMTP));

// Instantiate nodemailer.
const mailTransport = nodemailer.createTransport({
    host: clientSmtp.smtpHost,
    port: clientSmtp.smtpPort,
    auth: {
        user: clientSmtp.auth.email,
        pass: clientSmtp.auth.password,
    },
});

/**
 * -----------------------------------------------------------------------------
 * Check the user email inbox.
 *
 * @returns {array} Returns array of messages matching query.
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
 *
 * @description Runs the script to check for emails from Tutors for new requests
 *              and replies to them and an other outstanding requests before
 *              marking the email as read and/or emailing the admin with any
 *              errors.
 *
 * @returns {string} Message on whether the operation was successful or not.
 * -----------------------------------------------------------------------------
 */

function* run() {
    // Create new Nightmare instance.
    const nightmare = new Nightmare({
        show: true,
        maxHeight: 1080,
        maxWidth: 1920,
    });

    // Check active inbox for new emails from Tutors.
    const emails = yield getEmails();

    // If no emails are found, exit the process.
    if (!Array.isArray(emails) || !emails.length) {
        const result = 'No emails were found, the current process has ended.';
        return result;
    }

    // Set up markers for task status.
    let success = false;
    let needsPayment = false;

    // Loop through each email in the returned array.
    for (let i = 0; i < emails.length; i++) {
        // Get all links in the email body.
        const emailLinks = parse(emails[i].body.html)
            .querySelectorAll('a');
        let targetLink = '';

        // Find link that leads to the request page.
        emailLinks.forEach((link) => {
            if (link.rawText === 'View Request') {
                targetLink = link.attributes.href;
            }
        });

        // Send Nightmare to that link.
        yield nightmare
            .goto(targetLink)
            .wait(3000);

        // Check for the existence of the `Send Quote` button.
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
                    .wait(3000)
                    .wait('#quote-price')
                    .insert('#quote-price', result.defaultQuoteRemote)
                    .wait(1000)
                    .wait('#quote-message')
                    .insert('#quote-message', result.message)
                    .wait(1000)
                    .click('#send-quote')
                    .wait(4000)
                    .url()
                    .then(url => {
                        if (url === 'https://tutors.com/pros/requests') {
                            success = true;
                            return success;
                        }

                        if (url === 'https://tutors.com/pros/payment') {
                            success = false;
                            needsPayment = true;
                            return success;
                        }
                    }));
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
                                .then((result) => nightmare
                                    .wait(3000)
                                    .wait('#quote-price')
                                    .insert('#quote-price', result.defaultQuoteRemote)
                                    .wait(1000)
                                    .wait('#quote-message')
                                    .insert('#quote-message', result.message)
                                    .wait(1000)
                                    .click('#send-quote')
                                    .wait(4000)
                                    .url()
                                    .then(url => {
                                        if (url === 'https://tutors.com/pros/requests') {
                                            success = true;
                                            return success;
                                        }

                                        if (url === 'https://tutors.com/pros/payment') {
                                            console.log('Payment page.');
                                            success = false;
                                            needsPayment = true;

                                            return success;
                                        }
                                    }));
                        }
                    } else {
                        success = true;

                        return true;
                    }
                });
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
                                .then((result) => nightmare
                                    .wait(3000)
                                    .wait('#quote-price')
                                    .insert('#quote-price', result.defaultQuoteRemote)
                                    .wait(1000)
                                    .wait('#quote-message')
                                    .insert('#quote-message', result.message)
                                    .wait(1000)
                                    .click('#send-quote')
                                    .wait(4000)
                                    .url()
                                    .then(url => {
                                        if (url === 'https://tutors.com/pros/requests') {
                                            success = true;

                                            return success;
                                        }

                                        if (url === 'https://tutors.com/pros/payment') {
                                            success = false;
                                            needsPayment = true;

                                            return success;
                                        }
                                    }));
                        }
                    } else {
                        success = true;

                        return true;
                    }
                });
        }

        if (success) {
            // Archive this email if the Tutors request handling was successful.
            gmail.archive_message(
                CLIENT_SECRET,
                CLIENT_TOKEN,
                emails[0].id,
            );
        } else {
            if (needsPayment) {
                // Send notification email if a payment is required.
                const notificationEmail = {
                    // Sender address MUST match the email of SMTP connection.
                    from: clientSmtp.auth.email,

                    // Set the email to be set to the script administrator.
                    to: settings.adminEmail,

                    // Set the subject of the email.
                    subject: 'The Tutors.com Script Needs Your Attention',

                    // Set the text of the email. `html:` may also be used.
                    text: `Payment is needed on one of your accounts related to ${clientSmtp.auth.email}.`,
                    // html: '<p>Some message here...</p>',
                };

                // Send the built email.
                mailTransport.sendMail(notificationEmail, (err, info) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(info);
                    }
                });
            }

            // Exit if there's an error or the submission isn't successful.
            break;
        }
    }

    // End Nightmare after the loopm is successfully run.
    yield nightmare.end();

    // Result if the script ran without a problem.
    if (success) {
        const result = 'All emails have been successfully handled and messages replied to!';

        return result;
    }

    // Result if the script ran into the paywall.
    if (needsPayment) {
        const result = 'Payment is necessary. The admin has been notified.';

        return result;
    }

    // Result if the script had another exception.
    const result = 'There was an issue with the process. This likely was not related to the script, but with the Tutors site itself.';

    return result;
}


/**
 * -----------------------------------------------------------------------------
 * Runtime
 *
 * @description Runs the script using the VO control library.
 * -----------------------------------------------------------------------------
 */

console.log('---------------------');
console.log('Checking emails for new Tutors messages to reply to...');

vo(run)((err, result) => {
    if (err) throw err;

    console.log(result);
});
