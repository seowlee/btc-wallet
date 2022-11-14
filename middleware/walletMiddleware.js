const fs = require("fs");

const createWalletFile = (req, res, next) => {
  if (!fs.existsSync(__dirname + "/../data/wallet.json")) {
    fs.closeSync(fs.openSync(__dirname + "/../data/wallet.json", "w"));
  }
  // next();
};

const createHDWalletFile = (req, res, next) => {
  if (!fs.existsSync(__dirname + "/../data/HDwallet.json")) {
    fs.closeSync(
      fs.openSync(__dirname + "/../data/HDwallet.json", "w"),
      fs.writeFileSync(
        __dirname + "/../data/HDwallet.json",
        JSON.stringify({ HDwallets: [] })
      )
    );
  }
};

const createMnemonicFile = (req, res, next) => {
  if (!fs.existsSync(__dirname + "/../data/mnemonic.json")) {
    fs.closeSync(fs.openSync(__dirname + "/../data/mnemonic.json", "w"));
  }
};

const loadWallets = (req, res, next) => {
  try {
    const dataBuffer = fs.readFileSync(__dirname + "/../data/wallet.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

const loadHDWallets = (req, res, next) => {
  try {
    const dataBuffer = fs.readFileSync(__dirname + "/../data/HDwallet.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

const loadMnemonics = (req, res, next) => {
  try {
    const dataBuffer = fs.readFileSync(__dirname + "/../data/mnemonic.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

module.exports = {
  createWalletFile: createWalletFile,
  createHDWalletFile: createHDWalletFile,
  createMnemonicFile: createMnemonicFile,
  loadWallets: loadWallets,
  loadHDWallets: loadHDWallets,
  loadMnemonics: loadMnemonics,
};
