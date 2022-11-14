var express = require("express");
var router = express.Router();

const {
  sendBitcoin,
  getBalance,
} = require("../controllers/transactionController.js");

router.post("/sendBitcoin", sendBitcoin);

router.get("/getUtxo", getBalance);

module.exports = router;

// sendBitcoin("mhe5hkmx26CZkbMPprQQifLLwqfb5pZUKZ", 0.0001)
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
