import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background active:scale-95",
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform hover:-translate-y-0.5 transition-all',
                primary: 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transform hover:-translate-y-0.5 transition-all',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/10',
                outline: 'border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/40',
                ghost: 'hover:bg-white/5 hover:text-white',
                link: "underline-offset-4 hover:underline text-primary",
                glass: "glass hover:bg-white/10 text-white border-white/20 backdrop-blur-md",
            },
            size: {
                default: "h-11 py-2 px-6",
                sm: "h-9 px-3 rounded-lg",
                lg: "h-14 px-8 rounded-2xl text-lg",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
