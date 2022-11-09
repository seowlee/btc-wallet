const { PrivateKey } = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");
const Mnemonic = require("bitcore-mnemonic");
const fs = require("fs");
const {
  createWalletFile,
  createHDWalletFile,
  createMnemonicFile,
  loadWallets,
  loadMnemonics,
  loadHDWallets,
} = require("../middleware/walletMiddleware.js");
const network = testnet;

createWalletFile();
createHDWalletFile();
createMnemonicFile();

// let wallets = JSON.parse(JSON.stringify(walletData));

const getWallets = (req, res, next) => {
  const wallets = loadWallets();
  res.json(wallets);
};

const getWallet = (req, res, next) => {
  const wallets = loadWallets();
  const id = Number(req.params.walletID);
  const wallet = wallets.find((wallet) => wallet.id === id);
  if (!wallet) {
    return res.status(404).send("wallet not found");
  }
  res.json(wallet);
};

const createWallet = (req, res, next) => {
  const wallets = loadWallets();
  let walletCNT = Object.keys(wallets).length;
  var privateKey = new PrivateKey();
  var address = privateKey.toAddress(network);
  const newWallet = {
    id: walletCNT + 1,
    privateKey: privateKey.toString(),
    address: address.toString(),
  };
  if (wallets.length == 0) {
    fs.writeFileSync(
      __dirname + "/../data/wallet.json",
      JSON.stringify([newWallet])
    );
  } else {
    wallets.push(newWallet);
    fs.writeFileSync(
      __dirname + "/../data/wallet.json",
      JSON.stringify(wallets)
    );
  }
  console.log("new" + wallets);
  res.status(200).json(newWallet);
};

/**
 * Hierachical Determinstic wallet (HD wallet)
 */
// const getHDWallets = (req, res, next) => {
//   res.json(HDwallets);
// };

const getMnemonics = (req, res, next) => {
  const mnemonics = loadMnemonics();
  res.json(mnemonics);
};

const getMnemonic = (req, res, next) => {
  const mnemonics = loadMnemonics();
  const id = Number(req.params.mnemonicID);
  const mnemonic = mnemonics.find((mnemonic) => mnemonic.id === id);
  if (!mnemonic) {
    return res.status(404).send("wallet not found");
  }
  res.json(mnemonic.mnemonic);
};

const getMnemonicCode = (selectedID) => {
  const mnemonics = loadMnemonics();
  const id = selectedID;
  const mnemonic = mnemonics.find((mnemonic) => mnemonic.id === id);
  if (!mnemonic) {
    return "wallet not found";
  }
  res.json(mnemonic);
  return mnemonic.mnemonic;
};

const createMnemonic = (req, res, next) => {
  const mnemonics = loadMnemonics();
  let mnemonicCNT = Object.keys(mnemonics).length;
  let mnemonicCode = new Mnemonic(Mnemonic.Words.KOREAN);
  const str = "{" + mnemonicCode.toString() + "}";
  console.log(str);
  console.log(JSON.parse(str));
  const newMnemonic = {
    id: mnemonicCNT + 1,
    mnemonic: mnemonicCode.toString(),
  };
  if (mnemonics.length == 0) {
    fs.writeFileSync(
      __dirname + "/../data/mnemonic.json",
      JSON.stringify([newMnemonic])
    );
  } else {
    mnemonics.push(newMnemonic);
    fs.writeFileSync(
      __dirname + "/../data/mnemonic.json",
      JSON.stringify(mnemonics)
    );
  }
  res.json(newMnemonic);
};

const createHDWallet = (req, res, next) => {
  const HDwallets = loadHDWallets();
  let walletCNT = Object.keys(HDwallets).length;
  let passPharse = getMnemonicCode();
  let xpriv = passPharse.toHDPrivateKey(passPharse, network);
  const newHDWallet = {
    id: walletCNT + 1,
    xpub: xpriv.xpubkey,
    privateKey: xpriv.privateKey.toString(),
    address: xpriv.publicKey.toAddress().toString(),
    mnemonic: passPharse.toString(),
  };
  if (HDwallets.length == 0) {
    fs.writeFileSync(
      __dirname + "/../data/HDwallet.json",
      JSON.stringify([newHDWallet])
    );
  } else {
    HDwallets.push(newHDWallet);
    fs.writeFileSync(
      __dirname + "/../data/HDwallet.json",
      JSON.stringify(HDwallets)
    );
  }
  console.log("new" + HDwallets);
  res.json(newHDWallet);
};

module.exports = {
  getWallets: getWallets,
  getWallet: getWallet,
  createWallet: createWallet,
  getMnemonics: getMnemonics,
  getMnemonic: getMnemonic,
  createMnemonic: createMnemonic,
  createHDWallet: createHDWallet,
};
