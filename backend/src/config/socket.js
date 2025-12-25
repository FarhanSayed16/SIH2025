/**
 * Socket.io singleton
 * Allows services to access the Socket.io instance without requiring Express req
 */

let ioInstance = null;

/**
 * Set the Socket.io instance (called from server.js)
 */
export const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Get the Socket.io instance
 */
export const getSocketIO = () => {
  return ioInstance;
};

