"use client"

import { useState, useEffect, useRef } from "react"
import EmojiPicker from "emoji-picker-react"
import "../assets/css/style.scss"

import { io } from "socket.io-client"
import { sendNotify, fetchApi } from "../helper"
import { Image, Modal, Spin } from "antd"
import { sendAnalystMessage, fetchChatMessages } from "../services/analystChatAPI"

const ChatWindow = ({ user, refreshMessages, isLoading }) => {
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const userRef = useRef(user)
  const [isOnline, setIsOnline] = useState(user.type !== "groups" && user.isOnline)
  const [messages, setMessages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [isSending, setIsSending] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const [newMessage, setNewMessage] = useState("")
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  const [arrivalMessage, setArrivalMessage] = useState(null)

  // Initialize socket
  const socketRef = useRef(null)

  useEffect(() => {
    // Initialize socket with better configuration
    const socketUrl = process.env.REACT_APP_SOCKET_URL
    if (!socketUrl) {
      console.error("Socket URL is not defined")
      return
    }

    console.log("Initializing socket in ChatWindow to:", socketUrl)

    socketRef.current = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["websocket", "polling"],
      forceNew: false,
    })

    socketRef.current.on("connect", () => {
      console.log("Socket connected in ChatWindow with ID:", socketRef.current.id)
      setSocketConnected(true)

      // Join rooms after connection is established
      if (user.type === "groups") {
        socketRef.current.emit("join-room", user.id)
      } else if (user.type === "analyst") {
        socketRef.current.emit("join-analyst-room", user.id)
      }

      // Add user to socket
      const currentUserId_ = localStorage.getItem("CURRUNT_USER_ID")
      if (currentUserId_) {
        socketRef.current.emit("add-user", currentUserId_)
      }
    })

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error in ChatWindow:", error)
      setSocketConnected(false)
    })

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected in ChatWindow:", reason)
      setSocketConnected(false)
    })

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // Load messages when user changes
  useEffect(() => {
    if (user && user.id) {
      loadMessages()
    }
  }, [user])

  // Load messages function
  const loadMessages = async () => {
    if (!user || !user.id) return

    try {
      setIsLoadingMessages(true)

      if (user.type === "analyst") {
        const { success, messages } = await fetchChatMessages(user.id)
        if (success) {
          setMessages(messages)
        } else {
          // If we couldn't fetch messages, use what we have
          setMessages(user.messages || [])
        }
      } else if (user.type === "groups") {
        // Use the messages from the user object for groups
        setMessages(user.messages || [])
      } else {
        // For regular chats
        setMessages(user.messages || [])
      }

      // Scroll to bottom after loading messages
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error("Error loading messages:", error)
      sendNotify("error", "Failed to load messages")
      // Fallback to existing messages
      setMessages(user.messages || [])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (user.type !== "groups" && user.type !== "analyst") {
      if (socketRef.current) {
        socketRef.current.on("user-status", (status) => {
          if (status.userId === user.id) {
            setIsOnline(status.isOnline)
          }
        })
      }

      return () => {
        if (socketRef.current) {
          socketRef.current.off("user-status")
        }
      }
    }
  }, [user.id, user.type])

  useEffect(() => {
    if (userRef.current) {
      userRef.current = user
    }

    // Join room when user changes
    if (socketRef.current && socketRef.current.connected) {
      if (user.type === "groups") {
        socketRef.current.emit("join-room", user.id)
      } else if (user.type === "analyst") {
        socketRef.current.emit("join-analyst-room", user.id)
      }
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage])
  }, [arrivalMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Listen for regular messages
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("msg-recieve", (msg) => {
        console.log("Received message payload:", msg)
        if (userRef.current.id === msg.sender) {
          setArrivalMessage({
            id: `${msg.sender}-${msg.text}-${Date.now()}`,
            text: msg.text,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSender: false,
          })
        }
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("msg-recieve")
      }
    }
  }, [])

  // Listen for group messages
  useEffect(() => {
    if (user.type === "groups" && socketRef.current) {
      socketRef.current.on("group-msg-recieve", (msg) => {
        const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))
        if (msg.socketId !== socketRef.current.id && msg.groupId == user.id) {
          console.log("Group message received from server:", msg.text)
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: msg.text,
              time: Date.now(),
              isSender: false,
              senderName: msg.senderName,
              attachment: msg.attachment,
            },
          ])
        }
      })

      return () => {
        if (socketRef.current) {
          socketRef.current.off("group-msg-recieve")
        }
      }
    }
  }, [user.id, user.type])

  // Listen for analyst messages
  useEffect(() => {
    if (user.type === "analyst" && socketRef.current) {
      // Listen for both event names that might be used
      const eventNames = ["analyst-msg-recieve", "send-analyst-msg", "analyst-message"]

      eventNames.forEach((eventName) => {
        socketRef.current.on(eventName, (msg) => {
          console.log(`Analyst message received (${eventName}):`, msg)

          // Check if this message is for the current chat
          if (msg.chatId === user.id) {
            const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))
            const isSender = msg.sender === currentUser?.id

            // Only add the message if it's not from the current user or if it's from a different socket
            if (!isSender || (msg.socketId && msg.socketId !== socketRef.current.id)) {
              setMessages((prevMessages) => [
                ...prevMessages,
                {
                  id: Date.now(),
                  text: msg.text || msg.content,
                  time: Date.now(),
                  isSender: false,
                  senderName: msg.senderName,
                  attachment: msg.attachment || [],
                },
              ])
            }
          }
        })
      })

      return () => {
        if (socketRef.current) {
          eventNames.forEach((eventName) => {
            socketRef.current.off(eventName)
          })
        }
      }
    }
  }, [user.id, user.type])

  const openModal = (images) => {
    setSelectedImages(images)
    setVisible(true)
  }

  const formatTime = (timestamp) => {
    const now = Date.now()
    const differenceInMinutes = Math.floor((now - timestamp) / 60000)

    if (differenceInMinutes < 1) {
      return "now"
    } else {
      return timestamp
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    try {
      setIsSending(true)
      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER) || "{}")

      if (user.type === "groups") {
        // Handle group message
        // Add msg to database
        addMessageToDB({
          groupId: user.id,
          senderId: currentUser.id.toString(),
          messageText: newMessage,
          senderName: currentUser.firstName + " " + currentUser.lastName,
        })

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("send-group-msg", {
            text: newMessage,
            sender: currentUser.id.toString(),
            groupId: user.id,
            senderName: currentUser.firstName + " " + currentUser.lastName,
          })
        } else {
          console.warn("Socket not connected. Group message will be sent via API only.")
        }

        setMessages([
          ...messages,
          {
            id: Date.now(),
            text: newMessage,
            time: Date.now(),
            isSender: true,
            attachment: [],
          },
        ])

        setNewMessage("")
      } else if (user.type === "analyst") {
        // Handle analyst message
        console.log("Sending analyst message to:", user.id)

        // Store the message text before clearing the input
        const messageToSend = newMessage

        // Add message to UI immediately for better UX
        const newMsg = {
          id: Date.now(),
          text: messageToSend,
          time: Date.now(),
          isSender: true,
          senderName: `${currentUser.firstName} ${currentUser.lastName}`,
          attachment: [],
        }

        setMessages((prevMessages) => [...prevMessages, newMsg])
        setNewMessage("") // Clear input field immediately

        // Send message to API
        try {
          const success = await sendAnalystMessage(user.id, messageToSend)

          if (!success) {
            console.error("Failed to send analyst message")
            sendNotify("error", "Message not delivered. Please try again.")
            // You could add code here to mark the message as "failed" in the UI
          }
        } catch (error) {
          console.error("Error in sendAnalystMessage:", error)
          sendNotify("error", "Failed to send message: " + (error.message || "Unknown error"))
        }
      } else {
        // Handle regular message
        const messagePayload = {
          text: newMessage,
          sender: localStorage.getItem("CURRUNT_USER_ID"),
          receiver: user.id,
          receiverName: user.name,
          socketId: socketRef.current ? socketRef.current.id : null,
        }

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("send-msg", messagePayload)
        } else {
          console.warn("Socket not connected. Message will not be sent in real-time.")
        }

        setMessages([
          ...messages,
          {
            id: Date.now(),
            text: newMessage,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSender: true,
            attachment: [],
          },
        ])

        setNewMessage("")
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error)
      sendNotify("error", "Failed to send message: " + (error.message || "Unknown error"))
    } finally {
      setIsSending(false)
    }
  }

  const addMessageToDB = (messageData) => {
    const payload = {
      method: "POST",
      url: "/chat/savemessage",
      data: messageData,
    }

    fetchApi(payload)
      .then((response) => {
        console.log(response)
        if (response) {
          if (response?.error) {
            sendNotify("error", response?.error?.response?.data?.message)
          } else {
            sendNotify("success", response?.message)
          }
        }
      })
      .catch((error) => {
        sendNotify("error", "An error occurred: " + JSON.stringify(error))
      })
  }

  const handleAttachmentClick = () => {
    fileInputRef.current.click()
  }

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result

        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              resolve(blob)
            },
            "image/jpeg",
            quality,
          )
        }

        img.onerror = (error) => reject(error)
      }

      reader.onerror = (error) => reject(error)
    })
  }

  const convertBlobToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
    })
  }

  const handleFileChange = async (event) => {
    if (isSending) return

    setIsSending(true)
    try {
      const uploadedFiles = Array.from(event.target.files)

      const attachmentFile = await Promise.all(
        uploadedFiles.map(async (file) => {
          const compressedBlob = file // await compressImage(file);
          const base64String = await convertBlobToBase64(compressedBlob)

          return {
            id: Date.now() + Math.random(),
            text: file.name,
            time: "Now",
            isSender: true,
            fileURL: base64String,
          }
        }),
      )

      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

      if (user.type === "groups") {
        // Handle group attachment
        addMessageToDB({
          groupId: user.id,
          senderId: currentUser?.id?.toString(),
          messageText: newMessage,
          attachment: attachmentFile,
          senderName: currentUser.firstName + " " + currentUser.lastName,
        })

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("send-group-msg", {
            text: newMessage,
            attachment: attachmentFile,
            sender: currentUser.id.toString(),
            groupId: user.id,
            senderName: currentUser.firstName + " " + currentUser.lastName,
          })
        }
      } else if (user.type === "analyst") {
        // Handle analyst attachment
        try {
          // Add attachment to UI immediately
          setMessages((prev) => [...prev, ...attachmentFile])

          // Send to API
          await sendAnalystMessage(user.id, newMessage, attachmentFile)
        } catch (error) {
          console.error("Error sending analyst attachment:", error)
          sendNotify("error", "Failed to send attachment")
        }
      } else {
        // Handle regular attachment
        const messagePayload = {
          text: newMessage,
          attachment: attachmentFile,
          sender: localStorage.getItem("CURRUNT_USER_ID"),
          receiver: user.id,
          receiverName: user.name,
          socketId: socketRef.current ? socketRef.current.id : null,
        }

        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("send-msg", messagePayload)
        }

        setMessages((prev) => [...prev, ...attachmentFile])
      }
    } catch (error) {
      console.error("Error handling file upload:", error)
      sendNotify("error", "Failed to upload file")
    } finally {
      setIsSending(false)
    }
  }

  const handleEmojiClick = (emoji) => {
    setNewMessage(newMessage + emoji.emoji)
    setIsEmojiPickerOpen(false)
  }

  function getMessageText(message) {
    try {
      const currentUser = JSON.parse(localStorage.getItem(process.env.REACT_APP_CURRENT_USER))

      if (message === "Welcome to the group!\ncreated by " + currentUser.firstName + " " + currentUser.lastName) {
        return "Welcome to the group! Created by you"
      } else {
        return message
      }
    } catch (error) {
      console.error("Error parsing user in getMessageText:", error)
      return message
    }
  }

  // Handle refresh button click
  const handleRefresh = () => {
    if (refreshMessages) {
      refreshMessages()
    } else {
      loadMessages()
    }
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="user-info">
          <img src={user.imageURL || "/placeholder.svg"} alt={user.groupName} className="user-avatar" />
          <div className="user-details">
            <h4>{user.groupName}</h4>
            {user.type !== "groups" && <p>{isOnline ? "Online" : "Offline"}</p>}
          </div>
        </div>
        <div className="header-actions">
          {!socketConnected && (
            <div className="connection-status">
              <span className="status-indicator offline"></span>
              <span className="status-text">Offline</span>
            </div>
          )}
          <button className="refresh-btn" onClick={handleRefresh} disabled={isLoading || isLoadingMessages}>
            <i className={`ri-refresh-line ${isLoading || isLoadingMessages ? "animate-spin" : ""}`}></i>
          </button>
        </div>
      </div>

      <div className="chat-body">
        {isLoading || isLoadingMessages ? (
          <div className="loading-container">
            <Spin size="large" tip="Loading messages..." />
          </div>
        ) : messages && messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.isSender ? "sender" : "receiver"}`}>
              {message?.attachment?.length > 0 ? (
                <div className="image-grid">
                  {message.attachment.map((file, index) => {
                    if (file.fileURL && file.fileURL.startsWith("data:image/")) {
                      return (
                        <img
                          key={index}
                          src={file.fileURL || "/placeholder.svg"}
                          alt={`Image-${index}`}
                          style={{ width: "100px", height: "100px", margin: "10px" }}
                          onClick={() => openModal(message.attachment.map((img) => img.fileURL))}
                        />
                      )
                    } else if (file.fileURL && file.fileURL.startsWith("data:application/pdf")) {
                      return (
                        <embed key={index} src={file.fileURL} type="application/pdf" width="300px" height="300px" />
                      )
                    } else {
                      return (
                        <a
                          key={index}
                          href={file.fileURL}
                          download={`file-${index}`}
                          style={{ display: "block", margin: "10px", color: "blue" }}
                        >
                          Download File {index + 1}
                        </a>
                      )
                    }
                  })}
                </div>
              ) : (
                <p>
                  {message.senderName && <span className="sender-name">{message.senderName}</span>}
                  {getMessageText(message.text)}
                </p>
              )}

              <span className="message-time">{formatTime(message.time)}</span>
            </div>
          ))
        ) : (
          <div className="empty-messages">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
        <Modal open={visible} footer={null} onCancel={() => setVisible(false)}>
          <Image.PreviewGroup>
            {selectedImages &&
              selectedImages.map((img, index) => <Image key={index} src={img || "/placeholder.svg"} />)}
          </Image.PreviewGroup>
        </Modal>
      </div>
      <div className="messageField">
        <button className="icon-btn" onClick={handleAttachmentClick} disabled={isSending}>
          <i className="ri-attachment-line"></i>
        </button>

        <input type="file" ref={fileInputRef} multiple style={{ display: "none" }} onChange={handleFileChange} />

        <div className="emoji-wrapper">
          {isEmojiPickerOpen && (
            <div className="emoji-picker">
              <EmojiPicker onEmojiClick={handleEmojiClick} searchDisabled={true} />
            </div>
          )}
          <button className="icon-btn" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}>
            <i className="ri-emoji-sticker-line"></i>
          </button>
        </div>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
        />

        <button className="icon-btn" onClick={handleSendMessage} disabled={isSending}>
          <i className={isSending ? "ri-loader-4-line animate-spin" : "ri-send-plane-2-fill"}></i>
        </button>
      </div>
    </div>
  )
}

export default ChatWindow
