const axios = require('axios');
const config = require('./config');

const clientId = config.clientId;
const clientSecret = config.clientSecret;
const roleId = config.roleId;
const webhookUrl = config.webhookUrl;
const accessTokenUrl = `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`;
const badgesUrl = 'https://api.twitch.tv/helix/chat/badges/global';

let currentVersion = null;

async function getAccessToken() {
  try {
    const response = await axios.post(accessTokenUrl);
    return response.data.access_token;
  } catch (error) {
    throw new Error('Error retrieving access token: ' + error.message);
  }
}

async function checkBadgeUpdates() {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Access token not found.');
    }

    console.log('Checking for new badges...');

    const response = await axios.get(badgesUrl, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const latestVersion = response.data.data[0].version;
    if (currentVersion && latestVersion > currentVersion) {
      sendDiscordNotification('**New badge available!**', roleId);
    }

    currentVersion = latestVersion;
  } catch (error) {
    console.error('Error checking for badge updates:', error.message);
  }
}

async function sendDiscordNotification(message, roleId) {
  try {
    const content = `${message} <@&${roleId}>`; // Mentions the role using <@&roleID>
    await axios.post(webhookUrl, { content });
  } catch (error) {
    console.error('Error sending Discord notification:', error.message);
  }
}

async function sendInitialDiscordNotification() {
  try {
    await axios.post(webhookUrl, { content: 'BadgeBOT is online.' });
  } catch (error) {
    console.error('Error sending initial Discord notification:', error.message);
  }
}

async function runBadgeChecker() {
  try {
    await checkBadgeUpdates();
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

// Send initial Discord notification
sendInitialDiscordNotification();

// Call the runBadgeChecker function initially
runBadgeChecker();

// Call the runBadgeChecker function every minute (adjust as needed)
setInterval(runBadgeChecker, 60000);
