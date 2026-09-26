export interface StockSplit {
  exhibition: number;
  warehouse: number;
  blocked: number;
}

const R = (n: number) => Math.round(n * 1000) / 1000;

export function splitLocations(stock: number, decimals = 0): StockSplit {
  const exhibition = R(stock * 0.6);
  const warehouse = R(stock * 0.25);
  const blocked = R(Math.max(0, stock - exhibition - warehouse));
  const d = Math.pow(10, decimals);
  return {
    exhibition: Math.round(exhibition * d) / d,
    warehouse: Math.round(warehouse * d) / d,
    blocked: Math.round(blocked * d) / d,
  };
}