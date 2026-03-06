export const HOUSE_IDS = [
  "lalemant",
  "jogues",
  "lalande",
  "garnier",
  "chabanel",
  "daniel",
] as const;

export type HouseId = (typeof HOUSE_IDS)[number];

export type HouseConfig = {
  id: HouseId;
  displayName: string;
  colourHex: string;
  founder: string;
};

export const HOUSE_CONFIG: Record<HouseId, HouseConfig> = {
  lalemant: {
    id: "lalemant",
    displayName: "Lalemant",
    colourHex: "#111111",
    founder: "Gabriel Lalemant",
  },
  jogues: {
    id: "jogues",
    displayName: "Jogues",
    colourHex: "#F1C40F",
    founder: "Isaac Jogues",
  },
  lalande: {
    id: "lalande",
    displayName: "Lalande",
    colourHex: "#2471A3",
    founder: "Jean de Lalande",
  },
  garnier: {
    id: "garnier",
    displayName: "Garnier",
    colourHex: "#7F8C8D",
    founder: "Charles Garnier",
  },
  chabanel: {
    id: "chabanel",
    displayName: "Chabanel",
    colourHex: "#C0392B",
    founder: "Noel Chabanel",
  },
  daniel: {
    id: "daniel",
    displayName: "Daniel",
    colourHex: "#1E8449",
    founder: "Antoine Daniel",
  },
};

export function isHouseId(value: string): value is HouseId {
  return HOUSE_IDS.includes(value as HouseId);
}

export function getHouse(house: HouseId): HouseConfig {
  return HOUSE_CONFIG[house];
}
