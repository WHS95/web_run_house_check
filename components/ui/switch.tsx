"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      disabled = false,
      id,
      ...props
    },
    ref,
  ) => (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ios-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ios-system-bg disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-ios-accent" : "bg-ios-elevated-3",
        className,
      )}
      {...props}
      ref={ref}
    >
      <span
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white shadow-lg ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";

export { Switch };
