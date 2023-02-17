const axios = require("axios");
const bitcore = require("bitcore-lib");
const { mainnet, testnet } = require("bitcore-lib/lib/networks");
const Mnemonic = require("bitcore-mnemonic");
const { response } = require("express");
const {
  BalanceError,
  ValidAddressError,
  ValidAmountError,
  PassphraseError,
  BTCNetworkError,
  RBFError,
} = require("../exceptions/sendTransactionError");

const network = testnet;
var Address = bitcore.Address;
var Networks = bitcore.Networks;
const sochain_network = "BTCTEST";

/**
 * @method POST
 * @URL http://localhost:3000/btc/getBalance
 * @param {JSON} req
 * { "address": String }
 * @param {JSON} res
 * {
 * "balance": number,
 * "inputCount": number,(count of utxo)}
 */
const btcGetBalance = async (req, res, next) => {
  try {
    var balanceData = {
      address: req.body.address,
    };
    console.log(balanceData.address);
    const response = await axios.get(
      `https://chain.so/api/v2/get_tx_unspent/${sochain_network}/${balanceData.address}`
    );
    // Bitcoin api network check
    if (response.status === 200) {
      console.log("tx success");
    } else {
      throw new BTCNetworkError("error");
    }

    let totalAmountAvailable = 0;

    let inputs = [];
    let utxos = response.data.data.txs;
    let inputCnt = 0;
    // console.log(utxos);

    for (const element of utxos) {
      let utxo = {};

      utxo.satoshis = Math.round(Number(element.value) * 100000000);
      utxo.script = element.script_hex;
      utxo.address = response.data.data.address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.output_no;
      totalAmountAvailable += utxo.satoshis;
      inputCnt += 1;
      inputs.push(utxo);
    }

    const Utxo = {
      balance: totalAmountAvailable,
      inputCnt: inputCnt,
      inputs: inputs,
    };
    res.json(Utxo);
  } catch (error) {
    if (error instanceof BTCNetworkError) {
      const errData = {
        error_name: error.name,
        error_code: 5,
      };
      res.json(errData);
      console.error(error.name);
    }
  }
};

/**
 * @method POST
 * @URL http://localhost:3000/tx/btc/sendTransaction
 * @param {JSON} req
 * {
 * "wallet_mnemonic": String,
 * "passphrase": String,
 * "address_index": number,
 * "address" : String,
 * "to_address" : String,
 * "amount": number,
 * "fee_price_strategy": number,
 * "tx_id": String,
 * }
 * @param {JSON} res
 * {
 * "transaction_hash": String,
 * "value": number,
 * "fee_price": number,
 * "actual_fee": number,
 * "status": number,
 * "error_code": number}
 */
