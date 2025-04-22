import io from "socket.io-client"

// Create a singleton socket instance
let socketInstance = null
let connectionAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

// Initialize socket connection with better error handling
export const initializeSocket = () => {
  if (!socketInstance) {
    try {
      const socketUrl = process.env.REACT_APP_SOCKET_URL

      if (!socketUrl) {
        console.error("Socket URL is not defined in environment variables")
        return null
      }

      console.log("Initializing socket connection to:", socketUrl)

      socketInstance = io(socketUrl, {
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: 1000,
        timeout: 20000,
        transports: ["websocket", "polling"],
        forceNew: false,
      })

      socketInstance.on("connect", () => {
        console.log("Socket connected successfully with ID:", socketInstance.id)
        connectionAttempts = 0
      })

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        connectionAttempts++

        if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error("Max reconnection attempts reached, giving up")
        }
      })

      socketInstance.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason)
      })

      // Add error event handler
      socketInstance.on("error", (error) => {
        console.error("Socket error:", error)
      })
    } catch (error) {
      console.error("Error initializing socket:", error)
      return null
    }
  }
  return socketInstance
}

// Check if socket is connected
export const isSocketConnected = () => {
  return socketInstance && socketInstance.connected
}

// Mark messages as read
export const markMessagesAsRead = (groupId, userId) => {
  const socket = initializeSocket()
  if (socket && socket.connected && groupId && userId) {
    socket.emit("markMessagesAsRead", {
      groupId,
      userId,
    })
    return true
  } else {
    console.warn("Socket not connected. Cannot mark messages as read.")
    return false
  }
}

// Mark analyst messages as read
export const markAnalystMessagesAsReadSocket = (chatId, userId) => {
  const socket = initializeSocket()
  if (socket && socket.connected && chatId && userId) {
    socket.emit("mark-analyst-messages-read", {
      chatId,
      userId,
    })
    return true
  } else {
    console.warn("Socket not connected. Cannot mark analyst messages as read.")
    return false
  }
}

// Send analyst message via socket - try both event names
export const sendAnalystMessageSocket = (messageData) => {
  const socket = initializeSocket()
  if (socket && socket.connected) {
    console.log("Sending analyst message via socket:", messageData)

    // Try both event names that might be used by the server
    try {
      socket.emit("send-analyst-message", messageData)
      socket.emit("send-analyst-msg", messageData) // Try alternative event name
    } catch (error) {
      console.error("Error sending message via socket:", error)
      return false
    }
    return true
  } else {
    console.error("Socket not connected. Cannot send analyst message via socket.")
    return false
  }
}

// Disconnect socket on cleanup
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
    console.log("Socket disconnected")
  }
}
