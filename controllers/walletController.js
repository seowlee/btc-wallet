const { PrivateKey } = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");

const Mnemonic = require("bitcore-mnemonic");
const { get } = require("../routes");

// const fs = require("fs");
// const walletData = fs.readFileSync("../data/wallet.json");
// console.log("www" + walletData);
const walletData = [];

const network = testnet;

// const getWallet = (req, res, next) => {
//   const id = Number(req.params.walletID);
//   const wallet = wallets.find((wallet) => wallet.id === id);
//   if (!wallet) {
//     return res.status(404).send("allet not found");
//   }
//   res.json(wallet);
// };
const getWallets = (req, res, next) => {
  res.json(walletData);
};

const createWallet = (req, res, next) => {
  var privateKey = new PrivateKey();
  var address = privateKey.toAddress(network);
  const newWallet = {
    id: walletData.length + 1,
    privateKey: privateKey.toString(),
    address: address.toString(),
  };
  console.log(walletData);
  walletData.push(newWallet);
  console.log("new" + walletData);
  res.json(newWallet);
};

/**
 * Hierachical Determinstic wallet (HD wallet)
 */
// const createHDWallet = (network = mainnet) => {
//   let passPharse = new Mnemonic(Mnemonic.Words.KOREAN);
//   let xpriv = passPharse.toHDPrivateKey(passPharse.toString(), network);

//   return {
//     xpub: xpriv.xpubkey,
//     privateKey: xpriv.privateKey.toString(),
//     address: xpriv.publicKey.toAddress().toString(),
//     mnemonic: passPharse.toString(),
//   };
// };

module.exports = {
  getWallets: getWallets,
  createWallet: createWallet,
};
