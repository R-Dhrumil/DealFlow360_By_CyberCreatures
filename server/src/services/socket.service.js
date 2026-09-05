const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO Real-time WebSocket Server
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    logger.info(`⚡ [Socket.io] Client connected: ${socket.id}`);

    // Join specific room (e.g. quotationId, companyId)
    socket.on('join_room', (room) => {
      socket.join(room);
      logger.info(`⚡ [Socket.io] ${socket.id} joined room: ${room}`);
      socket.emit('joined_room', { room, message: `Joined room ${room}` });
    });

    // Leave room
    socket.on('leave_room', (room) => {
      socket.leave(room);
      logger.info(`⚡ [Socket.io] ${socket.id} left room: ${room}`);
    });

    // Real-time chat & deal negotiation messages
    socket.on('send_message', ({ room, message, sender }) => {
      const payload = {
        sender: sender || 'Anonymous',
        message,
        timestamp: new Date(),
      };
      if (room) {
        io.to(room).emit('new_message', payload);
      } else {
        io.emit('new_message', payload);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`⚡ [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIo() {
  if (!io) {
    throw new Error('Socket.IO not initialized.');
  }
  return io;
}

function emitToRoom(room, event, payload) {
  if (io) {
    io.to(room).emit(event, payload);
  }
}

function broadcastEvent(event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

function emitNotification(userId, notification) {
  if (io) {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }
}

module.exports = {
  initSocket,
  getIo,
  emitToRoom,
  broadcastEvent,
  emitNotification,
};
