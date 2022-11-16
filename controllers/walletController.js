const { PrivateKey } = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");
const Mnemonic = require("bitcore-mnemonic");
const fs = require("fs");
const axios = require("axios");
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

/**
 * Mnemonic
 */
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
  res.json(mnemonic);
};

const getMnemonicCode = (selectedID) => {
  const mnemonics = loadMnemonics();
  const id = Number(selectedID);
  const mnemonic = mnemonics.find((mnemonic) => mnemonic.id === id);
  if (!mnemonic) {
    return "wallet not found";
  }
  return mnemonic.mnemonic;
};

/**
 * http://localhost:3000/wallets/newMnemonic
 */
const createMnemonic = (req, res, next) => {
  const mnemonics = loadMnemonics();
  let mnemonicCNT = Object.keys(mnemonics).length;
  const mnemonicCode = new Mnemonic(Mnemonic.Words.KOREAN);
  let str = JSON.stringify(mnemonicCode);

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

/**
 * HDwallet
 */
const getHDWallets = (req, res, next) => {
  const HDWallets = loadHDWallets();
  res.json(HDWallets);
};

/**
 * url: http://localhost:3000/wallets/newHDWallet?mnemonicID=1&index=0
 */
const createHDWallet = async (req, res, next) => {
  const HDwallets = loadHDWallets();
  let walletCNT = Object.keys(HDwallets).length;
  const codeID = req.query.mnemonicID;
  const index = req.query.index;
  // const code = getMnemonicCode(codeID);
  const code = await axios({
    method: "GET",
    url: `http://localhost:3000/wallets/mnemonicID/${codeID}`,
  });
  let passPhrase = Mnemonic(code.data.mnemonic);
  let xprv = passPhrase.toHDPrivateKey(passPhrase.toString(), network);
  // let parent = xpriv.deriveChild("m/44'/0'/0'");
  let child = xprv.deriveChild("m/44'/0'/0'/0/" + index);
  const newHDWallet = {
    mnemonicID: codeID,
    mnemonic: passPhrase.toString(),
  };
  const xprvKey = {
    xprvId: "xprv_" + codeID,
    xpub: xprv.xpubkey,
    privateKey: xprv.privateKey.toString(),
    address: xprv.publicKey.toAddress().toString(),
  };
  const newChildKey = {
    childId: "childprv_" + 0,
    privateKey: child.privateKey.toString(),
    address: child.publicKey.toAddress().toString(),
  };

  const foundMnemonicID = HDwallets.HDwallets.find(
    (i) => i.mnemonicID === codeID
  );

  if (!foundMnemonicID) {
    newHDWallet.xprvKey = [xprvKey];
    newHDWallet.keys = [newChildKey];
    HDwallets.HDwallets.push(newHDWallet);
    fs.writeFileSync(
      __dirname + "/../data/HDwallet.json",
      JSON.stringify(HDwallets)
    );
  } else {
    newChildKey.childId = "childprv_" + foundMnemonicID.keys.length;
    foundMnemonicID.keys.push(newChildKey);

    fs.writeFileSync(
      __dirname + "/../data/HDwallet.json",
      JSON.stringify(HDwallets)
    );
  }

  res.json(newChildKey);
};

module.exports = {
  getWallets: getWallets,
  getWallet: getWallet,
  createWallet: createWallet,
  getMnemonics: getMnemonics,
  getMnemonic: getMnemonic,
  createMnemonic: createMnemonic,
  getHDWallets: getHDWallets,
  createHDWallet: createHDWallet,
};
