import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full h-11 px-4 py-3 text-ios-body bg-ios-elevated-2 text-ios-label rounded-md border-none outline-none transition-shadow placeholder:text-ios-label-tertiary focus:shadow-[0_0_0_1px_#669ff2,0_0_0_4px_rgba(102,159,242,0.1)] disabled:cursor-not-allowed disabled:opacity-40 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
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
