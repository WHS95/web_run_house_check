"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Drawer = ({ open, onOpenChange, children }: DrawerProps) => {
  return (
    <>
      {open && (
        <div className='fixed inset-0 z-50'>
          {/* iOS 스타일 오버레이 */}
          <div
            className='fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in'
            onClick={() => onOpenChange(false)}
          />
          {children}
        </div>
      )}
    </>
  );
};

const DrawerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-xl bg-rh-bg-surface border-t border-rh-border animate-ios-sheet-up",
      className,
    )}
    {...props}
  >
    {/* iOS 드래그 핸들 */}
    <div className='mx-auto mt-2 mb-0 h-[5px] w-9 rounded-full bg-rh-bg-muted' />
    {children}
  </div>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4 pb-safe", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-rh-title3 font-semibold text-rh-text-primary leading-none tracking-tight",
      className,
    )}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-rh-body text-rh-text-secondary", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
