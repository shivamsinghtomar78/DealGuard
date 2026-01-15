import { LucideProps, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoaderProps extends LucideProps {
    size?: number | string;
    className?: string;
    variant?: 'default' | 'dots' | 'pulse';
}

export function Loader({ size = 24, className, variant = 'default', ...props }: LoaderProps) {
    if (variant === 'dots') {
        return (
            <div className={cn("flex space-x-1", className)}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-current rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        );
    }

    return (
        <Loader2
            className={cn("animate-spin text-primary", className)}
            size={size}
            {...props}
        />
    );
}
