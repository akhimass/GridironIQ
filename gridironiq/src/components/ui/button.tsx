import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-mono text-[10px] font-bold tracking-wide transition-colors duration-150 ease rounded-[2px] border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-giq-gold disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-giq-border bg-giq-ink3 text-giq-text hover:bg-giq-surface",
        gold: "border-giq-gold bg-giq-goldDim text-giq-gold hover:bg-giq-gold/20",
        ghost: "border-transparent bg-transparent text-giq-text2 hover:text-giq-gold hover:bg-giq-goldDim",
      },
      size: { default: "h-9 px-3", sm: "h-8 px-2", lg: "h-10 px-4" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
