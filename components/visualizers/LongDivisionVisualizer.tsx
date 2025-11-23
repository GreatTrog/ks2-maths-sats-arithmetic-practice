import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface LongDivisionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface DivisionStep {
    index: number;
    workingNumber: number;
    quotientDigit: number;
    product: number;
    remainder: number;
    broughtDownDigit: string | null;
    newWorkingNumber: number | null;
    depth: number; // Vertical depth for rendering
}

const LongDivisionVisualizer: React.FC<LongDivisionVisualizerProps> = ({ question, stepIndex }) => {
    const { dividend, divisor, steps, totalDepth } = useMemo(() => {
        // Try matching the "Divisor | Dividend" format first (used by Long Division generator)
        let matches = question.text.match(/(\d+)\s*│\s*(\d+)/);
        let dividendStr = '0';
        let divisorNum = 0;

        if (matches) {
            divisorNum = parseInt(matches[1]);
            dividendStr = matches[2];
        } else {
            // Fallback to standard "Dividend ÷ Divisor" format
            matches = question.text.match(/(\d+)\s*÷\s*(\d+)/);
            if (matches) {
                dividendStr = matches[1];
                divisorNum = parseInt(matches[2]);
            } else {
                return { dividend: '0', divisor: 0, steps: [], totalDepth: 0 };
            }
        }

        const calculatedSteps: DivisionStep[] = [];
        let currentRemainder = 0;
        let currentWorking = 0;
        let depth = 0;

        for (let i = 0; i < dividendStr.length; i++) {
            const digit = parseInt(dividendStr[i]);
            currentWorking = currentRemainder * 10 + digit;

            const quotientDigit = Math.floor(currentWorking / divisorNum);
            const product = quotientDigit * divisorNum;
            const remainder = currentWorking - product;

            // Look ahead for brought down digit
            const nextDigit = i < dividendStr.length - 1 ? dividendStr[i + 1] : null;

            calculatedSteps.push({
                index: i,
                workingNumber: currentWorking,
                quotientDigit,
                product,
                remainder,
                broughtDownDigit: nextDigit,
                newWorkingNumber: nextDigit ? remainder * 10 + parseInt(nextDigit) : null,
                depth: depth
            });

            currentRemainder = remainder;
            depth++;
        }

        return {
            dividend: dividendStr,
            divisor: divisorNum,
            steps: calculatedSteps,
            totalDepth: depth
        };
    }, [question]);

    // Animation State
    const [visibleSteps, setVisibleSteps] = useState<number>(0);
    const [showBringDown, setShowBringDown] = useState<boolean>(false);

    useEffect(() => {
        if (stepIndex === 0) {
            setVisibleSteps(0);
            setShowBringDown(false);
        } else if (stepIndex === 1) {
            // Step 1: First division
            setVisibleSteps(1);
            setShowBringDown(false);
        } else if (stepIndex === 2) {
            // Step 2: Multiply and Subtract (first step complete)
            setVisibleSteps(1);
            setShowBringDown(true); // Show the subtraction part
        } else if (stepIndex === 3) {
            // Step 3: Bring Down and Repeat (Loop through rest)
            // Animate remaining steps
            let current = 1;
            const interval = setInterval(() => {
                if (current <= steps.length) {
                    setVisibleSteps(current);
                    setShowBringDown(true);
                    current++;
                } else {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [stepIndex, steps.length]);

    const rowHeight = 25; // Reduced from 30
    const charWidth = 30;
    const startX = 60; // Space for divisor
    const startY = 60; // Space for quotient

    // Helper to render a number digit-by-digit right-aligned to a specific index
    const renderAlignedNumber = (num: number, endIndex: number, y: number, color: string = 'text-gray-500', bold: boolean = false) => {
        const numStr = num.toString();
        return numStr.split('').map((digit, idx) => {
            // Calculate which column this digit belongs to
            // The last digit (numStr.length - 1) goes to endIndex
            // The digit at idx goes to: endIndex - (numStr.length - 1 - idx)
            const colIndex = endIndex - (numStr.length - 1 - idx);
            return (
                <div
                    key={`${y}-${colIndex}`}
                    className={`absolute w-[30px] text-center text-xl font-mono ${bold ? 'font-bold' : ''} ${color}`}
                    style={{
                        top: `${y}px`,
                        left: `${startX + (colIndex * charWidth)}px`
                    }}
                >
                    {digit}
                </div>
            );
        });
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 overflow-auto" style={{ maxHeight: '500px' }}>
            <div className="relative" style={{ width: `${Math.max(300, startX + dividend.length * charWidth + 50)}px`, height: `${startY + (visibleSteps * 3 * rowHeight) + 150}px` }}>

                {/* Divisor */}
                <div className="absolute text-2xl font-mono font-bold text-blue-600" style={{ top: `${startY}px`, left: '10px' }}>
                    {divisor}
                </div>

                {/* Bus Stop Lines */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <path
                        d={`M ${startX - 10} ${startY + 40} L ${startX - 10} ${startY} L ${startX + dividend.length * charWidth + 20} ${startY}`}
                        fill="none"
                        stroke="#374151"
                        strokeWidth="3"
                    />
                </svg>

                {/* Dividend */}
                <div className="absolute flex" style={{ top: `${startY + 5}px`, left: `${startX}px` }}>
                    {dividend.split('').map((d, i) => (
                        <div key={i} className="w-[30px] text-center text-2xl font-mono font-bold">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Quotient */}
                <div className="absolute flex" style={{ top: `${startY - 35}px`, left: `${startX}px` }}>
                    {steps.map((step, i) => (
                        <div key={i} className={`w-[30px] text-center text-2xl font-mono font-bold ${i < visibleSteps ? 'text-green-600' : 'text-transparent'}`}>
                            {step.quotientDigit}
                        </div>
                    ))}
                </div>

                {/* Working Out Steps */}
                {steps.map((step, i) => {
                    if (i >= visibleSteps) return null;

                    // Only show working out if it's not the very first step OR if we want to show full working.
                    // Step 0 is just setup.
                    // Step 1 shows quotient digit.
                    // Step 2 shows product and remainder for first digit.

                    const yPos = startY + 40 + (i * 3 * rowHeight);

                    // We only render the subtraction block if we have something to subtract
                    // or if it's a step that should show working (usually all steps in long division)
                    const showWorking = stepIndex >= 2 || i < visibleSteps - 1;

                    if (!showWorking) return null;

                    return (
                        <React.Fragment key={i}>
                            {/* Product (subtracted number) */}
                            <div className="absolute text-xl font-mono text-gray-500" style={{ top: `${yPos}px`, left: `${startX + (step.index * charWidth) - (step.product.toString().length * charWidth) - 10}px` }}>
                                -
                            </div>
                            {renderAlignedNumber(step.product, step.index, yPos, 'text-gray-500')}

                            {/* Line */}
                            <div
                                className="absolute bg-gray-400"
                                style={{
                                    top: `${yPos + 30}px`,
                                    left: `${startX + (step.index * charWidth) - (step.product.toString().length * charWidth) + 10}px`,
                                    width: `${step.product.toString().length * charWidth}px`,
                                    height: '2px'
                                }}
                            />

                            {/* Remainder */}
                            {renderAlignedNumber(step.remainder, step.index, yPos + 35, 'text-black', true)}

                            {/* Brought Down Digit */}
                            {step.broughtDownDigit && (
                                <div
                                    className="absolute text-xl font-mono font-bold text-blue-500 w-[30px] text-center"
                                    style={{
                                        top: `${yPos + 35}px`,
                                        left: `${startX + ((step.index + 1) * charWidth)}px`
                                    }}
                                >
                                    {step.broughtDownDigit}
                                    {/* Arrow */}
                                    <svg className="absolute -top-8 left-0 w-full h-10 pointer-events-none text-blue-300" viewBox="0 0 30 40">
                                        <path d="M 15 0 L 15 18" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}

                <svg className="absolute w-0 h-0">
                    <defs>
                        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="#93C5FD" />
                        </marker>
                    </defs>
                </svg>

            </div>

            {/* Helper Text */}
            <div className="h-6 mt-4 text-xs font-bold text-gray-400 sticky bottom-0 bg-white w-full text-center">
                {stepIndex === 1 && "Divide the first digits"}
                {stepIndex === 2 && "Multiply and subtract"}
                {stepIndex === 3 && "Bring down and repeat"}
            </div>
        </div>
    );
};

export default LongDivisionVisualizer;
