const jwt = require('jsonwebtoken');
const User = require('../models/User');

let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required for Socket connection'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_campusflow_jwt_key_2026_dev_only'
      );

      const user = await User.findById(decoded.id);
      if (!user || user.status !== 'active') {
        return next(new Error('User account unauthorized or inactive'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // Join personal room
    socket.join(`user_${userId}`);
    // Join role room
    socket.join(`role_${user.role}`);
    // Join department room if applicable
    if (user.department) {
      socket.join(`dept_${user.department.toString()}`);
    }
    // Join global announcements room
    socket.join('campus_global');

    console.log(`[Socket.IO] User connected: ${user.name} (${user.role}) - Socket ID: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${user.name}`);
    });
  });

  return io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized');
  }
  return ioInstance;
}

// Helper dispatchers for real-time notifications
function notifyUser(userId, event, data) {
  if (ioInstance) {
    ioInstance.to(`user_${userId.toString()}`).emit(event, data);
  }
}

function notifyRole(role, event, data) {
  if (ioInstance) {
    ioInstance.to(`role_${role}`).emit(event, data);
  }
}

function notifyDepartment(deptId, event, data) {
  if (ioInstance && deptId) {
    ioInstance.to(`dept_${deptId.toString()}`).emit(event, data);
  }
}

function broadcastGlobal(event, data) {
  if (ioInstance) {
    ioInstance.to('campus_global').emit(event, data);
  }
}

module.exports = {
  initSocket,
  getIO,
  notifyUser,
  notifyRole,
  notifyDepartment,
  broadcastGlobal,
};
