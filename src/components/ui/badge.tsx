import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500",
  {
    variants: {
      variant: {
        default: "bg-purple-600/20 text-purple-300 border border-purple-600/30",
        secondary: "bg-zinc-800 text-zinc-300 border border-zinc-700",
        destructive: "bg-red-900/20 text-red-400 border border-red-800/30",
        outline: "border border-zinc-700 text-zinc-400",
        success: "bg-green-900/20 text-green-400 border border-green-800/30",
        category: "bg-purple-900/30 text-purple-300 border border-purple-700/40 hover:bg-purple-800/30 cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
