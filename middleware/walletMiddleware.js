const fs = require("fs");

const createWalletFile = (req, res, next) => {
  if (!fs.existsSync(__dirname + "/../data/wallet.json")) {
    fs.closeSync(fs.openSync(__dirname + "/../data/wallet.json", "w"));
  }
  // next();
};

module.exports = {
  createWalletFile: createWalletFile,
};
