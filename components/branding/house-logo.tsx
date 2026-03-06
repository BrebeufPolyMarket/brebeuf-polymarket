import Image from "next/image";

import { HOUSE_CONFIG, type HouseId } from "@/lib/houses";
import { cn } from "@/lib/utils";

type HouseLogoProps = {
  house: HouseId;
  size?: number;
  className?: string;
};

export function HouseLogo({ house, size = 18, className }: HouseLogoProps) {
  const details = HOUSE_CONFIG[house];

  return (
    <Image
      src={details.logoPath}
      alt={`${details.displayName} logo`}
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
