import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  // PageLayout just wraps content - header/footer come from root layout
  return <>{children}</>;
}

