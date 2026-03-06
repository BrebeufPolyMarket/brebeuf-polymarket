"use client";

import { type CSSProperties, type ElementType, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "spring" | "tween";
  once?: boolean;
};

export function Reveal({
  as,
  children,
  className,
  delay = 0,
  variant = "spring",
  once = true,
}: RevealProps) {
  const Component = as ?? "div";
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(node);
          return;
        }
        if (!once) setIsVisible(false);
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const style = {
    "--reveal-delay": `${delay}s`,
  } as CSSProperties;

  return (
    <Component
      ref={ref}
      className={cn("reveal", variant === "tween" ? "reveal-tween" : "reveal-spring", isVisible && "is-visible", className)}
      style={style}
    >
      {children}
    </Component>
  );
}
