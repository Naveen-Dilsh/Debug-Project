const bcrypt = require("bcrypt");

class Crypto {
  async encrypt(password) {
    const salt = await bcrypt.genSalt(10);
    var encPass = await bcrypt.hash(password, salt);
    return encPass;
  }

  async compare(dbPass, givenPass) {
    const isValid = await bcrypt.compare(givenPass, dbPass);
    return isValid;
  }
}

module.exports = new Crypto();
