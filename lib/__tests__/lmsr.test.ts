import { describe, expect, it } from "vitest";

import {
  confidenceLabel,
  costToBuy,
  lmsrCost,
  sellValue,
  sharesToReceive,
  yesProb,
} from "../lmsr";

describe("LMSR core math", () => {
  it("computes baseline symmetric cost", () => {
    expect(lmsrCost(0, 0, 100)).toBeCloseTo(69.3147180559, 8);
  });

  it("computes yes probability from outstanding shares", () => {
    expect(yesProb(0, 0, 100)).toBeCloseTo(0.5, 12);
    expect(yesProb(50, 0, 100)).toBeCloseTo(0.6224593312, 8);
    expect(yesProb(0, 50, 100)).toBeCloseTo(0.3775406688, 8);
  });

  it("inverts cost with sharesToReceive", () => {
    const points = 100;
    const shares = sharesToReceive(0, 0, points, 100, true);
    const paid = costToBuy(0, 0, shares, 100, true);

    expect(shares).toBeGreaterThan(0);
    expect(paid).toBeLessThanOrEqual(points);
    expect(points - paid).toBeLessThan(1e-6);
  });

  it("returns the same value when selling the exact shares just bought", () => {
    const boughtShares = 37.5;
    const paid = costToBuy(0, 0, boughtShares, 100, true);
    const received = sellValue(boughtShares, 0, boughtShares, 100, true);

    expect(received).toBeCloseTo(paid, 10);
  });

  it("returns the same value for NO round trip", () => {
    const boughtShares = 22.25;
    const paid = costToBuy(0, 0, boughtShares, 100, false);
    const received = sellValue(0, boughtShares, boughtShares, 100, false);

    expect(received).toBeCloseTo(paid, 10);
  });

  it("returns zero shares for zero points input", () => {
    expect(sharesToReceive(0, 0, 0, 100, true)).toBe(0);
  });
});

describe("confidence labels", () => {
  it("uses expected labels at threshold boundaries", () => {
    expect(confidenceLabel(0.9)).toBe("Very Likely");
    expect(confidenceLabel(0.65)).toBe("Likely");
    expect(confidenceLabel(0.45)).toBe("Toss-up");
    expect(confidenceLabel(0.25)).toBe("Unlikely");
    expect(confidenceLabel(0.1)).toBe("Very Unlikely");
  });
});
