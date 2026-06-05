const ActivityLog = require('../models/ActivityLog');
const socket = require('../config/socket');

/**
 * Log a workspace activity and broadcast it
 * @param {Object} params
 * @param {string} params.userId - ID of user triggering action
 * @param {string} params.userName - Name of user triggering action
 * @param {string} params.action - Short descriptor of action
 * @param {string} params.details - Longer log details
 * @param {string} params.entityType - 'Task' | 'Project' | 'Deliverable' | 'Client' | 'User' | 'System'
 * @param {string} params.entityId - ID of related model entity
 */
exports.logActivity = async ({ userId, userName, action, details, entityType, entityId }) => {
  try {
    const log = await ActivityLog.create({
      user: userId,
      userName,
      action,
      details: details || '',
      entityType,
      entityId,
    });

    // Broadcast log to team members who are connected
    socket.sendToAll('new_activity', log);

    return log;
  } catch (error) {
    console.error(`Failed to write activity log: ${error.message}`);
  }
};
