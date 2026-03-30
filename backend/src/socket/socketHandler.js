import logger from '../config/logger.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// CRITICAL: JWT_SECRET must be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is required');
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file.');
}

/**
 * Socket.io connection handler
 * Handles authentication, room management, and event routing
 */
export const initializeSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (decoded.type === 'refresh') {
        return next(new Error('Authentication error: Invalid token type'));
      }

      // Get user
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      // Attach user to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.user = user.toJSON();
      socket.institutionId = user.institutionId?.toString();

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    logger.info(`✅ Client connected: ${socket.id} (User: ${socket.user?.email || 'unknown'})`);

    // Join user's school room automatically
    if (socket.institutionId) {
      const roomName = `school:${socket.institutionId}`;
      await socket.join(roomName);
      logger.info(`User ${socket.userId} joined room: ${roomName}`);
      
      // Emit confirmation
      socket.emit('JOINED_ROOM', {
        room: roomName,
        institutionId: socket.institutionId
      });
    }

    // Handle JOIN_ROOM event (explicit room join)
    const handleJoinRoom = async (data) => {
      try {
        const { schoolId } = data;
        
        if (!schoolId) {
          socket.emit('ERROR', { message: 'School ID is required' });
          return;
        }

        // Verify user has access to this school
        if (socket.userRole !== 'admin' && socket.institutionId !== schoolId) {
          socket.emit('ERROR', { message: 'Access denied to this school' });
          return;
        }

        const roomName = `school:${schoolId}`;
        await socket.join(roomName);
        
        logger.info(`User ${socket.userId} joined room: ${roomName}`);
        
        socket.emit('JOINED_ROOM', {
          room: roomName,
          schoolId
        });
      } catch (error) {
        logger.error('JOIN_ROOM error:', error);
        socket.emit('ERROR', { message: 'Failed to join room' });
      }
    };

    // Support both uppercase and lowercase event names for compatibility
    socket.on('JOIN_ROOM', handleJoinRoom);
    socket.on('join_room', handleJoinRoom);

    // Handle LEAVE_ROOM event
    socket.on('LEAVE_ROOM', async (data) => {
      try {
        const { schoolId } = data;
        if (schoolId) {
          const roomName = `school:${schoolId}`;
          await socket.leave(roomName);
          logger.info(`User ${socket.userId} left room: ${roomName}`);
        }
      } catch (error) {
        logger.error('LEAVE_ROOM error:', error);
      }
    });

    // Handle DRILL_ACK (drill acknowledgment)
    socket.on('DRILL_ACK', async (data) => {
      try {
        const { drillId } = data;
        
        if (!drillId) {
          socket.emit('ERROR', { message: 'Drill ID is required' });
          return;
        }

        // Import Drill model
        const Drill = (await import('../models/Drill.js')).default;
        const drill = await Drill.findById(drillId);
        
        if (!drill) {
          socket.emit('ERROR', { message: 'Drill not found' });
          return;
        }

        // Acknowledge drill
        await drill.acknowledgeDrill(socket.userId);

        // Broadcast to school room
        const roomName = `school:${drill.institutionId}`;
        io.to(roomName).emit('DRILL_ACK_RECEIVED', {
          drillId,
          userId: socket.userId,
          userName: socket.user.name,
          acknowledgedAt: new Date()
        });

        logger.info(`Drill acknowledged: User ${socket.userId} - Drill ${drillId}`);
      } catch (error) {
        logger.error('DRILL_ACK error:', error);
        socket.emit('ERROR', { message: 'Failed to acknowledge drill' });
      }
    });

    // Phase 4.0: Handle HEARTBEAT (keep-alive) - new name
    socket.on('HEARTBEAT', () => {
      socket.emit('SERVER_HEARTBEAT', {
        timestamp: new Date().toISOString()
      });
    });

    // Legacy: Handle CLIENT_HEARTBEAT (keep-alive) - backward compatibility
    socket.on('CLIENT_HEARTBEAT', () => {
      socket.emit('SERVER_HEARTBEAT', {
        timestamp: new Date().toISOString()
      });
    });

    // Phase 4.0: Handle USER_SAFE - User marks themselves safe
    socket.on('USER_SAFE', async (data) => {
      try {
        const { alertId, location } = data;
        
        if (!alertId) {
          socket.emit('ERROR', { message: 'Alert ID is required' });
          return;
        }

        // Import Alert model
        const Alert = (await import('../models/Alert.js')).default;
        const alert = await Alert.findById(alertId);
        
        if (!alert) {
          socket.emit('ERROR', { message: 'Alert not found' });
          return;
        }

        // Update alert student status
        await alert.updateStudentStatus(socket.userId, 'safe', location);

        // Broadcast status update
        if (socket.institutionId) {
          const { broadcastUserStatusUpdate } = await import('../services/crisisAlert.service.js');
          await broadcastUserStatusUpdate(
            socket.userId,
            socket.institutionId,
            'SAFE',
            location
          );
        }

        logger.info(`User ${socket.userId} marked SAFE for alert ${alertId}`);
      } catch (error) {
        logger.error('USER_SAFE error:', error);
        socket.emit('ERROR', { message: 'Failed to update status to SAFE' });
      }
    });

    // Phase 4.0: Handle USER_HELP - User requests help
    socket.on('USER_HELP', async (data) => {
      try {
        const { alertId, location, details } = data;
        
        if (!alertId) {
          socket.emit('ERROR', { message: 'Alert ID is required' });
          return;
        }

        if (!location || !location.lat || !location.lng) {
          socket.emit('ERROR', { message: 'Location is required when requesting help' });
          return;
        }

        // Import Alert model
        const Alert = (await import('../models/Alert.js')).default;
        const alert = await Alert.findById(alertId);
        
        if (!alert) {
          socket.emit('ERROR', { message: 'Alert not found' });
          return;
        }

        // Update alert student status to 'at_risk' (help requested)
        await alert.updateStudentStatus(socket.userId, 'at_risk', location);

        // Broadcast status update
        if (socket.institutionId) {
          const { broadcastUserStatusUpdate } = await import('../services/crisisAlert.service.js');
          await broadcastUserStatusUpdate(
            socket.userId,
            socket.institutionId,
            'HELP',
            location
          );
        }

        logger.warn(`🚨 User ${socket.userId} requested HELP for alert ${alertId} at ${location.lat},${location.lng}`);
      } catch (error) {
        logger.error('USER_HELP error:', error);
        socket.emit('ERROR', { message: 'Failed to request help' });
      }
    });

    // Legacy: Handle SAFETY_STATUS_UPDATE (backward compatibility)
    socket.on('SAFETY_STATUS_UPDATE', async (data) => {
      try {
        const { status, location } = data;
        
        // Update user status
        const user = await User.findById(socket.userId);
        if (user) {
          if (status) {
            await user.updateSafetyStatus(status);
          }
          if (location && location.lat && location.lng) {
            await user.updateLocation(location.lat, location.lng);
          }
        }

        // Broadcast to school room
        if (socket.institutionId) {
          const roomName = `school:${socket.institutionId}`;
          io.to(roomName).emit('STUDENT_STATUS_UPDATE', {
            userId: socket.userId,
            userName: socket.user.name,
            status: status || user.safetyStatus,
            location: location || user.currentLocation,
            updatedAt: new Date()
          });
        }

        logger.info(`Safety status updated: User ${socket.userId} - ${status}`);
      } catch (error) {
        logger.error('SAFETY_STATUS_UPDATE error:', error);
        socket.emit('ERROR', { message: 'Failed to update safety status' });
      }
    });

    // Phase 3: Handle TRACK_ACTIVITY - Student tracks an activity
    socket.on('TRACK_ACTIVITY', async (data) => {
      try {
        const { activityType, activityData } = data;
        
        if (!activityType) {
          socket.emit('ERROR', { message: 'Activity type is required' });
          return;
        }

        // Only students can track activities
        if (socket.userRole !== 'student') {
          socket.emit('ERROR', { message: 'Only students can track activities' });
          return;
        }

        // Import activity tracking service
        const { trackStudentActivity } = await import('../services/activity-tracking.service.js');
        const activityLog = await trackStudentActivity(
          socket.userId,
          activityType,
          activityData || {}
        );

        logger.info(`Activity tracked: User ${socket.userId} - ${activityType}`);
        socket.emit('STUDENT_ACTIVITY_UPDATE', {
          activityId: activityLog._id.toString(),
          success: true
        });
      } catch (error) {
        logger.error('TRACK_ACTIVITY error:', error);
        socket.emit('ERROR', { message: 'Failed to track activity' });
      }
    });

    // Phase 3: Handle REQUEST_QR_CODE - Parent requests QR code
    socket.on('REQUEST_QR_CODE', async (data) => {
      try {
        const { studentId } = data;
        
        if (!studentId) {
          socket.emit('ERROR', { message: 'Student ID is required' });
          return;
        }

        // Only parents can request QR codes
        if (socket.userRole !== 'parent') {
          socket.emit('ERROR', { message: 'Only parents can request QR codes' });
          return;
        }

        // Import QR code service
        const { generateParentQRCode } = await import('../services/parent-qr-code.service.js');
        const qrCode = await generateParentQRCode(
          socket.userId,
          studentId,
          socket.userId, // generatedBy
          'parent_request'
        );

        logger.info(`QR code requested: Parent ${socket.userId} - Student ${studentId}`);
        socket.emit('QR_CODE_GENERATED', {
          qrCodeId: qrCode._id.toString(),
          qrCodeData: qrCode.qrCodeHash,
          expiresAt: qrCode.expiresAt
        });
      } catch (error) {
        logger.error('REQUEST_QR_CODE error:', error);
        socket.emit('ERROR', { message: error.message || 'Failed to generate QR code' });
      }
    });

    // Phase 3: Handle SCAN_QR_CODE - Teacher scans QR code
    socket.on('SCAN_QR_CODE', async (data) => {
      try {
        const { qrCodeData, location } = data;
        
        if (!qrCodeData) {
          socket.emit('ERROR', { message: 'QR code data is required' });
          return;
        }

        // Only teachers and admins can scan QR codes
        if (socket.userRole !== 'teacher' && socket.userRole !== 'admin' && socket.userRole !== 'SYSTEM_ADMIN') {
          socket.emit('ERROR', { message: 'Only teachers and admins can scan QR codes' });
          return;
        }

        // Import QR code service
        const { verifyQRCode } = await import('../services/parent-qr-code.service.js');
        const verificationResult = await verifyQRCode(
          qrCodeData,
          socket.userId,
          location
        );

        logger.info(`QR code scanned: Teacher ${socket.userId} - Parent ${verificationResult.parent._id}`);
        socket.emit('QR_CODE_VERIFIED', {
          success: true,
          parent: verificationResult.parent,
          student: verificationResult.student,
          verified: verificationResult.verified
        });
      } catch (error) {
        logger.error('SCAN_QR_CODE error:', error);
        socket.emit('ERROR', { message: error.message || 'Failed to verify QR code' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('✅ Socket.io handler initialized');
};

/**
 * Broadcast to all users in a school
 */
export const broadcastToSchool = (io, schoolId, event, payload) => {
  const roomName = `school:${schoolId}`;
  io.to(roomName).emit(event, {
    ...payload,
    timestamp: new Date().toISOString()
  });
  logger.info(`Broadcasted ${event} to room: ${roomName}`);
};

/**
 * Broadcast to specific user
 */
export const emitToUser = (io, userId, event, payload) => {
  // Find socket by userId (requires storing socket-user mapping)
  // For now, broadcast to all and let client filter
  io.emit(event, {
    ...payload,
    targetUserId: userId,
    timestamp: new Date().toISOString()
  });
};

