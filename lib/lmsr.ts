const BINARY_SEARCH_STEPS = 64;

function assertFinite(name: string, value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number`);
  }
}

function assertPositive(name: string, value: number) {
  assertFinite(name, value);
  if (value <= 0) {
    throw new Error(`${name} must be greater than 0`);
  }
}

function assertNonNegative(name: string, value: number) {
  assertFinite(name, value);
  if (value < 0) {
    throw new Error(`${name} must be greater than or equal to 0`);
  }
}

export function lmsrCost(qYes: number, qNo: number, b: number): number {
  assertFinite("qYes", qYes);
  assertFinite("qNo", qNo);
  assertPositive("b", b);

  const maxQ = Math.max(qYes, qNo);
  return (
    b *
    (maxQ / b +
      Math.log(Math.exp((qYes - maxQ) / b) + Math.exp((qNo - maxQ) / b)))
  );
}

export function costToBuy(
  qYes: number,
  qNo: number,
  shares: number,
  b: number,
  isYes: boolean,
): number {
  assertNonNegative("shares", shares);
  if (isYes) return lmsrCost(qYes + shares, qNo, b) - lmsrCost(qYes, qNo, b);
  return lmsrCost(qYes, qNo + shares, b) - lmsrCost(qYes, qNo, b);
}

export function yesProb(qYes: number, qNo: number, b: number): number {
  assertFinite("qYes", qYes);
  assertFinite("qNo", qNo);
  assertPositive("b", b);

  const x = (qNo - qYes) / b;

  if (x >= 0) {
    const expNeg = Math.exp(-x);
    return expNeg / (1 + expNeg);
  }

  const expPos = Math.exp(x);
  return 1 / (1 + expPos);
}

export function sharesToReceive(
  qYes: number,
  qNo: number,
  points: number,
  b: number,
  isYes: boolean,
): number {
  assertNonNegative("points", points);
  if (points === 0) return 0;

  let lo = 0;
  let hi = Math.max(points * 10, 1);

  // Expand search bounds if large liquidity makes point->share mapping flatter than expected.
  while (costToBuy(qYes, qNo, hi, b, isYes) < points) {
    hi *= 2;
    if (hi > 1_000_000_000) {
      break;
    }
  }

  for (let i = 0; i < BINARY_SEARCH_STEPS; i++) {
    const mid = (lo + hi) / 2;
    if (costToBuy(qYes, qNo, mid, b, isYes) < points) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return lo;
}

export function sellValue(
  qYes: number,
  qNo: number,
  shares: number,
  b: number,
  isYes: boolean,
): number {
  assertNonNegative("shares", shares);

  if (isYes) {
    if (shares > qYes) {
      throw new Error("Cannot sell more YES shares than outstanding position in pool state");
    }

    return lmsrCost(qYes, qNo, b) - lmsrCost(qYes - shares, qNo, b);
  }

  if (shares > qNo) {
    throw new Error("Cannot sell more NO shares than outstanding position in pool state");
  }

  return lmsrCost(qYes, qNo, b) - lmsrCost(qYes, qNo - shares, b);
}

export function confidenceLabel(prob: number): string {
  assertFinite("prob", prob);

  if (prob >= 0.85) return "Very Likely";
  if (prob >= 0.65) return "Likely";
  if (prob >= 0.45) return "Toss-up";
  if (prob >= 0.25) return "Unlikely";
  return "Very Unlikely";
}
