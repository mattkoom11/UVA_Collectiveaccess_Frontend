import { ReactNode } from "react";

interface PageShellProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      {(title || subtitle) && (
        <header className="mb-8 md:mb-12">
          {title && (
            <h1 className="text-2xl md:text-4xl font-semibold tracking-tight uppercase">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm md:text-base text-zinc-300 leading-relaxed">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );
}
