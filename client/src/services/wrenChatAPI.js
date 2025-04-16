import { fetchApi, sendNotify } from "../helper";
import { markMessagesAsRead } from "../services/wrenSocket";
import { 
  formatMessages, 
  calculateUnreadMessages,
  getCurrentUser,
  DEFAULT_IMAGE
} from "../utils/utils";

// Fetch all users 
export const fetchUsers = async () => {
  try {
    const payload = {
      method: "GET",
      url: "/auth/user",
    };

    const res = await fetchApi(payload);
    const data = res?.data;
    const currentUserId = localStorage.getItem("CURRUNT_USER_ID");

    // Format users data excluding current user
    const formattedUsers = data.list
      .filter((user) => user._id !== currentUserId)
      .map((user) => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        designation: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        profilePic: user.profileImg || DEFAULT_IMAGE,
        groupName: `${user.firstName} ${user.lastName}`,
        imageURL: user.profileImg || DEFAULT_IMAGE,
        isOnline: user.isOnline,
        type: user.role.toLowerCase(),
        messages: [],
        lastMessage: "",
        dateTime: "",
        unreadMessages: 0,
      }));
      
    console.log("Formatted Users:", formattedUsers);
    return formattedUsers;
  } catch (err) {
    console.error("Error fetching users:", err);
    sendNotify("error", "Failed to load users");
    return [];
  }
};

// Fetch all group chats
export const fetchAllGroups = async (existingMessageData = []) => {
  try {
    const payload = {
      method: "GET",
      url: "/chat/groups",
    };

    const response = await fetchApi(payload);

    if (response?.error) {
      console.error("Error fetching groups:", response.error);
      return [];
    }

    // Get groups and current user info
    const groups = response.data || [];
    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.id) {
      console.error("Current user information not found");
      return [];
    }

    // Format groups data
    const formattedGroups = groups
      .filter((group) => {
        // Check if user is member or creator
        const isMember =
          group.members && Array.isArray(group.members)
            ? group.members.some((memberId) => memberId.toString() === currentUser.id.toString())
            : false;

        const isCreator = group.createdBy ? group.createdBy.toString() === currentUser.id.toString() : false;

        return isMember || isCreator;
      })
      .map((group) => {
        // Process group messages
        const lastMessage =
          group.messages && group.messages.length > 0 ? group.messages[group.messages.length - 1] : null;

        const hasAttachments = lastMessage?.attachment && lastMessage.attachment.length > 0;

        return {
          id: group._id,
          imageURL: group.icon || DEFAULT_IMAGE,
          groupName: group.name || "Group",
          lastMessage: hasAttachments
            ? `${lastMessage.attachment.length} attachment(s)`
            : lastMessage
              ? lastMessage.content
              : "No messages",
          dateTime: new Date(group.createdAt).toLocaleString(),
          unreadMessages: calculateUnreadMessages(group),
          type: "groups",
          isOnline: true,
          messages: formatMessages(group.messages, currentUser.id.toString()) || [],
        };
      });

    return formattedGroups;
  } catch (error) {
    console.error("Error fetching groups:", error);
    sendNotify("error", "Failed to load groups");
    return [];
  }
};

// Fetch group messages
export const fetchGroupMessages = async (groupId) => {
  try {
    const payload = {
      method: "GET",
      url: `/chat/getgroup/messages?groupId=${groupId}`,
    };

    const response = await fetchApi(payload);

    if (response?.error) {
      sendNotify("error", "Failed to load messages");
      return [];
    }

    const currentUser = getCurrentUser();
    return formatMessages(response?.messages?.messages || [], currentUser.id.toString());
  } catch (error) {
    console.error("Error fetching group messages:", error);
    sendNotify("error", "Failed to load messages");
    return [];
  }
};

// Handle chat selection (single or group)
export const handleChatSelect = async (chat, messageData, socket) => {
  try {
    if (chat.type === "groups") {
      // Fetch group messages
      const messages = await fetchGroupMessages(chat.id);

      // Update messages in the chat data
      const updatedData = messageData.map((item) => {
        if (item.id === chat.id) {
          // Reset unread count to 0 when selecting the chat
          return { ...item, unreadMessages: 0, messages };
        }
        return item;
      });

      const updatedChat = {
        ...chat,
        messages,
        unreadMessages: 0, // Ensure the selected chat has 0 unread messages
      };

      // Store the last read timestamp for this group
      const lastReadTimestamps = JSON.parse(localStorage.getItem("lastReadTimestamps") || "{}");
      lastReadTimestamps[chat.id] = Date.now();
      localStorage.setItem("lastReadTimestamps", JSON.stringify(lastReadTimestamps));

      // If using socket.io, emit an event to mark messages as read
      const currentUser = getCurrentUser();
      if (socket && currentUser) {
        markMessagesAsRead(chat.id, currentUser.id);
      }

      return { updatedData, updatedChat };
    } else {
      // Handle single chat selection
      // TODO: Implement fetchSingleChatMessages here
      const updatedData = messageData.map((item) => 
        (item.id === chat.id ? { ...item, unreadMessages: 0 } : item)
      );

      return { updatedData, updatedChat: chat };
    }
  } catch (error) {
    console.error("Error in handleChatSelect:", error);
    throw error; // Let the calling function handle the error
  }
};