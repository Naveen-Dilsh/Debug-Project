const jwt = require("jsonwebtoken");

class JwtAuth {
  async generateToken(user) {
    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        username: user.username,
        twoFactor: user.twoFactor,
        qrCode: user.qrCode,
        verifyId: user.verifyId,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_TIMEOUT }
    );
    return accessToken;
  }

  async verifyToken(req, res, next) {
    var token = req.headers["authorization"];
    if (!token || (token && !token.startsWith("Bearer "))) {
      return res.status(401).json({ error: true, message: "Unauthorized" });
    }
    token = token.slice(7, token.length);
    if (token == null)
      return res.status(401).json({ error: true, message: "Unauthorized" });
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.JWT_TIMEOUT },
      async (err, user) => {
        if (err) {
          if (user && user.id) {
            await Accounts.updateOne({ _id: user._id }, { isOnline: false });
            io.emit("user-status", { userId: user._id, isOnline: false });
          }
          console.log(err);
          return res
            .status(403)
            .json({ error: true, message: "Invalid access token" });
        }
        req.user = user;
        next();
      }
    );
  }
}

module.exports = new JwtAuth();
