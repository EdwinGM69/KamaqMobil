export const ROUTES = {
  login: "/(auth)/login",
  dashboard: "/(tabs)",
  sales: "/(tabs)/sales",
  inventory: "/(tabs)/inventory",
  customers: "/(tabs)/customers",
  cash: "/(tabs)/cash",
  cart: "/sales/cart",
  payment: "/sales/payment",
  receipt: "/sales/receipt",
  scan: "/scanner",
  cashOpen: "/cash/open",
  cashClose: "/cash/close",
  settings: "/settings",
} as const;

export const STORAGE_KEYS = {
  auth: "kamaq-auth",
  cart: "kamaq-cart",
  cash: "kamaq-cash",
  app: "kamaq-app",
  sync: "kamaq-sync",
} as const;
