/**
 * -----------------------------------------------------------------------------
 * Tutors.com / Gmail Autoresponder Settings
 * -----------------------------------------------------------------------------
 */

module.exports = {
    // Admin Info
    serverEmail: 'server@123.45.67.89',
    adminEmail: 'email@example.com',

    // Omit Trailing Slashes
    credentialDir: './credentials',
    credentialName: 'client_secret.json',

    // Default Quote Price, Omit the `$`.
    defaultQuoteInPerson: '100',
    defaultQuoteRemote: '60',

    /**
     * To alter the current message, the following tags are available for use:
     *
     * Client Name: <<CLIENT_NAME>>
     * Client City: <<CLIENT_CITY>>
     * In Person Quote: <<QUOTE_IN_PERSON>>
     * Remote Quote: <<QUOTE_REMOTE>>
     *
     * To add line breaks to the message, use the `\n` delimiter.
     */
    defaultMessage: 'Dear <<CLIENT_NAME>>,\n\n\nI am Adam Shlomi, the founder of SoFlo SAT Tutoring. I scored an 800 on the Reading section and 770 on Math, went to Georgetown University, and have 5 years of tutoring experience. We analyze your child’s strengths and weaknesses through a free diagnostic test and then create a personalized strategy that will focus on their weak points and teach the tricks of the SAT/ACT.\n\n\nWe offer in-person tutoring in <<CLIENT_CITY>> for $<<QUOTE_IN_PERSON>>/hour, and Skype tutoring at the more affordable rate of $<<QUOTE_REMOTE>>/hour. Do you have time today or tomorrow for a quick call so I can learn more about your child and share my background?',
};
