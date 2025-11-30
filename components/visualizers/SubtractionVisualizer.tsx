import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Question } from '../../types';

interface SubtractionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface BorrowStep {
    index: number;
    originalValue: number;
    newValue: number;
    triggeredByColumn: number;
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

    const { borrows, borrowChains } = useMemo(() => {
        const b: { [key: number]: BorrowStep } = {};
        const chains: { [key: number]: number[] } = {};
        const digits = paddedNum1.split('').map(d => d === ' ' ? 0 : parseInt(d));
        const bottomDigits = paddedNum2.split('').map(d => d === ' ' ? 0 : parseInt(d));

        const workingDigits = [...digits];

        for (let i = maxLength - 1; i >= 0; i--) {
            let top = workingDigits[i];
            const bottom = bottomDigits[i];

            if (top < bottom) {
                let borrowIndex = i - 1;
                while (borrowIndex >= 0 && workingDigits[borrowIndex] === 0) {
                    borrowIndex--;
                }

                if (borrowIndex >= 0) {
                    const chain: number[] = [];

                    b[borrowIndex] = {
                        index: borrowIndex,
                        originalValue: workingDigits[borrowIndex],
                        newValue: workingDigits[borrowIndex] - 1,
                        triggeredByColumn: i
                    };
                    chain.push(borrowIndex);
                    workingDigits[borrowIndex]--;

                    for (let k = borrowIndex + 1; k < i; k++) {
                        b[k] = {
                            index: k,
                            originalValue: 0,
                            newValue: 9,
                            triggeredByColumn: i
                        };
                        chain.push(k);
                        workingDigits[k] = 9;
                    }

                    chain.push(i);
                    chains[i] = chain;
                    workingDigits[i] += 10;
                }
            }
        }
        return { borrows: b, borrowChains: chains };
    }, [paddedNum1, paddedNum2, maxLength]);

    const [visibleColumns, setVisibleColumns] = useState(-1);
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);
    const [borrowAnimationProgress, setBorrowAnimationProgress] = useState<{ [key: number]: number }>({});

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const runAnimation = async () => {
            if (stepIndex === 0) {
                setVisibleColumns(-1);
                setOperandVisibleIndex(-1);
                setBorrowAnimationProgress({});

                for (let i = 0; i < maxLength; i++) {
                    if (!isMounted.current) return;
                    setOperandVisibleIndex(i);
                    await delay(100);
                }
            } else if (stepIndex === 1) {
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(0);
                setBorrowAnimationProgress({});
            } else if (stepIndex === 2) {
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(-1);
                setBorrowAnimationProgress({});

                for (let colIndex = maxLength - 1; colIndex >= 0; colIndex--) {
                    if (!isMounted.current) return;

                    const chain = borrowChains[colIndex];

                    if (chain && chain.length > 0) {
                        for (let progress = 0; progress <= chain.length; progress++) {
                            if (!isMounted.current) return;
                            setBorrowAnimationProgress(prev => ({ ...prev, [colIndex]: progress }));
                            await delay(800);
                        }
                    }

                    await delay(300);

                    if (!isMounted.current) return;
                    setVisibleColumns(maxLength - 1 - colIndex);

                    await delay(1000);
                }
            } else if (stepIndex === 3) {
                setOperandVisibleIndex(maxLength);
                setVisibleColumns(maxLength);

                const allBorrowProgress: { [key: number]: number } = {};
                Object.keys(borrowChains).forEach(key => {
                    const col = parseInt(key);
                    allBorrowProgress[col] = borrowChains[col].length + 1;
                });
                setBorrowAnimationProgress(allBorrowProgress);
            }
        };

        runAnimation();

    }, [stepIndex, maxLength, borrowChains]);

    const isDigitVisible = (index: number) => {
        if (stepIndex < 2) return false;
        return (maxLength - 1 - index) <= visibleColumns;
    };

    const isBorrowVisible = (index: number) => {
        if (stepIndex < 2) return false;

        const borrow = borrows[index];
        if (!borrow) return false;

        const triggeredByColumn = borrow.triggeredByColumn;
        const chain = borrowChains[triggeredByColumn];
        if (!chain) return false;

        const progress = borrowAnimationProgress[triggeredByColumn] || 0;
        const positionInChain = chain.indexOf(index);

        return positionInChain >= 0 && positionInChain < progress;
    };

    const isInVisibleChain = (index: number) => {
        if (stepIndex < 2) return false;

        for (const key of Object.keys(borrowChains)) {
            const col = parseInt(key);
            const chain = borrowChains[col];

            if (chain && chain.length > 0) {
                const sourceIndex = chain[0];
                const progress = borrowAnimationProgress[col] || 0;
                const positionInChain = chain.indexOf(index);

                if (index !== sourceIndex && positionInChain >= 0 && positionInChain < progress) {
                    return true;
                }
            }
        }

        return false;
    };

    const renderTopDigit = (char: string, index: number) => {
        const borrow = borrows[index];
        const showBorrowEffect = isBorrowVisible(index);

        return (
            <div key={index} className={`relative w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 border-transparent
            ${index > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
        `}>
                <span className={`transition-all duration-300 ${showBorrowEffect ? 'line-through text-gray-400 decoration-red-500 decoration-2' : ''}`}>
                    {char}
                </span>

                {showBorrowEffect && borrow && (
                    <span className="absolute -top-4 text-sm font-bold text-red-500 animate-bounce">
                        {borrow.newValue}
                    </span>
                )}

                {(stepIndex === 2 || stepIndex === 3) && isInVisibleChain(index) && (
                    <span className="absolute -left-2 top-1 text-sm font-bold text-red-500">1</span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, 1fr))` }}>
                <div className="w-10"></div>
                {paddedNum1.split('').map((d, i) => renderTopDigit(d, i))}

                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>-</div>
                {paddedNum2.split('').map((d, i) => (
                    <div key={i} className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 border-transparent
                ${i > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
             `}>
                        {d}
                    </div>
                ))}

                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-700 ${operandVisibleIndex >= maxLength - 1 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                <div className="w-10"></div>
                {paddedResult.split('').map((d, i) => (
                    <div
                        key={i}
                        className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 transform
                ${isDigitVisible(i) ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4'}
                ${stepIndex >= 2 && (maxLength - 1 - i) === visibleColumns ? 'text-green-600' : stepIndex >= 2 ? 'text-blue-800' : ''}
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
