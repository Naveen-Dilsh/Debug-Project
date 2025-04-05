"use client"

import { useState, useEffect, useRef } from "react"
import ChatBoxContainer from "../components/ChatBoxContainer"
import SearchBar from "../components/Searchbar"
import ChatWindow from "../components/ChatWindow"
import Default from "../assets/img/default_dp.png"
import io from "socket.io-client"
import { sendNotify, fetchApi } from "../helper"

const WrenConnect = () => {
  // Socket connection
  const socket = useRef()
  socket.current = io(process.env.REACT_APP_SOCKET_URL)

  // State management
  const [messageData, setMessageData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Group creation state
  const [popupVisible, setPopupVisible] = useState(false)
  const [isGroupChat, setIsGroupChat] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState("")
  const [groupImage, setGroupImage] = useState(Default)
  const [showGroupCreationPopup, setShowGroupCreationPopup] = useState(false)

  // Fetch users and groups on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const payload = {
        method: "GET",
        url: `/auth/user`,
      }

      const res = await fetchApi(payload)
      const data = res?.data
      const currentUserId = localStorage.getItem("CURRUNT_USER_ID")

      // Format users data excluding current user
      const formattedUsers = data.list
        .filter((user) => user._id !== currentUserId)
        .map((user) => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          designation: user.role.charAt(0).toUpperCase() + user.role.slice(1),
          profilePic: user.profileImg || Default,
          groupName: `${user.firstName} ${user.lastName}`,
          imageURL: user.profileImg,
          isOnline: user.isOnline,
          type: user.role.toLowerCase(),
          messages: [],
          lastMessage: "",
          dateTime: "",
          unreadMessages: 0,
        }))
      console.log("Formatted Users:", formattedUsers)
      setUsersData(formattedUsers)
      setMessageData(formattedUsers)

      // Fetch group chats after users are loaded
      fetchAllGroups()
    } catch (err) {
      console.error("Error fetching users:", err)
      sendNotify("error", "Failed to load users")
    }
  }

  //------------------------------------- Handle chat selection (single or group)
  const handleChatSelect = async (chat) => {
    try {
      if (chat.type === "groups") {
        // Fetch group messages
        const messages = await fetchGroupMessages(chat.id)

        // Update messages in the chat data
        const updatedData = messageData.map((item) => {
          if (item.id === chat.id) {
            return { ...item, unreadMessages: 0, messages }
          }
          return item
        })

        setMessageData(updatedData)
        setSelectedChat({
          ...chat,
          messages,
        })
      } else {
        // Handle single chat selection
        // Fetch individual chat messages (implementation needed)
        const updatedData = messageData.map((item) => (item.id === chat.id ? { ...item, unreadMessages: 0 } : item))

        setMessageData(updatedData)
        setSelectedChat(chat)

        // TODO: Implement fetchSingleChatMessages here
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
      sendNotify("error", "Failed to load chat messages")
    }
  }

  // Toggle add new chat popup
  const togglePopup = () => {
    setPopupVisible(!popupVisible)
    setIsGroupChat(false)
    setSelectedUsers([])
  }

  // Toggle group chat creation mode
  const toggleGroupChat = () => {
    setIsGroupChat(true)
    setSelectedUsers([])
  }

  // Handle user selection for individual or group chat
  const handleUserSelect = (user) => {
    if (!user) return

    if (isGroupChat) {
      // Handle group chat user selection
      const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id)

      const updatedUsers = isSelected
        ? selectedUsers.filter((selectedUser) => selectedUser.id !== user.id)
        : [...selectedUsers, user]

      setSelectedUsers(updatedUsers)
    } else {
      // Handle individual chat user selection
      addUserToChat(user)
    }
  }

  // Add user to chat list for individual chat
  const addUserToChat = (user) => {
    if (!user || !user.designation) return

    // Check if chat already exists
    const chatExists = messageData.some((chat) => chat.id === user.id)

    if (chatExists) {
      // If chat already exists, just select it
      const existingChat = messageData.find((chat) => chat.id === user.id)
      setSelectedChat(existingChat)
    } else {
      // Create new chat entry
      const newChat = {
        id: user.id,
        imageURL: user.profilePic,
        groupName: user.name,
        lastMessage: "Start a conversation",
        dateTime: "Now",
        unreadMessages: 0,
        type: user.type.toLowerCase(),
        isOnline: user.isOnline || false,
        messages: [],
      }

      setMessageData((prevData) => [...prevData, newChat])
      setSelectedChat(newChat)
    }

    setPopupVisible(false)
  }

  // Proceed to group creation
  const proceedToGroupCreation = () => {
    if (selectedUsers.length === 0) {
      sendNotify("error", "Please select at least one user for the group")
      return
    }

    setPopupVisible(false)
    setShowGroupCreationPopup(true)
  }

  // Handle group creation
  const handleGroupCreation = () => {
    if (!groupName.trim()) {
      sendNotify("error", "Please enter a group name")
      return
    }

    // Get current user from local storage
    const storedUser = localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
    if (!storedUser) {
      sendNotify("error", "User not found. Please log in again")
      return
    }

    const currentUser = JSON.parse(storedUser)
    const userId = currentUser.id
    const selectedUserIds = selectedUsers.map((user) => user.id)

    // Create group WITHOUT any image first
    const groupData = {
      name: groupName.trim(),
      icon: null, // Don't send any image data initially
      createdBy: userId,
      members: [...selectedUserIds, userId], // Include current user in group
    }

    console.log("Creating group with data:", groupData)

    // Create group API call
    const payload = {
      method: "POST",
      url: "/chat/initgroup",
      data: groupData,
    }

    fetchApi(payload)
      .then((response) => {
        console.log("Group creation response:", response)

        if (response?.error) {
          sendNotify("error", response?.error?.response?.data?.message || "Failed to create group")
        } else {
          // Try different paths to find the groupId
          const groupId =
            response?.data?.groupId ||
            response?.data?._id ||
            response?.data?.id ||
            (response?.data && response?.data.group && response?.data.group._id)

          console.log("Extracted groupId:", groupId)

          if (groupId) {
            // Add new group to message data
            const newGroup = {
              id: groupId,
              imageURL: Default, // Use default image initially
              groupName: groupName.trim(),
              lastMessage: "Group created",
              dateTime: new Date().toLocaleString(),
              unreadMessages: 0,
              type: "groups",
              isOnline: true,
              messages: [],
            }

            setMessageData((prevData) => [...prevData, newGroup])
            setSelectedChat(newGroup)

            // If we have a custom image (not the default), upload it separately
            if (groupImage !== Default) {
              // Check if it's a blob URL
              const isGroupImageBlob = groupImage.startsWith("blob:")

              if (isGroupImageBlob) {
                // Convert blob to file data before sending to server
                fetch(groupImage)
                  .then((res) => res.blob())
                  .then(async (blob) => {
                    try {
                      // Convert blob to base64 string
                      const reader = new FileReader()
                      const base64Promise = new Promise((resolve) => {
                        reader.onloadend = () => resolve(reader.result)
                        reader.readAsDataURL(blob)
                      })

                      const base64String = await base64Promise

                      // Send the base64 string directly
                      const iconPayload = {
                        method: "POST",
                        url: `/chat/uploadGroupIcon/${groupId}`,
                        data: { icon: base64String },
                      }

                      const iconRes = await fetchApi(iconPayload)
                      console.log("Icon upload response:", iconRes)

                      if (iconRes?.error) {
                        sendNotify("warning", "Group created but icon upload failed")
                      } else {
                        // Update the group icon in the UI
                        setMessageData((prevData) =>
                          prevData.map((item) => (item.id === groupId ? { ...item, imageURL: groupImage } : item)),
                        )

                        if (selectedChat && selectedChat.id === groupId) {
                          setSelectedChat((prev) => ({ ...prev, imageURL: groupImage }))
                        }

                        sendNotify("success", "Group created with custom icon")
                      }
                    } catch (err) {
                      console.error("Error processing or uploading icon:", err)
                      sendNotify("warning", "Group created but icon upload failed")
                    }
                  })
              } else {
                // It's already a data URL, send it directly
                const iconPayload = {
                  method: "POST",
                  url: `/chat/uploadGroupIcon/${groupId}`,
                  data: { icon: groupImage },
                }

                fetchApi(iconPayload)
                  .then((iconRes) => {
                    console.log("Icon upload response:", iconRes)
                    if (iconRes?.error) {
                      sendNotify("warning", "Group created but icon upload failed")
                    } else {
                      // Update the group icon in the UI
                      setMessageData((prevData) =>
                        prevData.map((item) => (item.id === groupId ? { ...item, imageURL: groupImage } : item)),
                      )

                      if (selectedChat && selectedChat.id === groupId) {
                        setSelectedChat((prev) => ({ ...prev, imageURL: groupImage }))
                      }

                      sendNotify("success", "Group created with custom icon")
                    }
                  })
                  .catch((err) => {
                    console.error("Error uploading icon:", err)
                    sendNotify("warning", "Group created but icon upload failed")
                  })
              }
            } else {
              sendNotify("success", "Group created successfully")
            }

            setShowGroupCreationPopup(false)
            setGroupName("")
            setGroupImage(Default)
            setSelectedUsers([])
          } else {
            console.error("Group created but couldn't find ID in response", response)
            sendNotify("error", "Group created but no ID returned")
          }
        }
      })
      .catch((error) => {
        console.error("Error creating group:", error)
        sendNotify("error", "Failed to create group")
      })
  }

  // Create group API call
  const createGroup = (group, callback) => {
    if (!group.name || !group.createdBy) {
      sendNotify("error", "Group name and creator information are required")
      return
    }

    const payload = {
      method: "POST",
      url: "/chat/initgroup",
      data: group,
    }

    fetchApi(payload)
      .then((response) => {
        console.log("Complete API response structure:", JSON.stringify(response, null, 2))

        if (response?.error) {
          sendNotify("error", response?.error?.response?.data?.message || "Failed to create group")
        } else {
          // Try different paths to find the groupId
          console.log("response.data:", response?.data)
          console.log("Direct groupId:", response?.data?.groupId)
          console.log("_id property:", response?.data?._id)
          console.log("id property:", response?.data?.id)

          // Try to find the groupId in various possible locations
          const groupId =
            response?.data?.groupId ||
            response?.data?._id ||
            response?.data?.id ||
            (response?.data && response?.data.group && response?.data.group._id)

          console.log("Extracted groupId:", groupId)

          if (callback && groupId) {
            callback(groupId)
          } else {
            console.error("Group created but couldn't find ID in response", response)
            sendNotify("error", "Group created but no ID returned")
          }
        }
      })
      .catch((error) => {
        console.error("Error creating group:", error)
        sendNotify("error", "Failed to create group")
      })
  }

  // Fetch all group chats
  const fetchAllGroups = async () => {
    try {
      const payload = {
        method: "GET",
        url: "/chat/groups",
      }

      const response = await fetchApi(payload)

      if (response?.error) {
        console.error("Error fetching groups:", response.error)
        return
      }

      // Get groups and current user info
      const groups = response.data || []
      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

      if (!currentUser || !currentUser.id) {
        console.error("Current user information not found")
        return
      }

      // Format groups data
      const formattedGroups = groups
        .filter((group) => {
          // Check if user is member or creator
          const isMember =
            group.members && Array.isArray(group.members)
              ? group.members.some((memberId) => memberId.toString() === currentUser.id.toString())
              : false

          const isCreator = group.createdBy ? group.createdBy.toString() === currentUser.id.toString() : false

          return isMember || isCreator
        })
        .map((group) => {
          // Process group messages
          const lastMessage =
            group.messages && group.messages.length > 0 ? group.messages[group.messages.length - 1] : null

          const hasAttachments = lastMessage?.attachment && lastMessage.attachment.length > 0

          return {
            id: group._id,
            imageURL: group.icon || Default,
            groupName: group.name || "Group",
            lastMessage: hasAttachments
              ? `${lastMessage.attachment.length} attachment(s)`
              : lastMessage
                ? lastMessage.content
                : "No messages",
            dateTime: new Date(group.createdAt).toLocaleString(),
            unreadMessages: group.messages ? group.messages.filter((msg) => !msg.read).length : 0,
            type: "groups",
            isOnline: true,
            messages: formatMessages(group.messages, currentUser.id.toString()) || [],
          }
        })

      // Merge formatted groups with existing message data
      setMessageData((prevData) => {
        // Remove any duplicates before adding
        const existingIds = new Set(formattedGroups.map((g) => g.id))
        const filteredPrevData = prevData.filter((item) => item.type !== "groups" || !existingIds.has(item.id))

        return [...filteredPrevData, ...formattedGroups]
      })
    } catch (error) {
      console.error("Error fetching groups:", error)
      sendNotify("error", "Failed to load groups")
    }
  }

  // Format messages for display
  const formatMessages = (messages, currentUserId) => {
    if (!messages || !Array.isArray(messages)) return []

    return messages.map((message, index) => {
      const messageDate = new Date(message.timestamp)
      const hours = messageDate.getHours()
      const minutes = messageDate.getMinutes()
      const ampm = hours >= 12 ? "pm" : "am"
      const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, "0")}${ampm}`

      const formattedDate =
        messageDate.toDateString() === new Date().toDateString() ? "Today" : messageDate.toLocaleDateString()

      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

      const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`

      return {
        id: message.id || index + 1,
        text: message.content,
        attachment: message.attachment || [],
        time: `${formattedDate}, ${formattedTime}`,
        isSender: message.sender === currentUserId,
        senderName: message.senderName === currentUserName ? "" : message.senderName,
      }
    })
  }

  // Fetch group messages
  const fetchGroupMessages = async (groupId) => {
    try {
      const payload = {
        method: "GET",
        url: `/chat/getgroup/messages?groupId=${groupId}`,
      }

      const response = await fetchApi(payload)

      if (response?.error) {
        sendNotify("error", "Failed to load messages")
        return []
      }

      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

      return formatMessages(response?.messages?.messages || [], currentUser.id.toString())
    } catch (error) {
      console.error("Error fetching group messages:", error)
      sendNotify("error", "Failed to load messages")
      return []
    }
  }

  // Popup for adding new chat
  const renderAddNewChatPopup = () => (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="close-button" onClick={togglePopup}>
          <i className="ri-close-line"></i>
        </button>
        <h3>Add to WrenConnect</h3>
        <div className={`new-group ${isGroupChat ? "selected" : ""}`} onClick={toggleGroupChat}>
          New Group Chat
        </div>
        <div className={`new-member ${!isGroupChat ? "selected" : ""}`} onClick={() => setIsGroupChat(false)}>
          New Personal Chat
        </div>
        <div className="user-list">
          {usersData.map((user) => {
            const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id)
            return (
              <div key={user.id} className="user-item" onClick={() => handleUserSelect(user)}>
                <img src={user.profilePic || Default} alt={user.name} className="user-avatar" />
                <div className="user-information">
                  <span className="user-name">{user.name}</span>
                  <span className="user-designation">{user.designation}</span>
                </div>
                {isGroupChat && (
                  <div className="radio-button">
                    <i className={isSelected ? "ri-radio-button-fill" : "ri-radio-button-line"}></i>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {isGroupChat && selectedUsers.length > 0 && (
          <button className="action-button" onClick={proceedToGroupCreation}>
            <i className="ri-arrow-right-circle-fill"></i>
          </button>
        )}
      </div>
    </div>
  )

  // Popup for group creation
  const renderGroupCreationPopup = () => (
    <div className="group-popup-overlay">
      <div className="group-popup-content">
        <button className="group-close-button" onClick={() => setShowGroupCreationPopup(false)}>
          <i className="ri-close-line"></i>
        </button>
        <h3 className="group-popup-title">Creating New Group</h3>
        <div className="group-icon-selection">
          <img src={groupImage || Default} alt="Group Icon" className="group-icon-image" />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setGroupImage(URL.createObjectURL(e.target.files[0]))
              }
            }}
            className="group-icon-input"
          />
          <span className="group-icon-placeholder">ADD GROUP ICON</span>
        </div>
        <input
          type="text"
          placeholder="Add a Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="group-subject-input"
        />
        <button className="group-create-button" onClick={handleGroupCreation}>
          <i className="ri-check-line"></i>
        </button>
      </div>
    </div>
  )

  // Filter data by search term
  const filteredMessageData = searchTerm
    ? messageData.filter((chat) => chat.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
    : messageData

  return (
    <div className="main-container">
      <div className="leftColumnMain">
        <div className="topBar">
          <SearchBar placeholder="Search by chat names..." searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <button className="addButton" onClick={togglePopup}>
            <i className="ri-add-line"></i>
          </button>
        </div>
        <div className="group-card-wrapper">
          <ChatBoxContainer
            title="Groups"
            type="groups"
            searchTerm={searchTerm}
            messageData={filteredMessageData}
            onChatSelect={handleChatSelect}
          />
        </div>
        <div className="group-card-wrapper">
          <ChatBoxContainer
            title="Analysts"
            type="analyst"
            searchTerm={searchTerm}
            messageData={filteredMessageData}
            onChatSelect={handleChatSelect}
          />
        </div>
        <div className="group-card-wrapper">
          <ChatBoxContainer
            title="Clients"
            type="client"
            searchTerm={searchTerm}
            messageData={filteredMessageData}
            onChatSelect={handleChatSelect}
          />
        </div>
      </div>

      {/*-------------------------------------- Right Column -----------------------------*/}

      <div className="rightColumnMain">
        {selectedChat ? (
          <div className="chatwindow">
            <ChatWindow user={selectedChat} />
          </div>
        ) : (
          <div className="empty-chat-placeholder">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
      {popupVisible && renderAddNewChatPopup()}
      {showGroupCreationPopup && renderGroupCreationPopup()}
    </div>
  )
}

export default WrenConnect

