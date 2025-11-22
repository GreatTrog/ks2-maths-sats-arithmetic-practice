import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface ShortMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number;
}

const ShortMultiplicationVisualizer: React.FC<ShortMultiplicationVisualizerProps> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/(\d+)\s*×\s*(\d+)/);
        if (matches) {
            // Ensure num1 is the larger number (top) and num2 is single digit (bottom)
            const n1 = matches[1];
            const n2 = matches[2];
            return { num1: n1, num2: n2, result: question.answer };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const maxLength = Math.max(num1.length, result.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedResult = result.padStart(maxLength, ' ');

    // Calculate carries and intermediate results for each column
    const { carries, intermediateResults } = useMemo(() => {
        const c: string[] = Array(maxLength).fill('');
        const intermediate: number[] = [];
        let carry = 0;
        const multiplier = parseInt(num2);

        for (let i = num1.length - 1; i >= 0; i--) {
            const digit = parseInt(num1[i]);
            const product = digit * multiplier + carry;
            intermediate.unshift(product % 10);
            carry = Math.floor(product / 10);

            // Place carry one column to the LEFT of the current position
            // When processing ones (i=num1.length-1), carry goes to tens column (i-1)
            if (carry > 0 && i > 0) {
                const carryColumnIndex = maxLength - num1.length + i - 1;
                c[carryColumnIndex] = carry.toString();
            }
        }

        return { carries: c, intermediateResults: intermediate };
    }, [num1, num2, maxLength]);

    // Animation state
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);
    const [visibleColumns, setVisibleColumns] = useState(-1);
    const [currentMultiplyColumn, setCurrentMultiplyColumn] = useState(-1);

    useEffect(() => {
        if (stepIndex === 0) {
            // Step 0: Set up in columns - animate operands appearing left to right
            setVisibleColumns(-1);
            setOperandVisibleIndex(-1);
            setCurrentMultiplyColumn(-1);
            let current = -1;
            const interval = setInterval(() => {
                current++;
                if (current >= maxLength) {
                    clearInterval(interval);
                }
                setOperandVisibleIndex((prev) => Math.max(prev, current));
            }, 300);
            return () => clearInterval(interval);
        } else {
            setOperandVisibleIndex(maxLength);
        }

        if (stepIndex === 1) {
            // Step 1: Multiply the ones - highlight ones column
            setVisibleColumns(0);
            setCurrentMultiplyColumn(num1.length - 1);
        } else if (stepIndex === 2) {
            // Step 2: Multiply the tens - show all result digits but only highlight tens
            setCurrentMultiplyColumn(-1);
            // Show all columns immediately, no animation
            setVisibleColumns(maxLength);
        } else if (stepIndex === 3) {
            // Step 3: Final answer - show everything
            setVisibleColumns(maxLength);
            setCurrentMultiplyColumn(-1);
        }
    }, [stepIndex, maxLength, num1.length]);

    const getColumnStyle = (index: number) => {
        const reverseIndex = maxLength - 1 - index;

        // Highlight the ones column in step 1
        if (stepIndex === 1 && reverseIndex === 0) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }

        // Highlight the tens column (leftmost non-ones digit) in step 2
        // For a 2-digit number, this is reverseIndex 1 (the tens column)
        if (stepIndex === 2 && reverseIndex === 1) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }

        // No highlight on multiplicand in step 3
        return 'border-transparent';
    };

    const renderDigit = (char: string, index: number, isOperand = false) => (
        <div
            key={index}
            className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${getColumnStyle(index)}
            ${isOperand && index > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
        `}
        >
            {char}
        </div>
    );

    const isDigitVisible = (index: number) => {
        const reverseIndex = maxLength - 1 - index;
        return reverseIndex <= visibleColumns;
    };

    const isCarryVisible = (index: number) => {
        if (stepIndex < 1) return false;
        const reverseIndex = maxLength - 1 - index;
        // Carries appear when we've processed the column to the RIGHT (which generated this carry)
        // A carry at position index is generated by the column at index+1 (reverseIndex-1)
        return reverseIndex - 1 <= visibleColumns;
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, 1fr))` }}>

                {/* Row 1: Top number */}
                <div className="w-10"></div> {/* Spacer for operator */}
                {paddedNum1.split('').map((d, i) => renderDigit(d, i, true))}

                {/* Row 2: Multiplier (single digit, aligned right) */}
                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>×</div>
                {Array(maxLength - 1).fill(' ').map((_, i) => (
                    <div key={i} className="w-10"></div>
                ))}
                <div
                    className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${stepIndex === 1 ? 'bg-yellow-200 border-yellow-400' :
                        stepIndex === 2 ? 'bg-yellow-200 border-yellow-400 scale-110' :
                            'border-transparent'
                        }
                    ${operandVisibleIndex >= maxLength - 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                `}
                >
                    {num2}
                </div>

                {/* Divider */}
                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-700 ${operandVisibleIndex >= maxLength - 1 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                {/* Result Row */}
                <div className="w-10"></div>
                {paddedResult.split('').map((d, i) => (
                    <div
                        key={i}
                        className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 transform
                ${isDigitVisible(i) ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4'}
                ${stepIndex === 1 && (maxLength - 1 - i) === 0 ? 'bg-yellow-200 text-yellow-800' : ''}
                ${stepIndex === 2 ? 'text-blue-800' : ''}
                ${stepIndex === 3 ? 'bg-green-100 border-2 border-green-300 text-green-600' : ''}
            `}
                    >
                        {d}
                    </div>
                ))}

                {/* Carries Row (Below result) */}
                <div className="w-10"></div>
                {carries.map((c, i) => (
                    <div key={i} className={`w-10 h-8 flex items-center justify-center text-sm font-bold text-red-500 transition-all duration-500 transform
                ${isCarryVisible(i) && c ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
            `}>
                        {c}
                    </div>
                ))}
            </div>

            {/* Helper Text */}
            <div className="h-6 mt-1 text-xs font-bold text-gray-400">
                {stepIndex >= 1 && stepIndex < 3 && "Carried digits shown below"}
            </div>
        </div>
    );
};

export default ShortMultiplicationVisualizer;
