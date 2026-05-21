import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full h-12 px-4 py-3 text-rh-body bg-rh-bg-inset text-rh-text-primary rounded-rh-md border border-rh-border-strong outline-none transition-shadow placeholder:text-rh-text-muted focus:border-rh-accent-hover focus:shadow-[0_0_0_1px_var(--rh-accent),0_0_0_4px_rgba(184,217,100,0.18)] disabled:cursor-not-allowed disabled:opacity-40 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
