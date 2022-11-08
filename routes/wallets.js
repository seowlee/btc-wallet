var express = require("express");
var router = express.Router();

const {
  getWallets,
  createWallet,
} = require("../controllers/walletController.js");

const { createWalletFile } = require("../middleware/walletMiddleware.js");

// router.get("/:walletID", getWallet);
router.get("/allWallet", getWallets);

router.get("/createWallet", createWallet);
// router.get("/HDwallet", getHDWallet);

module.exports = router;
