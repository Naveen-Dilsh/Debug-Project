// const sendMessage = (io, messageData) => {
//     io.emit("receive_message", messageData); 
// };

// module.exports = { sendMessage };

// //naming the create message and the logic plus the api which exposes to the frontend 

// const createMessage = async (messageBody) => {
//     const message = await Message.create(messageBody);
//     return message;
//   };
//   const getUsers = async function name(req, res, next) {
//     let { limit, skip, id } = req.query;
  
//     let query = {};
  
//     let message = responser();
//     let user = req.user;
  
//     try {
//       let account = await Accounts.findById(ObjectId(user?.id));
  
//       let project = {
//         profileImg: 1,
//         firstName: 1,
//         lastName: 1,
//         username: 1,
//         email: 1,
//         role: 1,
//         status: 1,
//         resetReq: 1,
//         companyName: 1,
//       };
  
//       if (["admin", "analyst", "client"].includes(account.role)) {
//         if (account.role == "client") {
//           query["parent"] = { $eq: ObjectId(user?.id) };
//         }
//         if (account.role == "analyst") {
//           query["role"] = { $eq: "client" };
//         }
//         if (account.role == "admin") {
//           query["$and"] = [
//             { role: { $ne: "end-user" } },
//             { role: { $ne: "super-admin" } },
//           ];
//         }
//         if (id) {
//           query["_id"] = { $eq: ObjectId(id) };
  
//           let user = await Accounts.aggregate([
//             {
//               $match: { ...query },
//             },
//             {
//               $project: { ...project },
//             },
//           ]);
  
//           return response.success(res, 200, "Get user successfully.", user[0]);
//         } else {
//           let users = await Accounts.aggregate([
//             {
//               $match: { status: { $ne: "D" } },
//             },
//             {
//               $match: { ...query },
//             },
//             {
//               $skip: skip ? Number(skip) : 0,
//             },
//             {
//               $limit: limit ? Number(limit) : 50,
//             },
//             {
//               $sort: { createdAt: 1 },
//             },
//             {
//               $project: { ...project },
//             },
//           ]);
  
//           delete query["status"];
  
//           let counts = await Accounts.aggregate([
//             {
//               $match: query,
//             },
//             {
//               $group: {
//                 _id: null,
//                 total: {
//                   $sum: {
//                     $cond: [{ $ne: ["$status", "D"] }, 1, 0],
//                   },
//                 },
//               },
//             },
//           ]);
  
//           let data = {
//             list: users,
//             count: counts[0] || { total: 0 },
//           };
  
//           return response.success(res, 200, "Get all users successfully.", data);
//         }
//       } else {
//         return response.error(
//           res,
//           message["unauthorized"]["status"],
//           message["unauthorized"]["message"]
//         );
//       }
//     } catch (error) {
//       console.log(error);
//       return response.error(
//         res,
//         message["server_error"]["status"],
//         message["server_error"]["message"]
//       );
//     }
//   };
const Message = require('../models/message.model');

exports.createMessage = async (req, res) => {
    try {
        const { sender, receiver, content } = req.body;
        const newMessage = new Message({ sender, receiver, content });
        await newMessage.save();
        res.status(201).json({ message: 'Message sent!', data: newMessage });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
};

exports.getMessages = async (req, res, next) => {
    try {
      const { from, to } = req.body;
  
      const messages = await Message.find({
        $or: [
          { senderChatID: from, receiverChatID: to },
          { senderChatID: to, receiverChatID: from }
        ]
      }).sort({ updatedAt: 1 });
  
      const projectedMessages = messages.map((msg) => {
        return {
          attachment:msg?.attachment,
          isSender: msg?.senderChatID?.toString() === from,
          text: msg?.text,
          time:new Date(msg?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });
  
    res.json({
      messages: projectedMessages,
      count: projectedMessages.length
    });
    } catch (ex) {
      next(ex);
    }
  };