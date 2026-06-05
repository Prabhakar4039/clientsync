const Notification = require('../models/Notification');
const socket = require('../config/socket');

/**
 * Create a notification and dispatch it in real-time
 * @param {Object} params
 * @param {string} params.recipient - User ID of the recipient
 * @param {string} params.title - Notification title
 * @param {string} params.message - Detailed body message
 * @param {string} params.type - Category: 'Task' | 'Project' | 'Deliverable' | 'Milestone' | 'Feedback' | 'System'
 * @param {string} params.link - URL or path for navigation inside app
 */
exports.createNotification = async ({ recipient, title, message, type, link }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type: type || 'System',
      link: link || '',
    });

    // Send via socket.io
    socket.sendToUser(recipient, 'new_notification', notification);

    return notification;
  } catch (error) {
    console.error(`Failed to create notification: ${error.message}`);
  }
};
