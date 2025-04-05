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