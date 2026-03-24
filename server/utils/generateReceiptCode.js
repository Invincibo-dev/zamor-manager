const { UniqueConstraintError, fn, col, where } = require("sequelize");

const { ReceiptSequence, SaleReceipt } = require("../models");

const formatReceiptCode = (year, sequence) =>
  `ZMR-${year}-${String(sequence).padStart(5, "0")}`;

const getLastSequenceForYear = async (transaction, year) => {
  const lastReceipt = await SaleReceipt.findOne({
    where: where(fn("YEAR", col("date")), year),
    order: [["id", "DESC"]],
    attributes: ["code_recu"],
    transaction,
  });

  return lastReceipt?.code_recu
    ? Number(lastReceipt.code_recu.split("-")[2])
    : 0;
};

const generateLegacyReceiptCode = async (transaction, year) => {
  const lastSequence = await getLastSequenceForYear(transaction, year);

  return formatReceiptCode(year, lastSequence + 1);
};

const generateReceiptCode = async (transaction, receiptDate = new Date()) => {
  const year = new Date(receiptDate).getFullYear();

  try {
    while (true) {
      const sequence = await ReceiptSequence.findOne({
        where: { year },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (sequence) {
        sequence.current_value += 1;
        await sequence.save({ transaction });

        return formatReceiptCode(year, sequence.current_value);
      }

      try {
        const lastSequence = await getLastSequenceForYear(transaction, year);
        const nextSequence = lastSequence + 1;

        await ReceiptSequence.create(
          {
            year,
            current_value: nextSequence,
          },
          { transaction }
        );

        return formatReceiptCode(year, nextSequence);
      } catch (error) {
        if (error instanceof UniqueConstraintError) {
          continue;
        }

        throw error;
      }
    }
  } catch (error) {
    if (error.original?.code === "ER_NO_SUCH_TABLE") {
      return generateLegacyReceiptCode(transaction, year);
    }

    throw error;
  }
};

module.exports = generateReceiptCode;
