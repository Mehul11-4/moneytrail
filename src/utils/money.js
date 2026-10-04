// Rounds a money amount to 2 decimals so tiny leftovers like 0.000000000000004
// are treated as exactly 0.
export function roundMoney(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
