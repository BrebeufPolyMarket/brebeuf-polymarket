"use client";

import { useMemo, useState } from "react";

import type { HouseId } from "@/lib/houses";
import { HOUSE_CONFIG } from "@/lib/houses";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  username: string;
  house: HouseId;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

function getInitials(username: string) {
  const cleaned = username.trim();
  if (!cleaned) return "?";
  if (cleaned.includes("_")) {
    return cleaned
      .split("_")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || cleaned.slice(0, 2).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function UserAvatar({ username, house, avatarUrl, size = 32, className }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const initials = useMemo(() => getInitials(username), [username]);
  const bg = HOUSE_CONFIG[house].colourHex;

  if (!avatarUrl || hasError) {
    return (
      <span
        className={cn("inline-flex items-center justify-center rounded-full font-semibold text-white", className)}
        style={{ width: size, height: size, backgroundColor: bg, fontSize: Math.max(10, Math.floor(size * 0.36)) }}
        aria-label={`${username} avatar`}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={`${username} avatar`}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
