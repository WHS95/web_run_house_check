import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-rh-lg text-rh-body font-semibold transition-all active:scale-[0.98] active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rh-accent disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-rh-accent text-white",
        destructive: "bg-[#3E6496] text-white",
        outline: "border border-rh-border bg-transparent text-rh-accent",
        secondary: "bg-rh-bg-surface border border-rh-border text-white font-medium",
        ghost: "text-rh-accent active:bg-rh-bg-muted font-medium",
        link: "text-rh-accent underline-offset-4 hover:underline active:opacity-70",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-8 rounded-rh-md px-3 text-rh-caption font-semibold",
        lg: "h-12 rounded-rh-lg px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
