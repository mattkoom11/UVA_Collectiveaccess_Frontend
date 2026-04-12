import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const fontStyles: Record<Variant, CSSProperties> = {
  primary: { fontFamily: "var(--font-display), Georgia, serif" },
  secondary: { fontFamily: "var(--font-display), Georgia, serif" },
  ghost: { fontFamily: "var(--font-body), Georgia, serif" },
};

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", className = "", style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantClass[variant]} ${className}`.trim()}
        style={{ ...fontStyles[variant], ...style }}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
