import Image from "next/image";

import schoolLogo from "@/public/logos/brebeuf-school-logo.png";
import { cn } from "@/lib/utils";

type SchoolLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function SchoolLogo({ size = 28, className, priority = false }: SchoolLogoProps) {
  return (
    <Image
      src={schoolLogo}
      alt="Brebeuf College School logo"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority={priority}
    />
  );
}
