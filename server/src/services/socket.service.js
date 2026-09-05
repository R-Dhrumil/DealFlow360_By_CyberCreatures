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

    // Register user ID, role, and company ID to join respective rooms
    socket.on('register_user', ({ userId, role, companyId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        logger.info(`⚡ [Socket.io] ${socket.id} joined user room: user_${userId}`);
      }
      if (role) {
        socket.join(`role_${role}`);
        logger.info(`⚡ [Socket.io] ${socket.id} joined role room: role_${role}`);
      }
      if (companyId) {
        socket.join(`company_${companyId}`);
        logger.info(`⚡ [Socket.io] ${socket.id} joined company room: company_${companyId}`);
        if (role) {
          socket.join(`company_${companyId}_role_${role}`);
          logger.info(`⚡ [Socket.io] ${socket.id} joined scoped room: company_${companyId}_role_${role}`);
        }
      }
    });

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

function emitUserNotification(userId, notification) {
  if (io) {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      id: Date.now() + Math.random().toString(36).substring(2, 7),
      timestamp: new Date(),
    });
  }
}

/**
 * Broadcast notification to company-scoped roles (or global fallback)
 * @param {string} companyId - Target company ID
 * @param {string|string[]} roles - Target role(s) (e.g. 'admin', ['admin', 'sales_manager'])
 * @param {object} notification - Notification payload { type, title, message, link }
 */
function emitCompanyRoleNotification(companyId, roles, notification) {
  if (!io) return;
  const roleArray = Array.isArray(roles) ? roles : [roles];
  const payload = {
    ...notification,
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    timestamp: new Date(),
  };

  roleArray.forEach((role) => {
    if (companyId) {
      // Send to dedicated company admin/role
      io.to(`company_${companyId}_role_${role}`).emit('notification', payload);
    } else {
      // Global fallback
      io.to(`role_${role}`).emit('notification', payload);
    }
  });
}

function emitRoleNotification(roles, notification) {
  emitCompanyRoleNotification(null, roles, notification);
}

/**
 * Broadcast live pipeline Kanban state update to all connected clients in company
 * @param {string} companyId 
 * @param {object} data 
 */
function broadcastPipelineUpdate(companyId, data) {
  if (!io) return;
  const payload = {
    ...data,
    timestamp: new Date(),
  };
  if (companyId) {
    io.to(`company_${companyId}`).emit('pipeline_updated', payload);
  }
  io.emit('pipeline_updated', payload);
}

module.exports = {
  initSocket,
  getIo,
  emitToRoom,
  broadcastEvent,
  emitUserNotification,
  emitRoleNotification,
  emitCompanyRoleNotification,
  broadcastPipelineUpdate,
};
