export const CATEGORY_EMOJI: Record<string, string> = {
  bebidas: "🥤",
  cervezas: "🍺",
  galletas: "🍪",
  panetones: "🎄",
  lacteos: "🥛",
  enlatados: "🥫",
  aceites: "🫒",
  granos: "🌾",
  pastas: "🍝",
  azucar: "🍬",
  condimentos: "🧂",
  higiene: "🧼",
  frutas: "🍎",
};

export const CATEGORY_COLOR: Record<string, string> = {
  bebidas: "#1F6F8B",
  cervezas: "#6B4F3A",
  galletas: "#B76E1F",
  panetones: "#7A4A2A",
  lacteos: "#7FB2C7",
  enlatados: "#8F9AA3",
  aceites: "#8A5A1B",
  granos: "#8A6D3B",
  pastas: "#A3804F",
  azucar: "#9A8A5A",
  condimentos: "#A8472B",
  higiene: "#A8325A",
  frutas: "#3F8F5B",
};

export const DEFAULT_EMOJI = "📦";
export const DEFAULT_COLOR = "#3A86FF";

export function categoryEmoji(category: string | null): string {
  return (category && CATEGORY_EMOJI[category.toLowerCase()]) || DEFAULT_EMOJI;
}

export function categoryColor(category: string | null): string {
  return (category && CATEGORY_COLOR[category.toLowerCase()]) || DEFAULT_COLOR;
}