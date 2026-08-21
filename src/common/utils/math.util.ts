export const roundToTwoDecimals = (value: unknown): number => {
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};
