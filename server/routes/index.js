const initializeRoutes = (app) => {
  app.use("/api/v1/auth", require("./v1/accounts.routes"));
  app.use("/api/v1/task", require("./v1/tasks.routes"));
  app.use("/api/v1/notification", require("./v1/notifications.routes"));
  app.use("/api/v1/document", require("./v1/document.routes"));
  app.use("/api/v1/wc-report", require("./v1/worldCheck.routes"));
  app.use("/api/v1/messages", require("./v1/messages.route"));
  app.use("/api/v1/chat", require("./v1/groups.routes"));
};

module.exports = initializeRoutes;
