var express = require("express");
var router = express.Router();

const { sendBitcoin } = require("../controllers/sendTransaction.js");

router.post("/sendBitcoin", sendBitcoin);

module.exports = router;

// sendBitcoin("mhe5hkmx26CZkbMPprQQifLLwqfb5pZUKZ", 0.0001)
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((error) => {
//     console.log(error);
//   });
