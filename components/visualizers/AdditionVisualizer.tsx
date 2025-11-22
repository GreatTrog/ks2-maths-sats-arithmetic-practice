import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface AdditionVisualizerProps {
    question: Question;
    stepIndex: number;
}

const AdditionVisualizer: React.FC<AdditionVisualizerProps> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/(\d+)\s*\+\s*(\d+)/);
        if (matches) {
            return { num1: matches[1], num2: matches[2], result: question.answer };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const maxLength = Math.max(num1.length, num2.length, result.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedNum2 = num2.padStart(maxLength, ' ');
    const paddedResult = result.padStart(maxLength, ' ');

    const carries = useMemo(() => {
        const c = Array(maxLength).fill('');
        let carry = 0;
        for (let i = 0; i < maxLength; i++) {
            const d1 = parseInt(num1[num1.length - 1 - i] || '0');
            const d2 = parseInt(num2[num2.length - 1 - i] || '0');
            const sum = d1 + d2 + carry;
            if (sum >= 10) {
                carry = 1;
                if (i + 1 < maxLength) {
                    c[maxLength - 2 - i] = '1';
                } else {
                    c.unshift('1');
                }
            } else {
                carry = 0;
            }
        }
        return c;
    }, [num1, num2, maxLength]);

    // Animation State
    // -1: No result visible
    // 0: Ones column visible
    // 1: Tens column visible...
    const [visibleColumns, setVisibleColumns] = useState(-1);

    // Operand Animation State (Left-to-Right)
    // -1: None visible
    // 0: First column visible...
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);

    useEffect(() => {
        if (stepIndex === 0) {
            setVisibleColumns(-1);
            // Animate operands appearing Left-to-Right
            setOperandVisibleIndex(-1);
            let current = -1;
            const interval = setInterval(() => {
                current++;
                if (current >= maxLength) {
                    clearInterval(interval);
                }
                setOperandVisibleIndex((prev) => Math.max(prev, current));
            }, 300); // Faster for setup
            return () => clearInterval(interval);
        } else {
            // For later steps, operands are fully visible
            setOperandVisibleIndex(maxLength);
        }

        if (stepIndex === 1) {
            setVisibleColumns(0);
        } else if (stepIndex === 2) {
            // Animate remaining columns (Right-to-Left calculation)
            let current = 0;
            const interval = setInterval(() => {
                current++;
                if (current >= maxLength) {
                    clearInterval(interval);
                }
                setVisibleColumns((prev) => Math.max(prev, current));
            }, 800);
            return () => clearInterval(interval);
        } else if (stepIndex === 3) {
            setVisibleColumns(maxLength);
        }
    }, [stepIndex, maxLength]);


    const getColumnStyle = (index: number) => {
        const reverseIndex = maxLength - 1 - index;

        if (stepIndex === 1 && reverseIndex === 0) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }
        // Highlight the currently animating column in step 2
        if (stepIndex === 2 && reverseIndex === visibleColumns) {
            return 'bg-blue-100 border-blue-300 scale-105';
        }
        if (stepIndex === 3) {
            return 'bg-green-100 border-green-300';
        }
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
        const reverseIndex = maxLength - 1 - index;
        // Carries appear one step earlier (when the previous column is processed)
        return reverseIndex <= visibleColumns + 1;
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, 1fr))` }}>

                {/* Row 1 */}
                <div className="w-10"></div> {/* Spacer for operator */}
                {paddedNum1.split('').map((d, i) => renderDigit(d, i, true))}

                {/* Row 2 */}
                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>+</div>
                {paddedNum2.split('').map((d, i) => renderDigit(d, i, true))}

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
                ${stepIndex === 3 ? 'text-green-600' : ''}
            `}
                    >
                        {d}
                    </div>
                ))}

                {/* Carries Row (Below) */}
                <div className="w-10"></div>
                {carries.map((c, i) => (
                    <div key={i} className={`w-10 h-8 flex items-center justify-center text-sm font-bold text-red-500 transition-all duration-500 transform
                ${isCarryVisible(i) && c ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
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

export default AdditionVisualizer;
