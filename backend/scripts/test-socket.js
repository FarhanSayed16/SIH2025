import { io as ioClient } from 'socket.io-client';
import dotenv from 'dotenv';

dotenv.config();

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

// Get token from command line or use test token
const token = process.argv[2] || 'test-token';

console.log('🔌 Testing Socket.io Connection...');
console.log(`📍 URL: ${SOCKET_URL}`);
console.log('');

const socket = ioClient(SOCKET_URL, {
  auth: {
    token: token
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log(`   Socket ID: ${socket.id}`);
  console.log('');
  
  // Test JOIN_ROOM
  console.log('📡 Testing JOIN_ROOM...');
  socket.emit('JOIN_ROOM', { schoolId: 'test-school-id' });
});

socket.on('JOINED_ROOM', (data) => {
  console.log('✅ JOINED_ROOM received:', data);
  console.log('');
  
  // Test CLIENT_HEARTBEAT
  console.log('💓 Testing CLIENT_HEARTBEAT...');
  socket.emit('CLIENT_HEARTBEAT');
});

socket.on('SERVER_HEARTBEAT', (data) => {
  console.log('✅ SERVER_HEARTBEAT received:', data);
  console.log('');
  console.log('🎉 Socket.io test complete!');
  socket.disconnect();
  process.exit(0);
});

socket.on('DRILL_SCHEDULED', (data) => {
  console.log('📢 DRILL_SCHEDULED received:', data);
});

socket.on('CRISIS_ALERT', (data) => {
  console.log('🚨 CRISIS_ALERT received:', data);
});

socket.on('ERROR', (error) => {
  console.error('❌ Error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️  Test timeout');
  socket.disconnect();
  process.exit(1);
}, 10000);

