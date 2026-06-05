let io;
const users = {}; // Map of userId -> array of socketIds

module.exports = {
  init: (serverInstance) => {
    const { Server } = require('socket.io');
    io = new Server(serverInstance, {
      cors: {
        origin: '*', // Allow all origins for dev; vercel domain in prod
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    io.on('connection', (socket) => {
      console.log(`Socket Connected: ${socket.id}`);

      // User connects and joins their private room
      socket.on('join_user', (userId) => {
        if (userId) {
          socket.join(userId.toString());
          if (!users[userId]) {
            users[userId] = [];
          }
          if (!users[userId].includes(socket.id)) {
            users[userId].push(socket.id);
          }
          console.log(`User ${userId} joined their notification room.`);
        }
      });

      // User joins a specific project chat/update room
      socket.on('join_project', (projectId) => {
        if (projectId) {
          socket.join(projectId.toString());
          console.log(`Socket ${socket.id} joined project room: ${projectId}`);
        }
      });

      // User joins general agency room
      socket.on('join_team', () => {
        socket.join('agency_team');
        console.log(`Socket ${socket.id} joined agency team room.`);
      });

      // Chat events
      socket.on('send_team_message', (messageData) => {
        // Broadcasts chat message to the team
        io.to('agency_team').emit('receive_team_message', messageData);
      });

      socket.on('send_project_message', ({ projectId, messageData }) => {
        // Broadcasts chat message to the project room
        io.to(projectId.toString()).emit('receive_project_message', messageData);
      });

      // Task status changes (Kanban)
      socket.on('task_moved', ({ projectId, taskId, fromStatus, toStatus, taskTitle }) => {
        socket.to(projectId.toString()).emit('task_moved_update', {
          taskId,
          fromStatus,
          toStatus,
          taskTitle,
        });
      });

      socket.on('disconnect', () => {
        console.log(`Socket Disconnected: ${socket.id}`);
        for (const userId in users) {
          users[userId] = users[userId].filter((id) => id !== socket.id);
          if (users[userId].length === 0) {
            delete users[userId];
          }
        }
      });
    });

    return io;
  },
  getIO: () => {
    return io;
  },
  sendToUser: (userId, event, data) => {
    if (io && userId) {
      io.to(userId.toString()).emit(event, data);
    }
  },
  sendToProject: (projectId, event, data) => {
    if (io && projectId) {
      io.to(projectId.toString()).emit(event, data);
    }
  },
  sendToAll: (event, data) => {
    if (io) {
      io.emit(event, data);
    }
  },
};
