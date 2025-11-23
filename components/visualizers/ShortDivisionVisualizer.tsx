import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface ShortDivisionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface DivisionStep {
    digitIndex: number;
    workingNumber: number;
    quotientDigit: number;
    remainder: number;
}

const ShortDivisionVisualizer: React.FC<ShortDivisionVisualizerProps> = ({ question, stepIndex }) => {
    const { dividend, divisor, quotient, quotientWithLeadingZeros, steps } = useMemo(() => {
        // Parse the question to extract dividend and divisor
        const matches = question.text.match(/(\d+)\s*÷\s*(\d+)/);
        if (!matches) {
            return { dividend: '0', divisor: '0', quotient: '0', quotientWithLeadingZeros: '0', steps: [] };
        }

        const dividendStr = matches[1];
        const divisorNum = parseInt(matches[2]);
        const quotientStr = question.answer;

        // Calculate the division steps
        const divisionSteps: DivisionStep[] = [];
        let remainder = 0;
        let quotientWithZeros = '';

        for (let i = 0; i < dividendStr.length; i++) {
            const currentDigit = parseInt(dividendStr[i]);
            const workingNumber = remainder * 10 + currentDigit;
            const quotientDigit = Math.floor(workingNumber / divisorNum);
            remainder = workingNumber % divisorNum;

            quotientWithZeros += quotientDigit.toString();

            divisionSteps.push({
                digitIndex: i,
                workingNumber,
                quotientDigit,
                remainder
            });
        }

        return {
            dividend: dividendStr,
            divisor: matches[2],
            quotient: quotientStr,
            quotientWithLeadingZeros: quotientWithZeros,
            steps: divisionSteps
        };
    }, [question]);

    // Animation state
    const [visibleQuotientDigits, setVisibleQuotientDigits] = useState(0);
    const [currentWorkingIndex, setCurrentWorkingIndex] = useState(-1);

    // Derive which remainders to show based on visible quotient digits
    const showRemainders = useMemo(() => {
        if (stepIndex === 0) return [];

        // Show remainders for all visible steps that have a remainder
        // For step 3 (final), show all. For others, show up to visible digits.
        const limit = stepIndex === 3 ? steps.length : visibleQuotientDigits;

        return steps
            .slice(0, limit)
            .map((step, idx) => step.remainder > 0 ? idx : -1)
            .filter(idx => idx >= 0);
    }, [stepIndex, visibleQuotientDigits, steps]);

    useEffect(() => {
        if (stepIndex === 0) {
            // Step 0: Set up the bus stop - show structure only
            setVisibleQuotientDigits(0);
            setCurrentWorkingIndex(-1);
        } else if (stepIndex === 1) {
            // Step 1: Divide the first digit
            setVisibleQuotientDigits(1);
            setCurrentWorkingIndex(0);
        } else if (stepIndex === 2) {
            // Step 2: Repeat for next digits - show progressive work
            setCurrentWorkingIndex(1);

            // Animate through remaining digits
            let current = 1;
            const interval = setInterval(() => {
                if (current < steps.length) {
                    // Show result for current digit
                    setVisibleQuotientDigits(current + 1);
                    // Move highlight to next digit (if exists) or keep on current
                    if (current + 1 < steps.length) {
                        setCurrentWorkingIndex(current + 1);
                    } else {
                        setCurrentWorkingIndex(current);
                    }
                    current++;
                } else {
                    clearInterval(interval);
                }
            }, 600);
            return () => clearInterval(interval);
        } else if (stepIndex === 3) {
            // Step 3: Final answer - show everything complete
            setVisibleQuotientDigits(steps.length);
            setCurrentWorkingIndex(-1);
        }
    }, [stepIndex, steps]);

    const getDividendDigitStyle = (index: number) => {
        if (stepIndex === 1 && index === 0) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }
        if (stepIndex === 2 && index === currentWorkingIndex) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }
        return 'border-transparent';
    };

    const getQuotientDigitStyle = (index: number) => {
        if (stepIndex === 3) {
            // In final step, only highlight the actual answer part (skip leading zeros)
            const leadingZeroCount = quotientWithLeadingZeros.length - quotient.length;
            if (index >= leadingZeroCount) {
                return 'bg-green-100 border-2 border-green-300 text-green-600';
            }
            // Leading zeros remain visible but not highlighted
            return '';
        }
        if (index === visibleQuotientDigits - 1 && stepIndex < 3) {
            return 'bg-yellow-200 text-yellow-800';
        }
        return '';
    };

    // Always display quotient with leading zeros to show the working
    const displayQuotient = quotientWithLeadingZeros;

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="flex gap-1">
                {/* Divisor (outside/left of everything) */}
                <div className="flex flex-col items-end mr-3">
                    <div className="h-12 mb-2"></div> {/* Spacer for quotient row */}
                    <div
                        className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500
                            ${stepIndex >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                            ${stepIndex === 1 || stepIndex === 2 ? 'bg-blue-100 text-blue-600' : ''}
                        `}
                    >
                        {divisor}
                    </div>
                </div>

                {/* Main division area with quotient and dividend */}
                <div className="relative">
                    {/* SVG Bus Stop Shape */}
                    <svg
                        width={dividend.length * 44 + 10}
                        height="80"
                        className="absolute top-0 left-0"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Horizontal line on top - positioned at bottom of quotient row */}
                        <line
                            x1="0"
                            y1="52"
                            x2={dividend.length * 44}
                            y2="52"
                            stroke="#374151"
                            strokeWidth="3"
                            className={`transition-all duration-700 ${stepIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {/* Vertical line on left */}
                        <line
                            x1="0"
                            y1="52"
                            x2="0"
                            y2="108"
                            stroke="#374151"
                            strokeWidth="3"
                            className={`transition-all duration-700 ${stepIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {/* Curved corner */}
                        <path
                            d="M 0 108 Q 0 118, 10 118"
                            stroke="#374151"
                            strokeWidth="3"
                            fill="none"
                            className={`transition-all duration-700 ${stepIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}
                        />
                    </svg>

                    {/* Quotient Row (on top, above dividend) */}
                    <div className="flex gap-1 mb-2 h-12">
                        {displayQuotient.split('').map((digit, i) => (
                            <div
                                key={`q-${i}`}
                                className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 transform
                                    ${i < visibleQuotientDigits ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4'}
                                    ${getQuotientDigitStyle(i)}
                                `}
                            >
                                {digit}
                            </div>
                        ))}
                    </div>

                    {/* Dividend digits (inside the bus stop) */}
                    <div className="flex gap-1">
                        {dividend.split('').map((digit, i) => (
                            <div
                                key={`d-${i}`}
                                className="relative"
                                style={{ zIndex: dividend.length - i }}
                            >
                                <div
                                    className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 relative
                                        ${getDividendDigitStyle(i)}
                                        ${stepIndex >= 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                                    `}
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    {digit}
                                </div>
                                {/* Remainder shown as small number next to digit - positioned absolutely on top */}
                                {i < dividend.length - 1 && showRemainders.includes(i) && steps[i] && steps[i].remainder > 0 && (
                                    <div
                                        className="absolute -right-2 -top-1 text-xs font-bold text-red-500 transition-all duration-500 z-20 bg-white px-1 rounded"
                                        style={{
                                            opacity: showRemainders.includes(i) ? 1 : 0,
                                            transform: showRemainders.includes(i) ? 'scale(1)' : 'scale(0)'
                                        }}
                                    >
                                        {steps[i].remainder}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Helper Text */}
            <div className="h-6 mt-4 text-xs font-bold text-gray-400">
                {stepIndex === 1 && "Dividing the first digit"}
                {stepIndex === 2 && "Working through each digit"}
                {stepIndex === 3 && "Division complete!"}
            </div>
        </div>
    );
};

export default ShortDivisionVisualizer;
