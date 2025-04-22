import { useState, useEffect } from "react"
import { Popconfirm } from "antd"
import { fetchApi } from "../helper"

const SingleAnalystChat = ({ chatId, imageURL, groupName, lastMessage, dateTime, unreadMessages, onDelete }) => {
  const [isDeleted, setIsDeleted] = useState(false)

  useEffect(() => {
    const deletedChats = JSON.parse(localStorage.getItem("deletedAnalystChats")) || []
    if (deletedChats.includes(chatId)) {
      setIsDeleted(true)
    }
  }, [chatId])

  const handleDelete = async () => {
    console.log(`Closing Analyst Chat ID: ${chatId}`)

    const payload = {
      method: "PUT",
      url: `/analyst/close/${chatId}`,
    }

    try {
      const response = await fetchApi(payload)
      if (!response.error) {
        // Store deleted chat IDs in local storage
        const deletedChats = JSON.parse(localStorage.getItem("deletedAnalystChats")) || []
        localStorage.setItem("deletedAnalystChats", JSON.stringify([...deletedChats, chatId]))

        setIsDeleted(true)
        console.log(`Analyst chat ${chatId} closed successfully.`)

        // Call onDelete callback if provided
        if (onDelete) {
          onDelete(chatId)
        }
      } else {
        console.error(`Error closing analyst chat: ${response.error}`)
      }
    } catch (err) {
      console.error(`Unexpected error: ${err}`)
    }
  }

  if (isDeleted) return null

  return (
    <div className="single-group-chat">
      <div className="mainColumnOne">
        <div className="columnOne">
          <div className="image-placeholder">
            <img src={imageURL || "/placeholder.svg"} alt={groupName} />
          </div>
        </div>

        <div className="columnTwo">
          <div className="group-name">{groupName}</div>
          <div className="last-message">{lastMessage}</div>
        </div>
      </div>

      <div className="columnThree">
        <div className="date-time">{dateTime}</div>
        {unreadMessages > 0 && <div className="unread-count">{unreadMessages}</div>}
      </div>

      <div className="columnFour">
        <Popconfirm
          title="Are you sure you want to close this chat?"
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
        >
          <div className="deleteOption" onClick={(e) => e.stopPropagation()}>
            <i className="ri-close-circle-line"></i>
          </div>
        </Popconfirm>
      </div>
    </div>
  )
}

export default SingleAnalystChat
