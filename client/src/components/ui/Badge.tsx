import { HTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary/20 text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                destructive: 'border-transparent bg-destructive/20 text-destructive-foreground',
                outline: 'text-foreground border-white/20',
                success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse',
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                lg: "px-3 py-1 text-sm",
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, size, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
