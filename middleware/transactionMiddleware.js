const fs = require("fs");

const createTransactionFile = (req, res, next) => {
  if (!fs.existsSync(__dirname + "/../data/transaction.json")) {
    fs.closeSync(
      fs.openSync(__dirname + "/../data/transaction.json", "w"),
      fs.writeFileSync(
        __dirname + "/../data/transaction.json",
        JSON.stringify({ transactions: [] })
      )
    );
  }
};

const loadTransaction = (req, res, next) => {
  try {
    const dataBuffer = fs.readFileSync(__dirname + "/../data/transaction.json");
    const dataJSON = dataBuffer.toString();
    return JSON.parse(dataJSON);
  } catch (error) {
    return [];
  }
};

module.exports = {
  createTransactionFile: createTransactionFile,
  loadTransaction: loadTransaction,
};
