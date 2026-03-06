"use client";

import { usePathname } from "next/navigation";

type TemplateProps = {
  children: React.ReactNode;
};

export default function Template({ children }: TemplateProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="route-enter">
      <div className="route-enter-content">{children}</div>
    </div>
  );
}
