import Image, { type StaticImageData } from "next/image";

import chabanelLogo from "@/public/logos/houses/chabanel.png";
import danielLogo from "@/public/logos/houses/daniel.png";
import garnierLogo from "@/public/logos/houses/garnier.png";
import joguesLogo from "@/public/logos/houses/jogues.png";
import lalandeLogo from "@/public/logos/houses/lalande.png";
import lalemantLogo from "@/public/logos/houses/lalemant.png";
import { HOUSE_CONFIG, type HouseId } from "@/lib/houses";
import { cn } from "@/lib/utils";

const HOUSE_LOGOS: Record<HouseId, StaticImageData> = {
  lalemant: lalemantLogo,
  jogues: joguesLogo,
  lalande: lalandeLogo,
  garnier: garnierLogo,
  chabanel: chabanelLogo,
  daniel: danielLogo,
};

type HouseLogoProps = {
  house: HouseId;
  size?: number;
  className?: string;
};

export function HouseLogo({ house, size = 18, className }: HouseLogoProps) {
  const details = HOUSE_CONFIG[house];

  return (
    <Image
      src={HOUSE_LOGOS[house]}
      alt={`${details.displayName} logo`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
