import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "#e8e4de",
    color: "#0a0908",
    fontFamily: "var(--font-display), Georgia, serif",
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    padding: "9px 20px",
    border: "none",
    cursor: "pointer",
    display: "inline-block",
    transition: "background 0.15s ease",
  },
  secondary: {
    background: "transparent",
    color: "#a0a0a0",
    fontFamily: "var(--font-display), Georgia, serif",
    fontSize: "10px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    padding: "9px 20px",
    border: "1px solid #2a2a2a",
    cursor: "pointer",
    display: "inline-block",
    transition: "border-color 0.15s ease, color 0.15s ease",
  },
  ghost: {
    background: "transparent",
    color: "var(--muted)",
    fontFamily: "var(--font-body), Georgia, serif",
    fontSize: "13px",
    letterSpacing: "0.1em",
    padding: "6px 0",
    border: "none",
    borderBottom: "1px solid #2a2a2a",
    cursor: "pointer",
    display: "inline-block",
    transition: "color 0.15s ease",
  },
};

const hoverStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: "#f0ede8" },
  secondary: { borderColor: "#3a3a3a", color: "#c0bdb8" },
  ghost: { color: "#a0a0a0" },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const base = styles[variant];

    return (
      <button
        ref={ref}
        style={{ ...base, ...style }}
        onMouseEnter={(e) => {
          Object.assign((e.currentTarget as HTMLElement).style, hoverStyles[variant]);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          Object.assign((e.currentTarget as HTMLElement).style, base);
          if (style) Object.assign((e.currentTarget as HTMLElement).style, style);
          onMouseLeave?.(e);
        }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
