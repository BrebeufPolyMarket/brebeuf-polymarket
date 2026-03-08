import type { ReactNode } from "react";

import { AppNavigation } from "@/components/app-navigation";
import type { ViewerProfile } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type AuthenticatedShellProps = {
  viewer: ViewerProfile | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AuthenticatedShell({ viewer, children, className, contentClassName }: AuthenticatedShellProps) {
  return (
    <main className={cn("app-shell px-4 py-4 md:px-6 lg:px-8", className)}>
      <div className="mx-auto flex max-w-[1500px] gap-4">
        <AppNavigation viewer={viewer} />
        <div className={cn("min-w-0 flex-1 pb-20 lg:pb-4", contentClassName)}>{children}</div>
      </div>
    </main>
  );
}
