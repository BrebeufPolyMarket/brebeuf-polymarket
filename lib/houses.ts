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
  shortCode: string;
  logoPath: string;
};

export const HOUSE_CONFIG: Record<HouseId, HouseConfig> = {
  lalemant: {
    id: "lalemant",
    displayName: "Lalemant",
    colourHex: "#111111",
    founder: "Gabriel Lalemant",
    shortCode: "LA",
    logoPath: "/logos/houses/lalemant.png",
  },
  jogues: {
    id: "jogues",
    displayName: "Jogues",
    colourHex: "#F1C40F",
    founder: "Isaac Jogues",
    shortCode: "JO",
    logoPath: "/logos/houses/jogues.png",
  },
  lalande: {
    id: "lalande",
    displayName: "Lalande",
    colourHex: "#2471A3",
    founder: "Jean de Lalande",
    shortCode: "LL",
    logoPath: "/logos/houses/lalande.png",
  },
  garnier: {
    id: "garnier",
    displayName: "Garnier",
    colourHex: "#7F8C8D",
    founder: "Charles Garnier",
    shortCode: "GA",
    logoPath: "/logos/houses/garnier.png",
  },
  chabanel: {
    id: "chabanel",
    displayName: "Chabanel",
    colourHex: "#C0392B",
    founder: "Noel Chabanel",
    shortCode: "CH",
    logoPath: "/logos/houses/chabanel.png",
  },
  daniel: {
    id: "daniel",
    displayName: "Daniel",
    colourHex: "#1E8449",
    founder: "Antoine Daniel",
    shortCode: "DA",
    logoPath: "/logos/houses/daniel.png",
  },
};

export const SCHOOL_LOGO_PATH = "/logos/brebeuf-school-logo.png";

export function isHouseId(value: string): value is HouseId {
  return HOUSE_IDS.includes(value as HouseId);
}

export function getHouse(house: HouseId): HouseConfig {
  return HOUSE_CONFIG[house];
}
