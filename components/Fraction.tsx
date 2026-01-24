import React from 'react';

interface FractionProps {
    numerator: number | string;
    denominator: number | string;
    whole?: number | string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'inherit';
    crossedOut?: boolean;
    highlight?: boolean;
}

const Fraction: React.FC<FractionProps> = ({
    numerator,
    denominator,
    whole,
    className = "",
    size = 'inherit',
    crossedOut = false,
    highlight = false
}) => {
    const sizeClasses = {
        'sm': 'text-sm',
        'md': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        'inherit': ''
    };

    return (
        <span className={`inline-flex items-center align-middle transition-all duration-300 
            ${sizeClasses[size]} 
            ${highlight ? 'text-primary font-bold scale-110' : ''} 
            ${crossedOut ? 'opacity-50 relative' : ''} 
            ${className}`}
        >
            {crossedOut && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-full h-1 bg-red-500 transform -rotate-12 rounded-full shadow-sm"></div>
                </div>
            )}
            {whole !== undefined && whole !== null && whole !== "" && (
                <span className="mr-1.5 font-bold">{whole}</span>
            )}
            <span className="inline-flex flex-col text-center leading-none">
                <span className="border-b-2 border-current px-1 pb-1 font-bold">{numerator}</span>
                <span className="pt-1 font-bold">{denominator}</span>
            </span>
        </span>
    );
};

export default Fraction;
