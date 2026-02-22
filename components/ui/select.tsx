"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextType | undefined>(
  undefined,
);

export function Select({
  children,
  value,
  onValueChange,
  defaultValue,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");

  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
      setOpen(false);
    },
    [value, onValueChange],
  );

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      onValueChange: handleValueChange,
      open,
      setOpen,
    }),
    [currentValue, handleValueChange, open],
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className='relative'>{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within Select");

  return (
    <button
      type='button'
      className={cn(
        "flex justify-between items-center px-4 py-3 w-full h-11 text-ios-body bg-ios-elevated-2 text-ios-label rounded-md focus:outline-none focus:shadow-[0_0_0_1px_#669ff2,0_0_0_4px_rgba(102,159,242,0.1)] disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      {children}
      <ChevronDown className='w-4 h-4 text-ios-label-tertiary' />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  return (
    <span className='truncate'>
      {context.value || placeholder || "선택해주세요"}
    </span>
  );
}

export function SelectContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within Select");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "overflow-auto absolute top-full z-50 mt-1 w-full max-h-60 rounded-md bg-ios-elevated-2 text-ios-label border border-ios-separator animate-scale-in",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  children,
  value,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  className?: string;
}) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  const isSelected = context.value === value;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center min-h-[44px] pl-4 pr-8 text-ios-body outline-none active:bg-ios-elevated-3 transition-colors",
        isSelected && "text-ios-accent font-semibold",
        className,
      )}
      onClick={() => context.onValueChange?.(value)}
      {...props}
    >
      {children}
      {isSelected && (
        <span className='absolute right-4 text-ios-accent'>✓</span>
      )}
    </div>
  );
}
