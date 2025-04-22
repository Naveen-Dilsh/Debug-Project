"use client"

// wren-connect.tsx

import { useState, useEffect } from "react"
import ChatBoxContainer from "../../components/ChatBoxContainer"
import SearchBar from "../../components/Searchbar"
import ChatWindow from "../../components/ChatWindow"
import WrenChatPopup from "../../components/Wren-Connect/WrenChatPop"
import WrenGroupCreationPopup from "../../components/Wren-Connect/WrenGroupCreate"
import { initializeSocket } from "../../services/wrenSocket"
import { fetchUsers, fetchAllGroups, handleChatSelect } from "../../services/wrenChatAPI"
import {
  fetchAnalysts,
  fetchAnalystChats,
  handleAnalystChatSelect,
  initializeAnalystChat,
  fetchChatMessages,
} from "../../services/analystChatAPI"
import { DEFAULT_IMAGE } from "../../constant/wrenConstant"
import { sendNotify } from "../../helper/index"

const WrenConnect = () => {
  // State management
  const [messageData, setMessageData] = useState([])
  const [usersData, setUsersData] = useState([])
  const [analystData, setAnalystData] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Group creation state
  const [popupVisible, setPopupVisible] = useState(false)
  const [isGroupChat, setIsGroupChat] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [groupName, setGroupName] = useState("")
  const [groupImage, setGroupImage] = useState(DEFAULT_IMAGE)
  const [showGroupCreationPopup, setShowGroupCreationPopup] = useState(false)

  // Socket reference
  const socket = initializeSocket()

  // Initialize data on component mount
  useEffect(() => {
    loadInitialData()
    setupSocketListeners()

    return () => {
      // Clean up socket listeners
      if (socket) {
        socket.off("newMessage")
        socket.off("analystMessage")
      }
    }
  }, [])

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socket) {
      console.error("Socket not initialized")
      // Try to reinitialize
      const newSocket = initializeSocket()
      if (!newSocket) {
        sendNotify("error", "Failed to connect to chat server")
        return
      }
    }

    console.log("Setting up socket listeners")

    socket.on("connect", () => {
      console.log("Socket connected successfully")
    })

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      sendNotify("error", "Chat connection error")
    })

    // Listen for group messages
    socket.on("newMessage", (data) => {
      console.log("Received group message:", data)
      handleNewMessage(data)
    })

    // Listen for analyst messages
    socket.on("analystMessage", (data) => {
      console.log("Received analyst message:", data)
      handleAnalystMessage(data)
    })
  }

  // Handle incoming new messages from socket
  const handleNewMessage = (data) => {
    if (data.groupId) {
      setMessageData((prevData) => {
        return prevData.map((chat) => {
          if (chat.id === data.groupId) {
            const isSelected = selectedChat && selectedChat.id === data.groupId
            const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

            return {
              ...chat,
              lastMessage: data.content,
              dateTime: new Date(data.timestamp).toLocaleString(),
              unreadMessages: isSelected ? 0 : chat.unreadMessages + 1,
              messages: [
                ...(chat.messages || []),
                {
                  id: Date.now(),
                  text: data.content,
                  attachment: data.attachment || [],
                  time: new Date(data.timestamp).toLocaleString(),
                  isSender: data.sender === currentUser?.id,
                  senderName: data.senderName || "",
                },
              ],
            }
          }
          return chat
        })
      })
    }
  }

  // Handle incoming analyst messages from socket
  const handleAnalystMessage = (data) => {
    if (data.chatId) {
      setMessageData((prevData) => {
        return prevData.map((chat) => {
          if (chat.id === data.chatId) {
            const isSelected = selectedChat && selectedChat.id === data.chatId
            const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

            return {
              ...chat,
              lastMessage: data.content,
              dateTime: new Date(data.timestamp).toLocaleString(),
              unreadMessages: isSelected ? 0 : chat.unreadMessages + 1,
              messages: [
                ...(chat.messages || []),
                {
                  id: Date.now(),
                  text: data.content,
                  attachment: data.attachment || [],
                  time: new Date(data.timestamp).toLocaleString(),
                  isSender: data.sender === currentUser?.id,
                  senderName: data.senderName || "",
                },
              ],
            }
          }
          return chat
        })
      })
    }
  }

  // Load initial users, groups, and analysts data
  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // Fetch users
      const users = await fetchUsers()
      setUsersData(users)
      setMessageData(users)

      // Fetch groups
      const groups = await fetchAllGroups(users)
      setMessageData((prevData) => {
        // Remove any duplicates before adding
        const existingIds = new Set(groups.map((g) => g.id))
        const filteredPrevData = prevData.filter((item) => item.type !== "groups" || !existingIds.has(item.id))
        return [...filteredPrevData, ...groups]
      })

      // Fetch analysts
      const analysts = await fetchAnalysts()
      setAnalystData(analysts)

      // Add analysts to message data
      setMessageData((prevData) => {
        // Remove any duplicates before adding
        const existingIds = new Set(analysts.map((a) => a.id))
        const filteredPrevData = prevData.filter((item) => item.type !== "analyst" || !existingIds.has(item.id))
        return [...filteredPrevData, ...analysts]
      })

      // Fetch existing analyst chats
      const analystChats = await fetchAnalystChats()
      if (analystChats.length > 0) {
        setMessageData((prevData) => {
          // Remove any duplicates before adding
          const existingIds = new Set(analystChats.map((c) => c.id))
          const filteredPrevData = prevData.filter((item) => item.type !== "analyst" || !existingIds.has(item.id))
          return [...filteredPrevData, ...analystChats]
        })
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      sendNotify("error", "Failed to load users, groups, or analysts")
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh messages for the selected chat
  const refreshMessages = async () => {
    if (!selectedChat || !selectedChat.id) return

    try {
      setIsLoading(true)

      if (selectedChat.type === "analyst") {
        // Fetch latest messages for analyst chat
        const { success, messages } = await fetchChatMessages(selectedChat.id)

        if (success) {
          // Update the selected chat with new messages
          setSelectedChat((prev) => ({
            ...prev,
            messages: messages,
          }))

          // Also update in the message data
          setMessageData((prevData) => {
            return prevData.map((chat) => {
              if (chat.id === selectedChat.id) {
                return {
                  ...chat,
                  messages: messages,
                  unreadMessages: 0,
                }
              }
              return chat
            })
          })
        }
      }
      // Add similar logic for group chats if needed
    } catch (error) {
      console.error("Error refreshing messages:", error)
      sendNotify("error", "Failed to refresh messages")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle chat selection (wrapper function)
  const onChatSelect = async (chat) => {
    try {
      setIsLoading(true)

      if (chat.type === "analyst") {
        // Handle analyst chat selection
        const { updatedData, updatedChat } = await handleAnalystChatSelect(chat, messageData, socket)
        setMessageData(updatedData)
        setSelectedChat(updatedChat)
      } else {
        // Handle regular chat selection
        const { updatedData, updatedChat } = await handleChatSelect(chat, messageData, socket)
        setMessageData(updatedData)
        setSelectedChat(updatedChat)
      }
    } catch (error) {
      console.error("Error selecting chat:", error)
      sendNotify("error", "Failed to load chat messages")
    } finally {
      setIsLoading(false)
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
  const addUserToChat = async (user) => {
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

      // If it's an analyst, initialize the chat
      if (user.type.toLowerCase() === "analyst") {
        try {
          const initializedChat = await initializeAnalystChat(user.id)
          if (initializedChat) {
            newChat.id = initializedChat._id
            newChat.analystId = initializedChat.analystId
            newChat.userId = initializedChat.userId

            // Fetch initial messages if available
            const { success, messages } = await fetchChatMessages(newChat.id)
            if (success) {
              newChat.messages = messages
            }
          }
        } catch (error) {
          console.error("Error initializing analyst chat:", error)
          sendNotify("error", "Failed to initialize analyst chat")
        }
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
            onChatSelect={onChatSelect}
          />
        </div>
        <div className="group-card-wrapper">
          <ChatBoxContainer
            title="Analysts"
            type="analyst"
            searchTerm={searchTerm}
            messageData={filteredMessageData}
            onChatSelect={onChatSelect}
          />
        </div>
        <div className="group-card-wrapper">
          <ChatBoxContainer
            title="Clients"
            type="client"
            searchTerm={searchTerm}
            messageData={filteredMessageData}
            onChatSelect={onChatSelect}
          />
        </div>
      </div>

      {/*-------------------------------------- Right Column -----------------------------*/}
      <div className="rightColumnMain">
        {selectedChat ? (
          <div className="chatwindow">
            <ChatWindow user={selectedChat} refreshMessages={refreshMessages} isLoading={isLoading} />
          </div>
        ) : (
          <div className="empty-chat-placeholder">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {popupVisible && (
        <WrenChatPopup
          togglePopup={togglePopup}
          isGroupChat={isGroupChat}
          toggleGroupChat={toggleGroupChat}
          usersData={usersData}
          selectedUsers={selectedUsers}
          handleUserSelect={handleUserSelect}
          proceedToGroupCreation={proceedToGroupCreation}
        />
      )}

      {showGroupCreationPopup && (
        <WrenGroupCreationPopup
          closePopup={() => setShowGroupCreationPopup(false)}
          groupName={groupName}
          setGroupName={setGroupName}
          groupImage={groupImage}
          setGroupImage={setGroupImage}
          selectedUsers={selectedUsers}
          setMessageData={setMessageData}
          setSelectedChat={setSelectedChat}
          setShowGroupCreationPopup={setShowGroupCreationPopup}
          setSelectedUsers={setSelectedUsers}
        />
      )}
    </div>
  )
}

export default WrenConnect
