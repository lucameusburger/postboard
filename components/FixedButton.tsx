import Link from 'next/link';
import { ReactNode } from 'react';

interface FixedButtonProps {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
}

export default function FixedButton({
    children,
    href,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
}: FixedButtonProps) {
    const baseClasses =
        'fixed text-center bottom-4 left-4 right-4 rounded-full bg-foreground px-8 py-4 text-background font-medium transition-colors hover:bg-[#383838] shadow-lg z-50 disabled:opacity-50 disabled:cursor-not-allowed';

    const combinedClasses = `${baseClasses} ${className}`;

    if (href) {
        return (
            <Link href={href} className={combinedClasses}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClasses}
        >
            {children}
        </button>
    );
}

