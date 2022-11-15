const axios = require("axios");
const bitcore = require("bitcore-lib");
const e = require("express");
const fs = require("fs");
const {
  createTransactionFile,
  loadTransaction,
} = require("../middleware/transactionMiddleware.js");

createTransactionFile();

/**
 * http://localhost:3000/tx/sendBitcoin
 * {
    "privateKey": "772fd7d28bb1723a9a0f1c45fbe86d40b9887364cc1d594e0693437d0ec918ec",
    "sourceAddress": "mgYvLgCTbqWbUzdFfjPb4ftVub2DQaevuQ",
    "recieverAddress":"mySmA9jxHR7AnVvVudcTPcpfYTJxCaSLFT",
    "amountToSend": 0.0005
}
 */
const sendBitcoin = async (req, res, next) => {
  try {
    const allTx = loadTransaction();
    const sochain_network = "BTCTEST";
    const privateKey =
      "34d2afcab5bfd6c52e864e6993bd9690c442cce2c54720929bc226d4195235c3";
    const sourceAddress = "mpSfrG3CDkTTVPbVXFPnpgPfUd51XjPQZG";

    var txData = {
      pk: req.body.privateKey,
      in: req.body.sourceAddress,
      out: req.body.recieverAddress,
      amount: req.body.amountToSend,
    };

    const addrIn = await axios({
      method: "GET",
      url: `http://localhost:3000/tx/getUtxo?address=${txData.in}`,
    });

    const satoshiToSend = txData.amount * 100000000;
    const totalBalancetSatoshi = addrIn.data.totalBalance * 100000000;
    let fee = 0;
    let inputCount = addrIn.data.utxos.length;
    console.log(inputCount);
    let outputCount = 2;

    const recommededFee = await axios.get(
      "https://bitcoinfees.earn.com/api/v1/fees/recommended"
    );

    const transaction = new bitcore.Transaction();

    const transactionSize =
      inputCount * 180 + outputCount * 34 + 10 - inputCount;

    fee = (transactionSize * recommededFee.data.hourFee) / 3;
    let btcFee = fee / 100000000;

    // Balance check
    if (totalBalancetSatoshi - satoshiToSend - fee < 0) {
      throw new Error("Balance is too low for this transaction");
    }

    // Set transaction input
    transaction.from(addrIn.data.utxos);

    // Set recieverAddress and amountToSend
    transaction.to(txData.out, satoshiToSend);

    // Update sender Address (receive the left over funds after transfer)
    transaction.change(txData.in);
    console.log(satoshiToSend, fee);

    // manually set transaction fees - 20 satoshis per byte
    transaction.fee(Math.round(fee));

    // Sign transaction with sender privateKey
    transaction.sign(txData.pk);

    // serialize transactions
    // console.log(transaction.serialize());
    const serializedTransaction = transaction.serialize();

    // Send transaction
    const result = await axios({
      method: "POST",
      url: `https://chain.so/api/v2/send_tx/${sochain_network}`,
      data: {
        tx_hex: serializedTransaction,
      },
    });

    const newTx = {
      txid: result.data.data.txid,
      value: txData.amount,
      fees: Math.floor(btcFee * 100000000) / 100000000,
      time: new Date(),
    };

    const output = {
      outId: 0,
      value: txData.amount,
      address: txData.out,
    };
    const totalOutput =
      Math.floor((addrIn.data.totalBalance - btcFee) * 100000000) / 100000000;
    const output1Value =
      Math.floor(
        (addrIn.data.totalBalance - txData.amount - btcFee) * 100000000
      ) / 100000000;
    const output1 = {
      outId: 1,
      value: output1Value,
      address: txData.in,
    };

    newTx.vin = addrIn.data;
    newTx.vout = { totalOutput: totalOutput, output, output1 };
    allTx.transactions.push(newTx);
    fs.writeFileSync(
      __dirname + "/../data/transaction.json",
      JSON.stringify(allTx)
    );
    res.json(allTx);
  } catch (error) {
    return error;
  }
};

/**
 * url: http://localhost:3000/tx/getUtxo?address=mgYvLgCTbqWbUzdFfjPb4ftVub2DQaevuQ
 */
const getUtxo = async (req, res, next) => {
  const sochain_network = "BTCTEST";
  const response = await axios.get(
    `https://chain.so/api/v2/get_tx_unspent/${sochain_network}/${req.query.address}`
  );

  let totalAmountAvailable = 0;

  let inputs = [];
  let utxos = response.data.data.txs;
  let addr = response.data.data.address;
  let inputCount = 0;
  // console.log(utxos);

  for (const element of utxos) {
    let utxo = {};

    utxo.btc = Number(element.value);
    utxo.satoshis = Math.floor(Number(element.value) * 100000000);
    utxo.script = element.script_hex;
    utxo.txId = element.txid;
    utxo.outputIndex = element.output_no;
    totalAmountAvailable += utxo.btc;
    inputCount += 1;
    inputs.push(utxo);
  }

  const Utxo = {
    address: addr,
    totalBalance: totalAmountAvailable,
    utxoCnt: inputCount,
  };
  Utxo.utxos = inputs;
  res.json(Utxo);
};
module.exports = {
  sendBitcoin: sendBitcoin,
  getUtxo: getUtxo,
};
