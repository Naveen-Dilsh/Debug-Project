import { fetchApi, sendNotify } from "../helper"
import { DEFAULT_IMAGE } from "../constant/wrenConstant"
import { formatMessages, getCurrentUser } from "../utils/messageUtils"
import { sendAnalystMessageSocket, markAnalystMessagesAsReadSocket } from "./wrenSocket"

// Fetch all analysts
export const fetchAnalysts = async () => {
  try {
    const payload = {
      method: "GET",
      url: "/auth/user?role=analyst",
    }

    const res = await fetchApi(payload)
    const data = res?.data
    const currentUserId = localStorage.getItem("CURRUNT_USER_ID")

    // Format analysts data to match your existing components
    const formattedAnalysts = data.list
      .filter((user) => user.role === "analyst" && user._id !== currentUserId)
      .map((analyst) => ({
        id: analyst._id,
        name: `${analyst.firstName} ${analyst.lastName}`,
        designation: "Analyst",
        profilePic: analyst.profileImg || DEFAULT_IMAGE,
        groupName: `${analyst.firstName} ${analyst.lastName}`,
        imageURL: analyst.profileImg || DEFAULT_IMAGE,
        isOnline: analyst.isOnline,
        type: "analyst", // This is important for your component filtering
        messages: [],
        lastMessage: "",
        dateTime: "",
        unreadMessages: 0,
      }))

    console.log("Formatted Analysts:", formattedAnalysts)
    return formattedAnalysts
  } catch (err) {
    console.error("Error fetching analysts:", err)
    sendNotify("error", "Failed to load analysts")
    return []
  }
}

// Fetch all analyst chats for the current user
export const fetchAnalystChats = async () => {
  try {
    const currentUser = getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.error("Current user information not found")
      return []
    }

    const role = currentUser.role || "user"

    const payload = {
      method: "GET",
      url:
        role === "analyst"
          ? `/analyst/chats?analystId=${currentUser.id}&role=analyst`
          : `/analyst/chats?userId=${currentUser.id}&role=user`,
    }

    const response = await fetchApi(payload)

    if (response?.error) {
      console.error("Error fetching analyst chats:", response.error)
      return []
    }

    // Get chats
    const chats = response.data || []

    // Format chats data to match your existing components
    const formattedChats = chats.map((chat) => {
      // Determine the other party in the chat
      const otherParty = role === "analyst" ? chat.userId : chat.analystId

      // Process chat messages
      const lastMessage = chat.messages && chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null

      const hasAttachments = lastMessage?.attachment && lastMessage.attachment.length > 0

      return {
        id: chat._id,
        imageURL: otherParty.profileImg || DEFAULT_IMAGE,
        groupName: `${otherParty.firstName} ${otherParty.lastName}`,
        lastMessage: hasAttachments
          ? `${lastMessage.attachment.length} attachment(s)`
          : lastMessage
            ? lastMessage.content
            : "No messages",
        dateTime: new Date(chat.updatedAt).toLocaleString(),
        unreadMessages: calculateUnreadMessages(chat),
        type: "analyst",
        isOnline: otherParty.isOnline || false,
        messages: formatMessages(chat.messages, currentUser.id.toString()) || [],
        analystId: chat.analystId._id,
        userId: chat.userId._id,
      }
    })

    return formattedChats
  } catch (error) {
    console.error("Error fetching analyst chats:", error)
    sendNotify("error", "Failed to load analyst chats")
    return []
  }
}

// Fetch messages for a specific chat
export const fetchChatMessages = async (chatId) => {
  try {
    if (!chatId) {
      console.error("Chat ID is required to fetch messages")
      return { success: false, messages: [] }
    }

    console.log("Fetching messages for chat:", chatId)

    const payload = {
      method: "GET",
      url: `/analyst/messages?chatId=${chatId}`,
    }

    const response = await fetchApi(payload)

    if (response?.error) {
      console.error("Error fetching chat messages:", response.error)
      return { success: false, messages: [] }
    }

    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.error("Current user information not found")
      return { success: false, messages: [] }
    }

    // Format messages for display
    const formattedMessages = formatMessages(response.data.messages, currentUser.id.toString())

    console.log("Fetched and formatted messages:", formattedMessages)

    return {
      success: true,
      messages: formattedMessages,
      chat: response.data,
    }
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    sendNotify("error", "Failed to load messages")
    return { success: false, messages: [] }
  }
}

// Calculate unread messages count
export const calculateUnreadMessages = (chat) => {
  if (!chat.messages || !Array.isArray(chat.messages)) return 0

  const currentUser = getCurrentUser()
  if (!currentUser) return 0

  return chat.messages.filter((msg) => !msg.isRead && msg.sender.toString() !== currentUser.id.toString()).length
}

