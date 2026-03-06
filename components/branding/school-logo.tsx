import Image from "next/image";

import { SCHOOL_LOGO_PATH } from "@/lib/houses";
import { cn } from "@/lib/utils";

type SchoolLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function SchoolLogo({ size = 28, className, priority = false }: SchoolLogoProps) {
  return (
    <Image
      src={SCHOOL_LOGO_PATH}
      alt="Brebeuf College School logo"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority={priority}
    />
  );
}
