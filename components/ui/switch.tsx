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
        "peer inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rh-accent focus-visible:ring-offset-2 focus-visible:ring-offset-rh-bg-primary disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-rh-accent" : "bg-rh-bg-muted",
        className,
      )}
      {...props}
      ref={ref}
    >
      <span
        className={cn(
          "pointer-events-none block h-[22px] w-[22px] rounded-full shadow-lg ring-0 transition-transform duration-200",
          checked ? "bg-white" : "bg-rh-text-secondary",
          checked ? "translate-x-[20px]" : "translate-x-0",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";

export { Switch };
