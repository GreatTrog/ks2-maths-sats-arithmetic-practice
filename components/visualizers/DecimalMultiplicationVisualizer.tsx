import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Question } from '../../types';

interface DecimalMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number;
}

const DecimalMultiplicationVisualizer: React.FC<DecimalMultiplicationVisualizerProps> = ({ question, stepIndex }) => {
    const { num1, num2, result, originalNum1, originalNum2, decimalPlaces } = useMemo(() => {
        const matches = question.text.match(/([\d.]+)\s*×\s*([\d.]+)/);
        if (matches) {
            const n1Str = matches[1];
            const n2Str = matches[2];

            // Count decimal places
            const dp1 = (n1Str.split('.')[1] || '').length;
            const dp2 = (n2Str.split('.')[1] || '').length;
            const totalDp = dp1 + dp2;

            // Treat as integers
            const intN1 = n1Str.replace('.', '');
            const intN2 = n2Str.replace('.', '');
            const intResult = (parseInt(intN1) * parseInt(intN2)).toString();

            return {
                num1: intN1,
                num2: intN2,
                result: intResult,
                originalNum1: n1Str,
                originalNum2: n2Str,
                decimalPlaces: totalDp
            };
        }
        return { num1: '0', num2: '0', result: '0', originalNum1: '0', originalNum2: '0', decimalPlaces: 0 };
    }, [question]);

    const maxLength = Math.max(num1.length, result.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedResult = result.padStart(maxLength, ' ');

    // Calculate carries and intermediate results for each column (Standard Short Multiplication Logic)
    const { carries } = useMemo(() => {
        const c: string[] = Array(maxLength).fill('');
        let carry = 0;
        const multiplier = parseInt(num2);

        for (let i = num1.length - 1; i >= 0; i--) {
            const digit = parseInt(num1[i]);
            const product = digit * multiplier + carry;
            carry = Math.floor(product / 10);

            if (carry > 0 && i > 0) {
                const carryColumnIndex = maxLength - num1.length + i - 1;
                c[carryColumnIndex] = carry.toString();
            }
        }
        return { carries: c };
    }, [num1, num2, maxLength]);

    // Animation state
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);
    const [visibleColumns, setVisibleColumns] = useState(-1);
    const [shiftProgress, setShiftProgress] = useState(0); // 0 to decimalPlaces

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const runAnimation = async () => {
            // Reset states based on stepIndex
            if (stepIndex === 0) {
                setVisibleColumns(-1);
                setOperandVisibleIndex(-1);
                setShiftProgress(0);

                for (let i = 0; i < maxLength; i++) {
                    if (!isMounted.current) return;
                    setOperandVisibleIndex(i);
                    await delay(100);
                }
            } else if (stepIndex === 1) {
                // Multiply ones
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(0);
                setShiftProgress(0);
            } else if (stepIndex === 2) {
                // Multiply tens (and others)
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(maxLength); // Show all integer digits
                setShiftProgress(0);
            } else if (stepIndex === 3) {
                // Final Answer (Integer part)
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(maxLength);
                setShiftProgress(0);
            } else if (stepIndex === 4) {
                // Place Value Shift Animation
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(maxLength);
                setShiftProgress(0);

                await delay(1000);

                // Animate shift
                for (let i = 1; i <= decimalPlaces; i++) {
                    if (!isMounted.current) return;
                    setShiftProgress(i);
                    await delay(800);
                }
            }
        };

        runAnimation();
    }, [stepIndex, maxLength, decimalPlaces]);

    const getColumnStyle = (index: number) => {
        const reverseIndex = maxLength - 1 - index;

        if (stepIndex === 1 && reverseIndex === 0) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
        }
        if (stepIndex === 2 && reverseIndex === 1) {
            return 'bg-yellow-200 border-yellow-400 scale-110';
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
        if (stepIndex < 1) return false;
        const reverseIndex = maxLength - 1 - index;
        return reverseIndex - 1 <= visibleColumns;
    };

    // --- Place Value Grid Logic ---
    const renderPlaceValueGrid = () => {
        const digits = result.split('');
        const numDigits = digits.length;

        // Determine range of powers needed
        const maxPower = numDigits - 1;
        const minPower = -decimalPlaces;

        const columns: { label: string, power: number, isDot?: boolean }[] = [];

        for (let p = maxPower; p >= minPower; p--) {
            let label = '';
            if (p >= 0) {
                label = Math.pow(10, p).toString();
            } else {
                label = `1/${Math.pow(10, -p)}`;
            }
            columns.push({ label, power: p });
        }

        // Insert dot column between power 0 and -1
        const dotIndex = columns.findIndex(c => c.power === 0) + 1;
        if (dotIndex > 0) {
            columns.splice(dotIndex, 0, { label: '.', power: -0.5, isDot: true });
        }

        return (
            <div className="flex flex-col items-center animate-fade-in w-full overflow-x-auto">
                <div className="mb-6 text-center">
                    <p className="text-lg font-bold text-gray-700 mb-1">
                        <span className="text-2xl font-mono">
                            {originalNum1} × {originalNum2}
                        </span>
                    </p>
                    <p className="text-gray-600 font-bold text-blue-600 transition-opacity duration-500" style={{ opacity: shiftProgress > 0 ? 1 : 0 }}>
                        Move digits {decimalPlaces} place{decimalPlaces !== 1 ? 's' : ''} to the right
                    </p>
                </div>

                <div className="grid gap-0 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(50px, 60px))` }}>
                    {/* Headers */}
                    {columns.map((col, i) => (
                        <div key={i} className={`flex items-center justify-center h-10 font-bold text-gray-500 text-xs sm:text-sm bg-gray-100 border-b border-r border-gray-200 last:border-r-0 ${col.isDot ? 'text-xl text-gray-800' : ''}`}>
                            {col.label}
                        </div>
                    ))}

                    {/* Grid Cells & Digits */}
                    <div className="col-span-full relative h-24 bg-white">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 grid w-full h-full" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(50px, 60px))` }}>
                            {columns.map((col, i) => (
                                <div key={i} className={`border-r border-gray-100 h-full last:border-r-0 ${col.isDot ? 'bg-gray-50/50' : ''}`}></div>
                            ))}
                        </div>

                        {/* The Decimal Point (Fixed) */}
                        {columns.map((col, i) => col.isDot && (
                            <div key="fixed-dot" className="absolute top-0 bottom-0 flex items-center justify-center text-4xl font-bold text-gray-800 z-10"
                                style={{
                                    left: `${(i / columns.length) * 100}%`,
                                    width: `${(1 / columns.length) * 100}%`
                                }}>
                                .
                            </div>
                        ))}

                        {/* Digits */}
                        {digits.map((d, i) => {
                            const currentPower = (numDigits - 1 - i) - shiftProgress;

                            let colIndex = maxPower - currentPower;
                            if (currentPower < 0) colIndex += 1; // Skip dot

                            const leftPercent = (colIndex / columns.length) * 100;
                            const widthPercent = (1 / columns.length) * 100;

                            return (
                                <div
                                    key={i}
                                    className="absolute top-0 bottom-0 flex items-center justify-center transition-all duration-700 ease-in-out"
                                    style={{
                                        left: `${leftPercent}%`,
                                        width: `${widthPercent}%`
                                    }}
                                >
                                    <span className="text-3xl sm:text-4xl font-mono font-bold text-blue-600">
                                        {d}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (stepIndex === 4) {
        return (
            <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 min-h-[400px] justify-center">
                {renderPlaceValueGrid()}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid gap-x-1" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, auto))` }}>

                {/* Row 1: Top number (Integer view) */}
                <div className="w-10"></div>
                {paddedNum1.split('').map((d, i) => renderDigit(d, i, true))}

                {/* Row 2: Multiplier */}
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
                    ${stepIndex >= 2 ? 'text-blue-800' : ''}
                `}
                    >
                        {d}
                    </div>
                ))}

                {/* Carries Row */}
                <div className="col-span-full flex justify-end pr-0">
                    <div className="flex gap-x-1">
                        <div className="w-10"></div> {/* Offset for operator col */}
                        {carries.map((c, i) => (
                            <div key={i} className={`w-10 h-8 flex items-center justify-center text-sm font-bold text-red-500 transition-all duration-500 transform
                                ${isCarryVisible(i) && c ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                            `}>
                                {c}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DecimalMultiplicationVisualizer;
