# Tutors Autoresponder

---

A NodeJS script for automatically replying to Tutors.com job requests sent to your Gmail inbox.

**Note:** This version of the script was developed as a proof-of-concept rather than a final product. It 100% has bugs. The more prevalent issues will be improved in future releases.

## How to Get Started

Ths script requires [Node.js](https://nodejs.org/) v12+ to run.

To run this script locally, clone and install the project and run it as such:

```sh
$ git clone https://github.com/jdaio/tutors-autoresponder.git
$ cd launchpad
$ npm install
$ npm run start
```

### Server Use

To run this script on a server, follow the instructions below. This follows a setup of a server on _Ubuntu 18.04.3 (LTS) x64_.

#### Installing Dependencies

-   Update your system: `sudo apt-get update && sudo apt-get upgrade`.
-   Install the Nodesource PPA: `curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -`.
-   Install Node.js and NPM: `sudo apt-get install -y nodejs`.
-   Confirm that Node was successfully installed: `node --version`.
-   Check that NPM was successfully installed: `npm --version`.
-   Install `xvfb` and its dependencies so you can run graphical applications without display hardware: `sudo apt-get install build-essential xvfb x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps clang libdbus-1-dev libgtk-3-dev libnotify-dev libgnome-keyring-dev libgconf-2-4 libasound2-dev libcap-dev libcups2-dev libxtst-dev libxss1 libnss3-dev gcc-multilib g++-multilib curl gperf bison python-dbusmock openjdk-8-jre`.
-   Install `electron-prebuilt` so Nightmare can be run on the server: `npm install -g electron --unsafe-perm=true --allow-root`.

#### Installing the Script

-   Navigate to the directory you want to run the script out of, for example the home folder: `cd ~`.
-   Clone the repository and go to the directory: `git clone https://github.com/jdaio/tutors-autoresponder.git && cd tutors-autoresponder`.
-   Install the project and its dependencies: `npm install`.
-   Update the settings in the `./credentials/smtp` JSON file to match that of your email provider. **_It's highly recommended not to commit this file to a public repository._**
-   Upload the Google secret JSON for your Google account to the `./credentials/google` folder.

#### Running the Script

-   The script **MUST** be run the first time interactively so that it can be authorized and have the Google account's access token generated. If you set it to a cron job and leave it it'll fail every time.
-   To run the script, initialize it with `xvfb-run`: `xvfb-run --server-args="-screen 0 1000x600x24" node ./tutors-autoresponder.js`.
-   To view the script with Nightmare's process information, run it with: `DEBUG=nightmare:actions xvfb-run --server-args="-screen 0 1000x600x24" node ./tutors-autoresponder.js`.
-   For extended logging information, it can be run: `DEBUG=nightmare:*,electron:* xvfb-run --server-args="-screen 0 1000x600x24" node ./tutors-autoresponder.js`.

#### Setting up the Cron Job

If you'd like to have the script run periodically, you can set up a cron job to ensure it runs automatically without the need to be logged into the server. Keep in mind Google's API limits and restrictions with this.

-   Open the cron file with `crontab -e`. Select `1` (nano is the easiest to work with, but you can choose any editor it offers).
-   Add the following line:
-   `*/30 * * * * cd ~/tutors-autoresponder && DEBUG=nightmare:*,electron:* xvfb-run --server-args="-screen 0 1000x600x24" node ./tutors-autoresponder.js >> data_$(date +\%Y_\%m_\%d_\%I_\%M_\%p).txt`.
-   The line above sets the script to run every 30 minutes, and outputs the log of the run to a text file named after the date and time with the console output.

## Settings/Configuration

This scripts settings can be found in the `settings.js` file in the root of the project directory.

The options are relaively self-explanatory, however there are some additional settings for message requests which are explained below as they must be modified within the `main.js` file itself.

To modify the quote rates or message sent to clients, within the `main.js` file search for `const contact`, which occurs 3 times in the file (all must be replaced). The array looks something like:

```
const contact = {
    defaultQuoteRemote: '',
    defaultQuoteInPerson: '',
    name: '',
    city: '',
    message: '...',
};
```

-   `defaultQuoteRemote`: The hourly rate for remote sessions. Omit the `$` at the start of the string.
-   `defaultQuoteInPerson`: The hourly rate for in-person sessions. Omit the `$` at the start of the string.
-   `message`: The message sent to the client. Further modification details are below.
-   **Note:** `name` and `city` should be left empty unless you want to hardcode the values, as they're pulled dynamically from the request page itself.

To modify the message, you may include any text you want. The script uses tags that are replaced with the applicable information for your convenience:

-   `<<CLIENT_NAME>>`: The name of the client.
-   `<<CLIENT_CITY>>`: The city of the client.
-   `<<QUOTE_IN_PERSON>>`: The in-person hourly rate.
-   `<<QUOTE_REMOTE>>`: The remote hourly rate.

In a message, it'd look something like this:

```
Hi <<CLIENT_NAME>>,\n\n\nWe have tutoring in <<CLIENT_CITY>> available for $<<QUOTE_IN_PERSON>>/hr in-person and $<<QUOTE_REMOTE>>/hr for remote sessions.\n\n\nIf you're interested, feel free to reply to this message.
```

## To Do Checklist

-   [ ] Refactor code because right now it's a mess.
-   [ ] Develop a more sane method of handling message strings for easier customization.
-   [ ] Fix the initial missing token.json bug when creating a new token to write to (instead of an existing blank file).
-   [ ] Switch to Puppeteer for the script instead of relying on XVFB and Electron with Nightmare. It should result in a lighter weight and faster script.
-   [ ] Clean up gmail API interactions.
-   [ ] Structure conditional loops more efficiently.
-   [ ] Implement more informative error handling alerts for administrative emails.
-   [ ] Implement Gmail 0Auth for nodemailer.
-   [ ] Improve handling of secure credentials.

## License

This project is licensed under GPL v3.
