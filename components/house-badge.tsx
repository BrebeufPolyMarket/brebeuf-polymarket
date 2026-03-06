import { HOUSE_CONFIG, type HouseId } from "@/lib/houses";
import { HouseLogo } from "@/components/branding/house-logo";
import { cn } from "@/lib/utils";

type HouseBadgeProps = {
  house: HouseId;
  rank?: number;
  totalPoints?: number;
  className?: string;
};

function textClassForHouse(house: HouseId) {
  return house === "jogues" || house === "garnier" ? "text-neutral-950" : "text-white";
}

export function HouseBadge({ house, rank, totalPoints, className }: HouseBadgeProps) {
  const details = HOUSE_CONFIG[house];
  const title =
    rank && typeof totalPoints === "number"
      ? `${details.displayName} - Rank ${rank} | Total: ${totalPoints.toLocaleString()} pts`
      : details.displayName;

  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide shadow-[0_8px_16px_-14px_rgba(26,22,21,0.75)]",
        textClassForHouse(house),
        className,
      )}
      style={{ backgroundColor: details.colourHex, borderColor: "rgba(0,0,0,0.08)" }}
    >
      <HouseLogo house={house} size={14} className="rounded-sm" />
      {details.displayName}
    </span>
  );
}
