import { cn } from "@/lib/utils";

type LoadingStateProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

export function LoadingState({
  title = "Loading...",
  subtitle = "Please wait a moment.",
  className,
}: LoadingStateProps) {
  return (
    <section className={cn("grid min-h-[60vh] place-items-center", className)}>
      <article className="surface loading-fade w-full max-w-lg p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">{title}</h1>
        <p className="mt-2 text-sm muted">{subtitle}</p>
      </article>
    </section>
  );
}