// Initialize a new chat with an analyst
export const initializeAnalystChat = async (analystId) => {
  try {
    const currentUser = getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.error("Current user information not found")
      sendNotify("error", "User information not found")
      return null
    }

    const payload = {
      method: "POST",
      url: "/analyst/initialize",
      data: {
        userId: currentUser.id,
        analystId: analystId,
      },
    }

    console.log("Initializing analyst chat with payload:", payload)
    const response = await fetchApi(payload)

    if (response?.error) {
      console.error("Error initializing chat:", response.error)
      sendNotify("error", "Failed to initialize chat")
      return null
    }

    return response.data
  } catch (error) {
    console.error("Error initializing analyst chat:", error)
    sendNotify("error", "Failed to initialize chat")
    return null
  }
}

// Send a message in an analyst chat
export const sendAnalystMessage = async (chatId, messageText, attachment = []) => {
  try {
    console.log("Sending analyst message:", { chatId, messageText, attachment })

    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.error("Current user information not found")
      sendNotify("error", "User information not found")
      return false
    }

    // Make sure we have the correct ID format
    const senderId = currentUser.id || currentUser._id
    if (!senderId) {
      console.error("Sender ID not found in current user", currentUser)
      sendNotify("error", "User ID not found")
      return false
    }

    // Format the sender name
    const senderName = `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim()

    // First, try to get the chat to verify it exists
    const checkPayload = {
      method: "GET",
      url: `/analyst/messages?chatId=${chatId}`,
    }

    console.log("Checking if chat exists:", checkPayload)
    const checkResponse = await fetchApi(checkPayload)

    if (checkResponse?.error) {
      console.error("Chat not found, attempting to reinitialize:", checkResponse.error)

      // If chat doesn't exist, try to reinitialize it
      // This assumes the chatId might actually be the analystId in some cases
      const initResponse = await initializeAnalystChat(chatId)

      if (!initResponse) {
        sendNotify("error", "Failed to initialize chat")
        return false
      }

      // Use the new chat ID from initialization
      chatId = initResponse._id || initResponse.chatId
    }

    // Now send the message with the verified/new chat ID
    const payload = {
      method: "POST",
      url: "/analyst/message",
      data: {
        chatId: chatId,
        senderId: senderId,
        messageText: messageText,
        senderName: senderName,
        attachment: attachment || [],
      },
    }

    console.log("Sending API request with payload:", payload)

    const response = await fetchApi(payload)
    console.log("API response:", response)

    if (response?.error) {
      console.error("Error from API:", response.error)
      sendNotify("error", response.error?.message || "Failed to send message")
      return false
    }

    // Also send via socket for real-time updates
    try {
      sendAnalystMessageSocket({
        text: messageText,
        sender: senderId.toString(),
        chatId: chatId,
        senderName: senderName,
        attachment: attachment || [],
        receiverId:
          currentUser.role === "analyst"
            ? response.data?.chat?.userId || chatId
            : response.data?.chat?.analystId || chatId,
      })
    } catch (socketError) {
      console.error("Socket error:", socketError)
      // Don't return false here, as the API call was successful
    }

    return true
  } catch (error) {
    console.error("Error sending analyst message:", error)
    sendNotify("error", "Failed to send message: " + (error.message || "Unknown error"))
    return false
  }
}

// Mark messages as read
export const markAnalystMessagesAsRead = async (chatId) => {
  try {
    const currentUser = getCurrentUser()

    if (!currentUser || !currentUser.id) {
      console.error("Current user information not found")
      return false
    }

    const payload = {
      method: "POST",
      url: "/analyst/read",
      data: {
        chatId: chatId,
        userId: currentUser.id,
      },
    }

    const response = await fetchApi(payload)

    if (response?.error) {
      console.error("Error marking messages as read:", response.error)
      return false
    }

    // Also notify via socket
    markAnalystMessagesAsReadSocket(chatId, currentUser.id)

    return true
  } catch (error) {
    console.error("Error marking messages as read:", error)
    return false
  }
}

// Handle analyst chat selection
export const handleAnalystChatSelect = async (chat, messageData, socket) => {
  try {
    // Mark messages as read when selecting a chat
    if (chat.id) {
      await markAnalystMessagesAsRead(chat.id)
    }

    // Fetch the latest messages for this chat
    const { success, messages } = await fetchChatMessages(chat.id)

    // If we successfully fetched messages, update the chat object
    if (success && messages.length > 0) {
      chat.messages = messages
    }

    // Update unread count in the message data
    const updatedData = messageData.map((item) => {
      if (item.id === chat.id && item.type === "analyst") {
        return {
          ...item,
          unreadMessages: 0,
          messages: success ? messages : item.messages,
        }
      }
      return item
    })

    // Join the chat room via socket
    if (socket && chat.id) {
      socket.emit("join-analyst-room", chat.id)
    }

    return {
      updatedData,
      updatedChat: chat,
    }
  } catch (error) {
    console.error("Error handling analyst chat selection:", error)
    throw error
  }
}