const sendBitcoin = async (req, res, next) => {
  try {
    // const allTx = loadTransaction();

    var txData = {
      wallet_mnemonic: req.body.wallet_mnemonic,
      passphrase: req.body.passphrase,
      address_index: req.body.address_index,
      address: req.body.address,
      to_address: req.body.to_address,
      amount: req.body.amount,
      fee_price_strategy: req.body.fee_price_strategy,
      tx_id: req.body.tx_id,
    };
    if (txData.tx_id !== null) {
      console.log("********isRBF************************");
      const rbfInData = await rbfBtcGetBalance(txData.tx_id);
      console.log(rbfInData);
      if (rbfInData === 6) {
        console.log("********rbferror");
        throw new RBFError("error");
      }
      if (rbfInData === 5) {
        throw new BTCNetworkError("error");
      }
      addrIn = {
        balance: rbfInData.balance,
        inputCnt: rbfInData.utxoCnt,
        inputs: rbfInData.inputs,
      };
      console.log(addrIn);
    } else {
      inData = await axios({
        method: "POST",
        url: `http://localhost:3000/tx/btc/getBalance`,
        data: {
          address: txData.address,
        },
      });
      addrIn = {
        balance: inData.data.balance,
        inputCnt: inData.data.inputCnt,
        inputs: inData.data.inputs,
      };
    }

    const satoshiToSend = txData.amount * 100000000;
    const totalBalancetSatoshi = addrIn.balance;

    let fee = 0;
    let fee_price = 0;
    // let status = 2;
    let error_code = null;
    let inputCount = addrIn.inputCnt;
    console.log(inputCount);
    let outputCount = 2;

    const recommededFee = await axios.get(
      "https://bitcoinfees.earn.com/api/v1/fees/recommended"
    );
    const transaction = new bitcore.Transaction();
    const transactionSize =
      inputCount * 180 + outputCount * 34 + 10 - inputCount;

    if (txData.fee_price_strategy === 1) {
      fee_price = recommededFee.data.fastestFee;
    } else if (txData.fee_price_strategy === 2) {
      fee_price = recommededFee.data.halfHourFee;
    } else {
      fee_price = recommededFee.data.hourFee / 10;
    }

    fee = (transactionSize * fee_price) / 3;
    // fee = 50;

    let btcFee = fee / 100000000;

    // Balance check
    if (totalBalancetSatoshi - satoshiToSend - fee < 0) {
      throw new BalanceError("Balance is too low for this transaction");
    }

    // Valid Address check
    if (!Address.isValid(txData.to_address, Networks.testnet)) {
      throw new ValidAddressError("error");
    }

    // Valid Amount check
    if (typeof txData.amount !== "number") {
      throw new ValidAmountError("error");
    }

    // Passphrase check
    let mnemonicCode = Mnemonic(txData.wallet_mnemonic);
    let xprv = mnemonicCode.toHDPrivateKey(txData.passphrase, network);
    let child = xprv.deriveChild("m/44'/0'/0'/0/" + txData.address_index);
    let address = child.publicKey.toAddress().toString();
    if (address !== txData.address) {
      throw new PassphraseError("error");
    }

    // Set transaction input
    transaction.from(addrIn.inputs);

    // Set recieverAddress and amountToSend
    transaction.to(txData.to_address, satoshiToSend);

    // Update sender Address (receive the left over funds after transfer)
    transaction.change(txData.address);
    console.log(satoshiToSend, fee);

    // manually set transaction fees - 20 satoshis per byte
    transaction.fee(Math.round(fee));

    transaction.enableRBF();
    console.log("=========RBF========");
    console.log(transaction.isRBF());
    // Sign transaction with sender privateKey
    transaction.sign(child.privateKey.toString());
    // transaction.sign(txData.privateKey);

    /**
     * rbfTx
     */
    // const rbfTx = new bitcore.Transaction();
    // rbfTx.from(addrIn.data.inputs);

    // // Set recieverAddress and amountToSend
    // rbfTx.to(txData.to_address, satoshiToSend);

    // // Update sender Address (receive the left over funds after transfer)
    // rbfTx.change(txData.address);
    // fee = transactionSize * fee_price;

    // btcFee = fee / 100000000;
    // console.log(satoshiToSend, fee);

    // // manually set transaction fees - 20 satoshis per byte
    // rbfTx.fee(Math.round(fee));

    // rbfTx.enableRBF();
    // console.log("=========RBF========");
    // console.log(rbfTx.isRBF());
    // // Sign transaction with sender privateKey
    // rbfTx.sign(child.privateKey.toString());

    console.log("serialize transactions===============================");
    console.log(transaction.serialize());
    // console.log("serialize rbfTx===============================");
    // console.log(rbfTx.serialize());

    // serialize transactions
    const serializedTransaction = transaction.serialize();
    // const serializedrbfTx = rbfTx.serialize();
    const result = await axios({
      method: "POST",
      url: `https://chain.so/api/v2/send_tx/${sochain_network}`,
      data: {
        tx_hex: serializedTransaction,
      },
    });

    // // Send transaction
    // const result = await axios({
    //   method: "POST",
    //   url: `https://chain.so/api/v2/send_tx/${sochain_network}`,
    //   data: {
    //     tx_hex: serializedrbfTx,
    //   },
    // });

    // Bitcoin api network check
    if (result.status === 200) {
      console.log("tx success");
    } else {
      console.log("tx error");
      throw new BTCNetworkError("error");
    }

    // is Confirmed transaction
    const status = await isConfirmed(result.data.data.txid);

    // axios({
    //   method: "POST",
    //   url: `https://chain.so/api/v2/send_tx/${sochain_network}`,
    //   data: {
    //     tx_hex: serializedTransaction,
    //   },
    // }).then((response) => {
    //   if (response.status === 200) {
    //     console.log("tx success");
    //   } else {
    //     throw new BTCNetworkError("error");
    //   }
    // });

    const newTx = {
      transaction_hash: result.data.data.txid,
      value: txData.amount,
      fee_price: fee_price,
      actual_fee: btcFee,
      status: status,
      error_code: error_code,
    };
    console.log("new tx ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    console.log(newTx);

    // const output = {
    //   outId: 0,
    //   value: txData.amount,
    //   address: txData.to_address,
    // };
    // const totalOutput =
    //   Math.floor((addrIn.data.totalBalance - btcFee) * 100000000) / 100000000;
    // const output1Value =
    //   Math.floor(
    //     (addrIn.data.totalBalance - txData.amount - btcFee) * 100000000
    //   ) / 100000000;
    // const output1 = {
    //   outId: 1,
    //   value: output1Value,
    //   address: txData.address,
    // };

    res.json(newTx);
  } catch (error) {
    if (error instanceof BalanceError) {
      const errData = {
        error_name: error.name,
        error_code: 1,
      };
      res.json(errData);
      console.error(error.name);
    } else if (error instanceof ValidAddressError) {
      const errData = {
        error_name: error.name,
        error_code: 2,
      };
      res.json(errData);
      console.error(error.name);
    } else if (error instanceof ValidAmountError) {
      const errData = {
        error_name: error.name,
        error_code: 3,
      };
      res.json(errData);
      console.error(error.name);
    } else if (error instanceof PassphraseError) {
      const errData = {
        error_name: error.name,
        error_code: 4,
      };
      res.json(errData);
      console.error(error.name);
    } else if (error instanceof BTCNetworkError) {
      const errData = {
        error_name: error.name,
        error_code: 5,
      };
      res.json(errData);
      console.error(error.name);
    } else if (error instanceof RBFError) {
      const errData = {
        error_name: error.name,
        error_code: 6,
      };
      res.json(errData);
      console.error(error.name);
    } else {
      console.log(error);
    }
  }
};

const rbfBtcGetBalance = async (txId) => {
  try {
    const status = await isConfirmed(txId);
    if (status === 1) {
      console.log("rbferror");
      return 6;
    }
    const response = await axios({
      method: "GET",
      url: `https://blockstream.info/testnet/api/tx/${txId}`,
    });
    // Bitcoin api network check
    if (response.status === 200) {
      console.log("tx success");
    } else {
      return 5;
    }

    let totalAmountAvailable = 0;

    let inputs = [];
    let utxos = response.data.vin;
    let inputCnt = 0;
    // console.log(utxos);

    for (const element of utxos) {
      let utxo = {};

      utxo.satoshis = Number(element.prevout.value);
      utxo.script = element.prevout.scriptpubkey;
      utxo.address = element.prevout.scriptpubkey_address;
      utxo.txId = element.txid;
      utxo.outputIndex = element.vout;
      totalAmountAvailable += utxo.satoshis;
      inputCnt += 1;
      inputs.push(utxo);
    }

    const Utxo = {
      balance: totalAmountAvailable,
      utxoCnt: inputCnt,
      inputs: inputs,
    };
    console.log(Utxo);
    return Utxo;
  } catch (error) {
    console.log(error);
  }
};

const isConfirmed = async (txId) => {
  const result = await axios({
    method: "GET",
    url: `https://chain.so/api/v2/is_tx_confirmed/${sochain_network}/${txId}`,
  });

  if (result.data.data.is_confirmed === true) {
    return 1;
  } else {
    console.log("Unconfirmed~~~~~~~~~~");
    return 0;
  }
};

module.exports = {
  btcGetBalance: btcGetBalance,
  sendBitcoin: sendBitcoin,
  isConfirmed: isConfirmed,
};
