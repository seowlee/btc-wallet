var express = require("express");
var router = express.Router();

const {
  getWallets,
  getWallet,
  createWallet,
  getMnemonics,
  getMnemonic,
  createMnemonic,
  getHDWallets,
  createHDWallet,
} = require("../controllers/walletController.js");

router.get("/allWallet", getWallets);

router.get("/walletID/:walletID", getWallet);

router.get("/newWallet", createWallet);

router.get("/allMnemonic", getMnemonics);

router.get("/mnemonicID/:mnemonicID", getMnemonic);

router.get("/newMnemonic", createMnemonic);

router.get("/allHDWallet", getHDWallets);

router.post("/newHDWallet", createHDWallet);

module.exports = router;
