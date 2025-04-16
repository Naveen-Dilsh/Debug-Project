import { fetchApi, sendNotify } from "../helper";
import { getCurrentUser, DEFAULT_IMAGE } from "../utils/utils";
import { fetchGroupMessages } from "../services/wrenChatAPI";

// Create new group
export const createGroup = async ({
  groupName,
  groupImage, 
  selectedUsers,
  setMessageData,
  setSelectedChat,
  setShowGroupCreationPopup,
  setGroupName,
  setGroupImage,
  setSelectedUsers
}) => {
  if (!groupName.trim()) {
    sendNotify("error", "Please enter a group name");
    return;
  }

  // Get current user
  const currentUser = getCurrentUser();
  if (!currentUser) {
    sendNotify("error", "User not found. Please log in again");
    return;
  }

  const userId = currentUser.id;
  const selectedUserIds = selectedUsers.map((user) => user.id);

  // Create group WITHOUT any image first
  const groupData = {
    name: groupName.trim(),
    icon: null, // Don't send any image data initially
    createdBy: userId,
    members: [...selectedUserIds, userId], // Include current user in group
  };

  console.log("Creating group with data:", groupData);

  // Create group API call
  const payload = {
    method: "POST",
    url: "/chat/initgroup",
    data: groupData,
  };

  try {
    const response = await fetchApi(payload);
    console.log("Group creation response:", response);

    if (response?.error) {
      sendNotify("error", response?.error?.response?.data?.message || "Failed to create group");
      return;
    }

    // Try different paths to find the groupId
    const groupId =
      response?.data?.groupId ||
      response?.data?._id ||
      response?.data?.id ||
      (response?.data && response?.data.group && response?.data.group._id);

    console.log("Extracted groupId:", groupId);

    if (groupId) {
      try {
        // Fetch the group messages immediately to get the welcome message
        const messages = await fetchGroupMessages(groupId);

        // Create the welcome message if it doesn't exist yet
        const welcomeMessageText = `Welcome to the group!\nCreated by ${currentUser.firstName} ${currentUser.lastName}`;
        
        const welcomeMessage =
          messages.length > 0
            ? messages
            : [
                {
                  id: 1,
                  text: welcomeMessageText,
                  attachment: [],
                  time: new Date().toLocaleString(),
                  isSender: true,
                  senderName: "",
                },
              ];

        // Add new group to message data with the welcome message
        const newGroup = {
          id: groupId,
          imageURL: DEFAULT_IMAGE, // Use default image initially
          groupName: groupName.trim(),
          lastMessage: welcomeMessageText,
          dateTime: new Date().toLocaleString(),
          unreadMessages: 1, // Set to 1 to show the orange bubble
          type: "groups",
          isOnline: true,
          messages: welcomeMessage,
        };

        setMessageData((prevData) => [...prevData, newGroup]);
        setSelectedChat(newGroup);
        
        // Handle group icon upload if custom image is set
        if (groupImage !== DEFAULT_IMAGE) {
          await uploadGroupIcon(groupId, groupImage, setMessageData, setSelectedChat);
        } else {
          sendNotify("success", "Group created successfully");
        }

        // Reset form data
        setShowGroupCreationPopup(false);
        setGroupName("");
        setGroupImage(DEFAULT_IMAGE);
        setSelectedUsers([]);
      } catch (error) {
        handleGroupCreationFallback(error, groupId, groupName, currentUser, setMessageData, setSelectedChat);
      }
    } else {
      console.error("Group created but couldn't find ID in response", response);
      sendNotify("error", "Group created but no ID returned");
    }
  } catch (error) {
    console.error("Error creating group:", error);
    sendNotify("error", "Failed to create group");
  }
};

// Upload group icon
const uploadGroupIcon = async (groupId, groupImage, setMessageData, setSelectedChat) => {
  try {
    // Check if it's a blob URL
    const isGroupImageBlob = groupImage.startsWith("blob:");

    if (isGroupImageBlob) {
      // Convert blob to file data before sending to server
      const blob = await fetch(groupImage).then(res => res.blob());
      
      // Convert blob to base64 string
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      const base64String = await base64Promise;

      // Send the base64 string directly
      const iconPayload = {
        method: "POST",
        url: `/chat/uploadGroupIcon/${groupId}`,
        data: { icon: base64String },
      };

      const iconRes = await fetchApi(iconPayload);
      handleIconUploadResponse(iconRes, groupId, groupImage, setMessageData, setSelectedChat);
    } else {
      // It's already a data URL, send it directly
      const iconPayload = {
        method: "POST",
        url: `/chat/uploadGroupIcon/${groupId}`,
        data: { icon: groupImage },
      };

      const iconRes = await fetchApi(iconPayload);
      handleIconUploadResponse(iconRes, groupId, groupImage, setMessageData, setSelectedChat);
    }
  } catch (err) {
    console.error("Error uploading icon:", err);
    sendNotify("warning", "Group created but icon upload failed");
  }
};

// Handle icon upload response
const handleIconUploadResponse = (response, groupId, groupImage, setMessageData, setSelectedChat) => {
  if (response?.error) {
    sendNotify("warning", "Group created but icon upload failed");
  } else {
    // Update the group icon in the UI
    setMessageData((prevData) =>
      prevData.map((item) => (item.id === groupId ? { ...item, imageURL: groupImage } : item))
    );

    setSelectedChat((prev) => {
      if (prev && prev.id === groupId) {
        return { ...prev, imageURL: groupImage };
      }
      return prev;
    });

    sendNotify("success", "Group created with custom icon");
  }
};

// Fallback when group message fetching fails
const handleGroupCreationFallback = (error, groupId, groupName, currentUser, setMessageData, setSelectedChat) => {
  console.error("Error fetching welcome message:", error);
  
  const welcomeMessageText = `Welcome to the group!\nCreated by ${currentUser.firstName} ${currentUser.lastName}`;
  const newGroup = {
    id: groupId,
    imageURL: DEFAULT_IMAGE,
    groupName: groupName.trim(),
    lastMessage: welcomeMessageText,
    dateTime: new Date().toLocaleString(),
    unreadMessages: 1,
    type: "groups",
    isOnline: true,
    messages: [],
  };

  setMessageData((prevData) => [...prevData, newGroup]);
  setSelectedChat(newGroup);
};

