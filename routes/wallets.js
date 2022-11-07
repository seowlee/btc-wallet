var express = require("express");
var router = express.Router();

const {
  getWallets,
  createWallet,
} = require("../controllers/walletController.js");

// router.get("/:walletID", getWallet);
router.get("/wallets", getWallets);

router.get("/createWallet", createWallet);
// router.get("/HDwallet", getHDWallet);

module.exports = router;
