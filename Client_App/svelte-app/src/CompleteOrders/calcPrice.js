export function calcPrice(heigh, widht, depth, count) {
  const pricePerCubic = 0.00068;
  return Number((heigh * widht * depth * count * pricePerCubic).toFixed(2));
}
