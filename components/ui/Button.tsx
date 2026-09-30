import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantClass[variant]} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
