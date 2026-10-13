import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "ui-button",
        `ui-button-${variant}`,
        `ui-button-${size}`,
        className,
      )}
      {...props}
    />
  );
});
