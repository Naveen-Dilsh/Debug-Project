  //////////// IMPLEMENTATION FOR SINGLE CHAT /////////////
  const fetchChatHistory = async () => {
    const obj = {
      from: localStorage.getItem("CURRUNT_USER_ID"),
      to: selectedChat.id,
    };
    let payload = {
      method: "post",
      url: "/messages/chats",
      data: obj,
    };
    fetchApi(payload)
      .then((message_history) => {
        //   setMessageData([]);
        if (message_history) {
          const chat_history = message_history.messages?.map((msg, index) => ({
            id: index + 1,
            text: msg.text,
            time: msg.time,
            isSender: msg.isSender,
            attachment:msg.attachment
          }));
          console.log("message history data :", chat_history);
          console.log("selected chat", selectedChat);
          setMessageHistory(chat_history);
          if (message_history?.error) {
            console.log("message history fetching error", message_history);
          } else {
          }
        }
      })
      .catch((error) => ({ error: JSON.stringify(error) }));
  };

  //////////// IMPLEMENTATION FOR SINGLE CHAT /////////////
  useEffect(() => {
    if (selectedChat.type !== "groups") {
      fetchChatHistory();
    }
  }, [selectedChat]);


  import React, { useState, useEffect, useRef } from "react";
  import EmojiPicker from "emoji-picker-react";
  import "../assets/css/style.scss";
  import { io } from "socket.io-client";
  import { sendNotify, fetchApi } from "../helper";
  import { Image, Modal } from "antd";
  
  const socket = io(process.env.REACT_APP_SOCKET_URL);
  
  const ChatWindow = ({ user, chatHistory }) => {
  
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const userRef = useRef(user);
    const chatHistoryRef = useRef(chatHistory);
    const [isOnline, setIsOnline] = useState(user.type !== "groups" && user.isOnline);
    const [messages, setMessages] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);
  
    const [newMessage, setNewMessage] = useState("");
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [visible, setVisible] = useState(false);
     
    const [arrivalMessage, setArrivalMessage] = useState(null);
  
    useEffect(() => {
      if (user.type !== "groups") {
        socket.on("user-status", (status) => {
          if (status.userId === user.id) {
            setIsOnline(status.isOnline);
          }
        });
    
        return () => {
          socket.off("user-status");
        };
      }
    }, [user.id, user.type]);
  
    useEffect(() => {
      if (user.type == "groups") {
        setMessages(user.messages || []);
      } else {
        setMessages(chatHistory ? chatHistory : []);
      }
  
      if (userRef.current) {
        userRef.current = user;
      }
    }, [user]);
  
    useEffect(() => {
      if (chatHistoryRef.current) {
        chatHistoryRef.current = chatHistory;
      }
      setMessages(chatHistory);
    }, [chatHistory]);
  
    useEffect(() => {
      const currentUserId_ = localStorage.getItem("CURRUNT_USER_ID");
      if (currentUserId_) {
        socket.emit("add-user", currentUserId_);
      }
    }, []);
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    useEffect(() => {
      arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
    }, [arrivalMessage]);
  
    useEffect(() => {
      setMessages(user.messages);
    }, [user]);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
      socket.on("msg-recieve", (msg) => {
        console.log(" recieve message payload:", msg);
        if (userRef.current.id === msg.sender) {
          setArrivalMessage({
            id: `${msg.sender}-${msg.text}-${Date.now()}`,
            text: msg.text,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSender: false,
          });
        }
      });
    }, []);
  
    useEffect(() => {
      socket.emit("join-room", user.id);
  
      socket.on("group-msg-recieve", (msg) => {
        const currentUser = JSON.parse(
          localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
        );
        if (msg.socketId !== socket.id && msg.groupId == user.id) {
          console.log("Message received from server:", msg.text);
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              id: prevMessages.length + 1,
              text: msg.text,
              time: Date.now(),
              isSender: false,
              senderName: msg.senderName,
              attachment:msg.attachment
            },
          ]);
        }
      });
      // Cleanup: Disconnect socket when component unmounts
      return () => {
        socket.off("group-msg-recieve");
      };
    }, [user.id]);
  
    const openModal = (images) => {
      setSelectedImages(images);
      setVisible(true);
    };
    const formatTime = (timestamp) => {
      const now = Date.now();
      const differenceInMinutes = Math.floor((now - timestamp) / 60000);
  
      if (differenceInMinutes < 1) {
        return "now";
      } else {
        return timestamp;
      }
    };
    const handleSendMessage = () => {
      console.log("user.type = " + user.type);
      if (user.type == "groups") {
        if (newMessage.trim()) {
          const currentUser = JSON.parse(
            localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
          );
          const messagePayload = {
            id: messages.length + 1,
            text: newMessage,
            time: Date.now(),
            isSender: true,
          };
  
          if (user.type === "groups") {
            // add msg to database
            addMessageToDB({
              groupId: user.id,
              senderId: currentUser.id.toString(),
              messageText: newMessage,
              senderName: currentUser.firstName + " " + currentUser.lastName,
            });
            socket.emit("send-group-msg", {
              text: newMessage,
              sender: currentUser.id.toString(),
              groupId: user.id,
              senderName: currentUser.firstName + " " + currentUser.lastName,
            });
          }
  
          setMessages([
            ...messages,
            {
              id: messages.length + 1,
              text: newMessage,
              time: Date.now(),
              isSender: true,
              attachment:[]
            },
          ]);
          setNewMessage("");
        }
      } else {
        console.log("++++++++++++++++++");
        if (newMessage.trim()) {
          console.log("++++++++++++++++++");
  
          const messagePayload = {
            text: newMessage,
            sender: localStorage.getItem("CURRUNT_USER_ID"),
            receiver: user.id,
            receiverName: user.name,
            socketId: socket.id,
          };
  
          socket.emit("send-msg", messagePayload);
          console.log("send message payload:", messagePayload);
  
          setMessages([
            ...messages,
            {
              id: messages.length + 1,
              text: newMessage,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isSender: true,
              attachment:[]
            },
          ]);
          setNewMessage("");
        }
      }
    };
  
    const addMessageToDB = (messageData) => {
      let payload = {
        method: "POST",
        url: "/chat/savemessage",
        data: messageData,
      };
  
      fetchApi(payload)
        .then((response) => {
          console.log(response);
          if (response) {
            if (response?.error) {
              sendNotify("error", response?.error?.response?.data?.message);
            } else {
              sendNotify("success", response?.message);
            }
          }
        })
        .catch((error) => {
          sendNotify("error", "An error occurred: " + JSON.stringify(error));
        });
    };
  
  
    const handleAttachmentClick = () => {
      fileInputRef.current.click();
    };
  
   
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
   
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
   
          
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
   
          canvas.width = width;
          canvas.height = height;
   
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
   
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            "image/jpeg", 
            quality
          );
        };
   
        img.onerror = (error) => reject(error);
      };
   
      reader.onerror = (error) => reject(error);
    });
  };
  
  const convertBlobToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };
  const handleFileChange = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
   
   
    const attachmentFile = await Promise.all(
      uploadedFiles.map(async (file) => {
        const compressedBlob =file// await compressImage(file);
        const base64String = await convertBlobToBase64(compressedBlob);
   
        return {
          id: messages.length + 1,
          text: file.name,
          time: "Now",
          isSender: true,
          fileURL: base64String,
        };
      })
    );
   
    const currentUser = JSON.parse(
      localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
    );
    addMessageToDB({
      groupId: user.id,
      senderId: currentUser?.id?.toString(),
      messageText: newMessage,
      attachment: attachmentFile,
      senderName: currentUser.firstName + " " + currentUser.lastName,
    });
   
    socket.emit("send-group-msg", {
      text: newMessage,
      attachment: attachmentFile,
      sender: currentUser.id.toString(),
      groupId: user.id,
      senderName: currentUser.firstName + " " + currentUser.lastName,
    });
    const messagePayload = {
      text: newMessage,
      attachment: attachmentFile,
      sender: localStorage.getItem("CURRUNT_USER_ID"),
      receiver: user.id,
      receiverName: user.name,
      socketId: socket.id,
    };
    socket.emit("send-msg", messagePayload);
  
   setMessages([...messages, ...attachmentFile]);
  
  };
  
  
  
    const handleEmojiClick = (emoji) => {
      setNewMessage(newMessage + emoji.emoji);
      setIsEmojiPickerOpen(false);
    };
  
    
  
    function getMessageText(message) {
      const currentUser = JSON.parse(
        localStorage.getItem(process.env.REACT_APP_CURRENT_USER)
      );
      if (
        message ===
        "Welcome to the group!\ncreated by " +
          currentUser.firstName +
          " " +
          currentUser.lastName
      ) {
        return "Welcome to the group! Created by you";
      } else {
        return message;
      }
    }
  
   
  
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="user-info">
            <img
              src={user.imageURL}
              alt={user.groupName}
              className="user-avatar"
            />
            <div className="user-details">
              <h4>{user.groupName}</h4>
              {user.type !== "groups" && <p>{isOnline ? "Online" : "Offline"}</p>}
            </div>
          </div>
        </div>
  
        <div className="chat-body">
   
   {messages.map((message, index) => (
      <div
        key={index}
        className={`message ${message.isSender ? "sender" : "receiver"}`}
      >
        {message?.attachment?.length > 0 ? (
          <div className="image-grid">
        {message.attachment.map((file, index) => {
          if (file.fileURL.startsWith("data:image/")) {
            return <img key={index} src={file.fileURL}  alt={`Image-${index}`} style={{ width: "100px", height: "100px", margin: "10px" }}  onClick={() =>
              openModal(message.attachment.map((img) => img.fileURL))
            }/>;
          } else if (file.fileURL.startsWith("data:application/pdf")) {
            return <embed key={index} src={file.fileURL}  type="application/pdf" width="300px" height="300px" />;
          } else {
            return (
              <a key={index} href={file.fileURL} download={`file-${index}`} style={{ display: "block", margin: "10px", color: "blue" }}>
                Download File {index + 1}
              </a>
            );
          }
        })}
  
          </div>
        ) : (
          <p>
            <span className="message-time">{message.senderName}</span>
            {getMessageText(message.text)}
          </p>
        )}
  
        <span className="message-time">{formatTime(message.time)}</span>
      </div>
    ))} 
  
      <div ref={messagesEndRef} />
        <Modal
        open={visible} footer={null} onCancel={() => setVisible(false)}>
          <Image.PreviewGroup>
            {selectedImages.map((img, index) => (
              <Image key={index} src={img} />
            ))}
          </Image.PreviewGroup>
          
        </Modal>
      </div>
        <div className="messageField">
          <button className="icon-btn" onClick={handleAttachmentClick}>
            <i className="ri-attachment-line"></i>
          </button>
  
          <input
            type="file"
            ref={fileInputRef}
         
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
  
          <div className="emoji-wrapper">
            {isEmojiPickerOpen && (
              <div className="emoji-picker">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  searchDisabled={true}
                />
              </div>
            )}
            <button
              className="icon-btn"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            >
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
                handleSendMessage();
              }
            }}
          />
  
          <button className="icon-btn" onClick={handleSendMessage}>
            <i className="ri-send-plane-2-fill"></i>
          </button>
        </div>
      </div>
    );
  };
  
  export default ChatWindow;