import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-subtle hover:bg-primary/90 hover:shadow-primary-glow active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-subtle hover:bg-destructive/90",
        outline: "border border-input bg-background text-foreground shadow-subtle hover:bg-accent hover:border-muted-foreground/30",
        secondary: "bg-card border border-input text-foreground shadow-subtle hover:bg-muted/50",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-sm",
        sm: "h-8 px-3 py-1.5 text-sm rounded-sm",
        lg: "h-10 px-6 py-2 rounded-sm",
        icon: "h-8 w-8 rounded-sm",
        "icon-sm": "h-7 w-7 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
