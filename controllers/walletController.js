const { PrivateKey } = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");
const Mnemonic = require("bitcore-mnemonic");
const fs = require("fs");
const { createWalletFile } = require("../middleware/walletMiddleware.js");

createWalletFile();
const walletData = fs.readFileSync(__dirname + "/../data/wallet.json");
// let wallets = JSON.parse(JSON.stringify(walletData));

console.log(walletData.length);

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
  let wallets = JSON.parse(walletData);
  console.log(wallets);
  res.json(wallets);
};

const createWallet = (req, res, next) => {
  let wallets = JSON.parse(JSON.stringify(walletData));
  var privateKey = new PrivateKey();
  var address = privateKey.toAddress(network);
  const newWallet = {
    id: walletData.length + 1,
    privateKey: privateKey.toString(),
    address: address.toString(),
  };
  if (walletData.length == 0) {
    fs.writeFileSync(
      __dirname + "/../data/wallet.json",
      JSON.stringify([newWallet])
    );
  } else {
    // const wallet = JSON.parse(walletData.toString());
    // wallet.push(newWallet);
    fs.writeFileSync(
      __dirname + "/../data/wallet.json",
      JSON.stringify(newWallet)
    );
  }
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
