const { PrivateKey } = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");
const Mnemonic = require("bitcore-mnemonic");
const fs = require("fs");
const axios = require("axios");

const network = testnet;

// let wallets = JSON.parse(JSON.stringify(walletData));

/**
 * Hierachical Determinstic wallet (HD wallet)
 */

/**
 * Mnemonic
 */

// const getMnemonic = (req, res, next) => {
//   const mnemonics = loadMnemonics();
//   const id = Number(req.params.mnemonicID);
//   const mnemonic = mnemonics.find((mnemonic) => mnemonic.id === id);
//   if (!mnemonic) {
//     return res.status(404).send("wallet not found");
//   }
//   res.json(mnemonic);
// };

/**
 * @description create HDwallet - mnemonic
 * @method POST
 * @URL http://localhost:3000/wallets/btc/createWallet
 * @param {JSON} req
 * {
 * "passphrase": String,
 * }
 * @param {JSON} res
 * {
 * "wallet_mnemonic": String,
 * }
 */
const createHDWallet = (req, res, next) => {
  var addrData = {
    passphrase: req.body.passphrase,
  };
  const mnemonicCode = new Mnemonic(Mnemonic.Words.KOREAN);
  let xprv = mnemonicCode.toHDPrivateKey(addrData.passphrase, network);

  const newMnemonic = {
    wallet_mnemonic: mnemonicCode.toString(),
  };

  res.json(newMnemonic);
};

/**
 * @description create BTC HDwallet address
 * @method POST
 * @URL http://localhost:3000/wallets/btc/createAddress
 * @param {JSON} req
 * {
 * "wallet_mnemonic": String,
 * "passphrase": String,
 * "address_index": number,
 * }
 * @param {JSON} res
 * {
 * "address": String,
 * "derivation_path": String,
 * }
 */
const createAddress = async (req, res, next) => {
  var addrData = {
    wallet_mnemonic: req.body.wallet_mnemonic,
    passphrase: req.body.passphrase,
    address_index: req.body.address_index,
  };
  let mnemonicCode = Mnemonic(addrData.wallet_mnemonic);
  let xprv = mnemonicCode.toHDPrivateKey(addrData.passphrase, network);
  // let parent = xpriv.deriveChild("m/44'/0'/0'");
  let child = xprv.deriveChild("m/44'/1'/0'/0/" + addrData.address_index);

  const newChildKey = {
    address: child.publicKey.toAddress().toString(),
    derivation_path: "m/44'/1'/0'/0/" + addrData.address_index,
  };

  res.json(newChildKey);
};

module.exports = {
  createHDWallet: createHDWallet,
  createAddress: createAddress,
};
