import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io = null;

/**
 * Initialize Socket.IO Real-time WebSocket Server
 * @param {import('http').Server} httpServer
 */
export const initSocket = (httpServer) => {
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

    // Join specific room (e.g. projectId, orderId, chatRoom)
    socket.on('join_room', (room) => {
      socket.join(room);
      logger.info(`⚡ [Socket.io] ${socket.id} joined room: ${room}`);
      socket.emit('joined_room', { room, message: `Successfully joined room ${room}` });
    });

    // Leave room
    socket.on('leave_room', (room) => {
      socket.leave(room);
      logger.info(`⚡ [Socket.io] ${socket.id} left room: ${room}`);
    });

    // Demo real-time chat/event message forwarding
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

    // Disconnect event
    socket.on('disconnect', () => {
      logger.info(`⚡ [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get active Socket.IO server instance
 */
export const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket(httpServer) first.');
  }
  return io;
};

/**
 * Emit event to a specific room or user channel
 */
export const emitToRoom = (room, event, payload) => {
  if (io) {
    io.to(room).emit(event, payload);
  }
};

/**
 * Broadcast event to all connected clients
 */
export const broadcastEvent = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};

/**
 * Emit real-time notification to user
 */
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
    });
  }
};
