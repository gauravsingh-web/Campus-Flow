require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const { ensureAdminAndSeed } = require('./seed/seed');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

initSocket(io);

async function startServer() {
  try {
    await connectDB();
    await ensureAdminAndSeed(false);

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` CampusFlow API Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(` HTTP URL: http://localhost:${PORT}`);
      console.log(` Socket.IO WebSocket: ws://localhost:${PORT}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start CampusFlow server:', error);
    process.exit(1);
  }
}

// Graceful termination handling
const handleShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    console.log('[Server] HTTP and Socket.IO server closed.');
    await disconnectDB();
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

startServer();
