import Default from "../assets/img/default_dp.png";

// Export default image for reuse
export const DEFAULT_IMAGE = Default;

// Get current user from local storage
export const getCurrentUser = () => {
  try {
    const storedUser = localStorage.getItem(process.env.REACT_APP_CURRENT_USER);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Error parsing stored user:", error);
    return null;
  }
};

// Format messages for display
export const formatMessages = (messages, currentUserId) => {
  if (!messages || !Array.isArray(messages)) return [];

  return messages.map((message, index) => {
    const messageDate = new Date(message.timestamp);
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")}${ampm}`;

    const formattedDate =
      messageDate.toDateString() === new Date().toDateString() ? "Today" : messageDate.toLocaleDateString();

    const currentUser = getCurrentUser();
    const currentUserName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "";

    return {
      id: message.id || index + 1,
      text: message.content,
      attachment: message.attachment || [],
      time: `${formattedDate}, ${formattedTime}`,
      isSender: message.sender === currentUserId,
      senderName: message.senderName === currentUserName ? "" : message.senderName,
    };
  });
};

// Calculate unread messages count
export const calculateUnreadMessages = (group) => {
  if (!group.messages || !Array.isArray(group.messages) || group.messages.length === 0) {
    return 0;
  }

  try {
    // Get the last read timestamps from localStorage
    const lastReadTimestamps = JSON.parse(localStorage.getItem("lastReadTimestamps") || "{}");
    const lastReadTime = lastReadTimestamps[group._id] || 0;

    // Count messages that arrived after the last read time
    return group.messages.filter((msg) => {
      const msgTimestamp = msg.timestamp || 0;
      return msgTimestamp > lastReadTime;
    }).length;
  } catch (error) {
    console.error("Error calculating unread messages:", error);
    return 0;
  }
};