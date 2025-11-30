import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface Props {
    question: Question;
    stepIndex: number;
}

const DecimalAdditionVisualizer: React.FC<Props> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/([\d.]+)\s*\+\s*([\d.]+)/);
        if (matches) {
            return { num1: matches[1], num2: matches[2], result: parseFloat(question.answer).toString() };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const { paddedNum1, paddedNum2, paddedResult, maxInt, maxDec, totalCols, carries } = useMemo(() => {
        const split = (n: string) => {
            const [i, d] = n.split('.');
            return { i: i || '0', d: d || '' };
        };

        const n1 = split(num1);
        const n2 = split(num2);
        const res = split(result);

        const maxInt = Math.max(n1.i.length, n2.i.length, res.i.length);
        const maxDec = Math.max(n1.d.length, n2.d.length, res.d.length);

        const pad = (parts: { i: string, d: string }) => {
            const i = parts.i.padStart(maxInt, ' ');
            const d = parts.d.padEnd(maxDec, '0');
            return { str: i + '.' + d, originalDecLen: parts.d.length };
        };

        const p1 = pad(n1);
        const p2 = pad(n2);
        const pRes = pad(res);

        // Calculate carries
        // We treat the numbers as if the decimal point wasn't there for calculation, 
        // but we need to map carries to the correct visual column index.
        const c = Array(maxInt + 1 + maxDec).fill('');
        let carry = 0;

        // Iterate from right to left
        // Visual indices: 0 to maxInt-1 (Integers), maxInt (Dot), maxInt+1 to end (Decimals)
        // Calculation indices: match visual indices but skip the dot

        for (let i = maxDec - 1; i >= 0; i--) {
            const idx = maxInt + 1 + i; // Visual index
            const d1 = parseInt(p1.str[idx]);
            const d2 = parseInt(p2.str[idx]);
            const sum = d1 + d2 + carry;
            if (sum >= 10) {
                carry = 1;
                // Carry goes to the left. If we are at the first decimal digit (i=0), 
                // carry goes to the last integer digit (skip dot).
                // Otherwise it goes to i-1.
                if (i === 0) {
                    c[maxInt] = '.'; // Marker for crossing decimal
                    c[maxInt - 1] = '1';
                } else {
                    c[idx - 1] = '1';
                }
            } else {
                carry = 0;
            }
        }

        for (let i = maxInt - 1; i >= 0; i--) {
            const idx = i;
            const d1 = parseInt(p1.str[idx] === ' ' ? '0' : p1.str[idx]);
            const d2 = parseInt(p2.str[idx] === ' ' ? '0' : p2.str[idx]);
            const sum = d1 + d2 + carry;
            if (sum >= 10) {
                carry = 1;
                if (i > 0) {
                    c[i - 1] = '1';
                } else {
                    c.unshift('1'); // Overflow carry (shouldn't happen with maxInt logic usually)
                }
            } else {
                carry = 0;
            }
        }

        return {
            paddedNum1: p1,
            paddedNum2: p2,
            paddedResult: pRes,
            maxInt,
            maxDec,
            totalCols: maxInt + 1 + maxDec,
            carries: c
        };
    }, [num1, num2, result]);

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
                if (current >= totalCols) clearInterval(interval);
                setOperandVisibleIndex(prev => Math.max(prev, current));
            }, 100);
            return () => clearInterval(interval);
        } else {
            setOperandVisibleIndex(totalCols);
        }

        if (stepIndex === 1) {
            setVisibleColumns(0); // Start highlighting
        } else if (stepIndex === 2) {
            let current = 0;
            const interval = setInterval(() => {
                current++;
                if (current >= totalCols) clearInterval(interval);
                setVisibleColumns(prev => Math.max(prev, current));
            }, 500);
            return () => clearInterval(interval);
        } else if (stepIndex === 3) {
            setVisibleColumns(totalCols);
        }
    }, [stepIndex, totalCols]);

    const getColumnStyle = (index: number) => {
        // Reverse index for animation logic (Right to Left)
        const reverseIndex = totalCols - 1 - index;

        if (stepIndex === 1 && reverseIndex === 0) return 'bg-yellow-200 border-yellow-400 scale-110';
        if (stepIndex === 2 && reverseIndex === visibleColumns) return 'bg-blue-100 border-blue-300 scale-105';
        if (stepIndex === 3) return 'bg-green-100 border-green-300';
        return 'border-transparent';
    };

    const renderRow = (paddedObj: { str: string, originalDecLen: number }, isOperand: boolean) => (
        <>
            <div className="w-10"></div>
            {paddedObj.str.split('').map((char, i) => {
                if (char === '.') {
                    return (
                        <div key={i} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>
                    );
                }

                // Check if this is a placeholder zero
                // It is a placeholder if it's in the decimal part (i > maxInt) 
                // AND the index relative to the decimal start is >= originalDecLen
                const isPlaceholder = i > maxInt && (i - (maxInt + 1)) >= paddedObj.originalDecLen;

                return (
                    <div
                        key={i}
                        className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 
                            ${getColumnStyle(i)}
                            ${isOperand && i > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
                            ${isPlaceholder ? 'text-red-500' : ''}
                        `}
                    >
                        {char}
                    </div>
                );
            })}
        </>
    );

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid gap-x-1" style={{ gridTemplateColumns: `40px repeat(${maxInt}, 40px) 16px repeat(${maxDec}, 40px)` }}>

                {/* Row 1 */}
                {renderRow(paddedNum1, true)}

                {/* Row 2 */}
                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>+</div>
                {paddedNum2.str.split('').map((char, i) => {
                    if (char === '.') return <div key={i} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>;
                    const isPlaceholder = i > maxInt && (i - (maxInt + 1)) >= paddedNum2.originalDecLen;
                    return (
                        <div key={i} className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${getColumnStyle(i)} ${i > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'} ${isPlaceholder ? 'text-red-500' : ''}`}>
                            {char}
                        </div>
                    );
                })}

                {/* Divider */}
                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-700 ${operandVisibleIndex >= totalCols - 1 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                {/* Result Row */}
                <div className="w-10"></div>
                {paddedResult.str.split('').map((char, i) => {
                    if (char === '.') return <div key={i} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>;
                    const reverseIndex = totalCols - 1 - i;
                    const isVisible = reverseIndex <= visibleColumns;
                    return (
                        <div key={i} className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 transform
                            ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4'}
                            ${stepIndex === 3 ? 'text-green-600' : 'text-blue-800'}
                        `}>
                            {char}
                        </div>
                    );
                })}

                {/* Carries Row */}
                <div className="w-10"></div>
                {carries.map((c, i) => {
                    if (i === maxInt) return <div key={i} className="w-4"></div>; // Skip dot column for carries
                    // Adjust carry visibility logic
                    // Carries are associated with the column to their RIGHT (where they came from)
                    // But visually they sit under the column they are added TO.
                    // Let's simplify: show carry if the column to its right has been processed.
                    const reverseIndex = totalCols - 1 - i;
                    const isVisible = reverseIndex <= visibleColumns + 1;

                    return (
                        <div key={i} className={`w-10 h-8 flex items-center justify-center text-sm font-bold text-red-500 transition-all duration-500 transform
                            ${isVisible && c ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                        `}>
                            {c}
                        </div>
                    );
                })}

            </div>
            {/* Helper Text */}
            <div className="h-6 mt-1 text-xs font-bold text-gray-400">
                {stepIndex >= 1 && stepIndex < 3 && "Carried digits shown below"}
            </div>
        </div>
    );
};

export default DecimalAdditionVisualizer;
