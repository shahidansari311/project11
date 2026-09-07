const { Expo } = require('expo-server-sdk');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo();

/**
 * Send a push notification to a user by their ID
 * @param {string} userId - The user ID to send the notification to
 * @param {string} title - The title of the notification
 * @param {string} body - The message body
 * @param {object} data - Optional data payload (e.g. { url: '/portfolio/123' })
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pushToken: true }
    });

    if (!user || !user.pushToken) {
      console.log(`User ${userId} does not have a push token registered.`);
      return;
    }

    const pushToken = user.pushToken;

    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return;
    }

    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    let chunks = expo.chunkPushNotifications([message]);
    let tickets = [];

    // Send the chunks to the Expo push notification service
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification service:', error);
  }
};

module.exports = {
  sendPushNotification
};
