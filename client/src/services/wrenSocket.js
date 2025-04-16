import { useRef } from 'react';
import io from "socket.io-client";

// Create a singleton socket instance
let socketInstance = null;

// Initialize socket connection
export const initializeSocket = () => {
  if (!socketInstance) {
    socketInstance = io(process.env.REACT_APP_SOCKET_URL);
    console.log("Socket connection initialized");
  }
  return socketInstance;
};

// Mark messages as read
export const markMessagesAsRead = (groupId, userId) => {
  const socket = initializeSocket();
  if (socket && groupId && userId) {
    socket.emit("markMessagesAsRead", {
      groupId,
      userId,
    });
  }
};

// Disconnect socket on cleanup
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log("Socket disconnected");
  }
};