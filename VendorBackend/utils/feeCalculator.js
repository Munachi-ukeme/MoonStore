const calculateCommissionBps = (totalAmount) => {
  const RATE = 0.04;
  const MIN_FEE = 250;
  const MAX_FEE = 4000;

  let commission = totalAmount * RATE;

  if (commission < MIN_FEE) commission = MIN_FEE;
  if (commission > MAX_FEE) commission = MAX_FEE;

  const bps = Math.round((commission / totalAmount) * 10000);

  return bps;
};

module.exports = { calculateCommissionBps };