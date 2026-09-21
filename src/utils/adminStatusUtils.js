const transactionStatusKeys = Object.freeze({
  unpaid: "admin.complaints.transactionStatus.unpaid",
  partially_paid: "admin.complaints.transactionStatus.partially_paid",
  paid: "admin.complaints.transactionStatus.paid",
});

export const localizeTransactionStatus = (status, t) => {
  const key = transactionStatusKeys[status];
  return key ? t(key) : status;
};
