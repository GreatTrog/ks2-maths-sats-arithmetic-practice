import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface SubtractionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface BorrowStep {
    index: number; // The column index (0-based from left)
    originalValue: number;
    newValue: number;
    borrowedFromIndex: number; // The index we borrowed FROM
}

const SubtractionVisualizer: React.FC<SubtractionVisualizerProps> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/(\d+)\s*-\s*(\d+)/);
        if (matches) {
            return { num1: matches[1], num2: matches[2], result: question.answer };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const maxLength = Math.max(num1.length, num2.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedNum2 = num2.padStart(maxLength, ' ');
    const paddedResult = result.padStart(maxLength, ' ');

    // Pre-calculate borrows
    const { borrows, topRowDigits } = useMemo(() => {
        const b: { [key: number]: BorrowStep } = {};
        const digits = paddedNum1.split('').map(d => d === ' ' ? 0 : parseInt(d));
        const bottomDigits = paddedNum2.split('').map(d => d === ' ' ? 0 : parseInt(d));

        const workingDigits = [...digits];

        for (let i = maxLength - 1; i >= 0; i--) {
            let top = workingDigits[i];
            const bottom = bottomDigits[i];

            if (top < bottom) {
                // Need to borrow
                let borrowIndex = i - 1;
                while (borrowIndex >= 0 && workingDigits[borrowIndex] === 0) {
                    borrowIndex--;
                }

                if (borrowIndex >= 0) {
                    b[borrowIndex] = {
                        index: borrowIndex,
                        originalValue: workingDigits[borrowIndex],
                        newValue: workingDigits[borrowIndex] - 1,
                        borrowedFromIndex: -1
                    };
                    workingDigits[borrowIndex]--;

                    for (let k = borrowIndex + 1; k < i; k++) {
                        b[k] = {
                            index: k,
                            originalValue: 0,
                            newValue: 9,
                            borrowedFromIndex: borrowIndex
                        };
                        workingDigits[k] = 9;
                    }

                    workingDigits[i] += 10;
                }
            }
        }
        return { borrows: b, topRowDigits: digits };
    }, [paddedNum1, paddedNum2, maxLength]);

    // Animation State
    const [visibleColumns, setVisibleColumns] = useState(-1);
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);

    useEffect(() => {
        if (stepIndex === 0) {
            setVisibleColumns(-1);
            setOperandVisibleIndex(-1);
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
            setVisibleColumns(0);
        } else if (stepIndex === 2) {
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
        if (stepIndex === 1 && reverseIndex === 0) return 'bg-yellow-200 border-yellow-400 scale-110';
        if (stepIndex === 2 && reverseIndex === visibleColumns) return 'bg-blue-100 border-blue-300 scale-105';
        if (stepIndex === 3) return 'bg-green-100 border-green-300';
        return 'border-transparent';
    };

    const isDigitVisible = (index: number) => (maxLength - 1 - index) <= visibleColumns;

    const hasReceivedBorrow = (index: number) => {
        const top = parseInt(paddedNum1[index] || '0');
        const bottom = parseInt(paddedNum2[index] || '0');
        const res = parseInt(paddedResult[index] || '0');
        if ((top - bottom + 10) % 10 === res && top < bottom) return true;
        return false;
    };

    const renderTopDigit = (char: string, index: number) => {
        const borrow = borrows[index];
        // Show borrow effect when the column that NEEDS the borrow is being processed (index + 1 or further right)
        // Actually, simpler: show borrow effect if we have reached the column that triggered it.
        // But we don't track "trigger column" easily.
        // Let's stick to: show borrow if the column to the RIGHT is visible (meaning we are processing it).
        const showBorrowEffect = borrow && (maxLength - 1 - (index + 1)) <= visibleColumns;

        return (
            <div key={index} className={`relative w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${getColumnStyle(index)}
            ${index > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
        `}>
                {/* Original Digit */}
                <span className={`${showBorrowEffect ? 'line-through text-gray-400 decoration-red-500 decoration-2' : ''}`}>
                    {char}
                </span>

                {/* New Value (if borrowed from) */}
                {showBorrowEffect && (
                    <span className="absolute -top-4 text-sm font-bold text-red-500 animate-bounce">
                        {borrow.newValue}
                    </span>
                )}

                {/* Received Borrow (small '1') */}
                {hasReceivedBorrow(index) && isDigitVisible(index) && (
                    <span className="absolute -left-2 top-1 text-sm font-bold text-red-500">1</span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, 1fr))` }}>

                {/* Row 1 (Top) */}
                <div className="w-10"></div>
                {paddedNum1.split('').map((d, i) => renderTopDigit(d, i))}

                {/* Row 2 (Bottom) */}
                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>-</div>
                {paddedNum2.split('').map((d, i) => (
                    <div key={i} className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${getColumnStyle(i)}
                ${i > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
             `}>
                        {d}
                    </div>
                ))}

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
            </div>
        </div>
    );
};

export default SubtractionVisualizer;
