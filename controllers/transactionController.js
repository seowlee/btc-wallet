const axios = require("axios");
const bitcore = require("bitcore-lib");
const e = require("express");
const fs = require("fs");
const {
  createTransactionFile,
  loadTransaction,
} = require("../middleware/transactionMiddleware.js");

createTransactionFile();

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

    const satoshiToSend = txData.amount * 100000000;
    let fee = 0;
    let inputCount = 0;
    let outputCount = 2;

    const response = await axios.get(
      `https://chain.so/api/v2/get_tx_unspent/${sochain_network}/${txData.in}`
    );

    const recommededFee = await axios.get(
      "https://bitcoinfees.earn.com/api/v1/fees/recommended"
    );

    const transaction = new bitcore.Transaction();
    let totalAmountAvailable = 0;

    let inputs = [];
    let utxos = response.data.data.txs;

    for (const element of utxos) {
      let utxo = {};
      const satoshis = Math.floor(Number(element.value) * 100000000);
      utxo.btc = Number(element.value);
      utxo.script = element.script_hex;
      utxo.address = response.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += satoshis;
      inputCount += 1;
      inputs.push(utxo);
    }

    const transactionSize =
      inputCount * 180 + outputCount * 34 + 10 - inputCount;

    fee = (transactionSize * recommededFee.data.hourFee) / 3;

    // Balance check
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
      throw new Error("Balance is too low for this transaction");
    }

    // Set transaction input
    transaction.from(inputs);

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
      value: satoshiToSend,
      fees: fee,
    };
    const input = {
      inputCnt: inputCount,
      address: txData.in,
    };
    const output = {
      outputCnt: outputCount,
      address: txData.out,
    };
    newTx.in = inputs;
    newTx.out = [output];
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

module.exports = {
  sendBitcoin: sendBitcoin,
};