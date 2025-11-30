import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Question } from '../../types';

interface Props {
    question: Question;
    stepIndex: number;
}

interface BorrowStep {
    index: number;
    originalValue: number;
    newValue: number;
    triggeredByColumn: number;
}

const DecimalSubtractionVisualizer: React.FC<Props> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/([\d.]+)\s*-\s*([\d.]+)/);
        if (matches) {
            return { num1: matches[1], num2: matches[2], result: question.answer };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const { paddedNum1, paddedNum2, paddedResult, maxInt, maxDec, totalCols, borrows, borrowChains } = useMemo(() => {
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

        const digits1: number[] = [];
        const digits2: number[] = [];
        const visualToCalcIndex: number[] = [];
        const calcToVisualIndex: number[] = [];

        let calcIdx = 0;
        for (let i = 0; i < p1.str.length; i++) {
            if (p1.str[i] === '.') {
                visualToCalcIndex[i] = -1; // Dot
            } else {
                digits1.push(parseInt(p1.str[i] === ' ' ? '0' : p1.str[i]));
                digits2.push(parseInt(p2.str[i] === ' ' ? '0' : p2.str[i]));
                visualToCalcIndex[i] = calcIdx;
                calcToVisualIndex[calcIdx] = i;
                calcIdx++;
            }
        }

        const b: { [key: number]: BorrowStep } = {};
        const chains: { [key: number]: number[] } = {};
        const workingDigits = [...digits1];

        for (let i = workingDigits.length - 1; i >= 0; i--) {
            const top = workingDigits[i];
            const bottom = digits2[i];

            if (top < bottom) {
                let borrowIndex = i - 1;
                while (borrowIndex >= 0 && workingDigits[borrowIndex] === 0) {
                    borrowIndex--;
                }

                if (borrowIndex >= 0) {
                    const chain: number[] = [];
                    const visualBorrowIndex = calcToVisualIndex[borrowIndex];
                    const visualTriggerIndex = calcToVisualIndex[i];

                    b[visualBorrowIndex] = {
                        index: visualBorrowIndex,
                        originalValue: workingDigits[borrowIndex],
                        newValue: workingDigits[borrowIndex] - 1,
                        triggeredByColumn: visualTriggerIndex
                    };
                    chain.push(visualBorrowIndex);
                    workingDigits[borrowIndex]--;

                    for (let k = borrowIndex + 1; k < i; k++) {
                        const visualK = calcToVisualIndex[k];
                        b[visualK] = {
                            index: visualK,
                            originalValue: 0,
                            newValue: 9,
                            triggeredByColumn: visualTriggerIndex
                        };
                        chain.push(visualK);
                        workingDigits[k] = 9;
                    }

                    chain.push(visualTriggerIndex);
                    chains[visualTriggerIndex] = chain;
                    workingDigits[i] += 10;
                }
            }
        }

        return {
            paddedNum1: p1,
            paddedNum2: p2,
            paddedResult: pRes,
            maxInt,
            maxDec,
            totalCols: maxInt + 1 + maxDec,
            borrows: b,
            borrowChains: chains
        };
    }, [num1, num2, result]);

    const [visibleColumns, setVisibleColumns] = useState(-1);
    const [operandVisibleIndex, setOperandVisibleIndex] = useState(-1);
    const [borrowAnimationProgress, setBorrowAnimationProgress] = useState<{ [key: number]: number }>({});

    // Use a ref to track if the effect is active to prevent state updates on unmount
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

                for (let i = 0; i < totalCols; i++) {
                    if (!isMounted.current) return;
                    setOperandVisibleIndex(i);
                    await delay(100);
                }
            } else if (stepIndex === 1) {
                setOperandVisibleIndex(totalCols);
                setVisibleColumns(0);
                setBorrowAnimationProgress({});
            } else if (stepIndex === 2) {
                setOperandVisibleIndex(totalCols);
                setVisibleColumns(-1);
                setBorrowAnimationProgress({});

                // Start from the rightmost column and move left
                for (let colIndex = totalCols - 1; colIndex >= 0; colIndex--) {
                    if (!isMounted.current) return;

                    const chain = borrowChains[colIndex];

                    // If there is a borrow chain for this column, animate it
                    if (chain && chain.length > 0) {
                        for (let progress = 0; progress <= chain.length; progress++) {
                            if (!isMounted.current) return;
                            setBorrowAnimationProgress(prev => ({ ...prev, [colIndex]: progress }));
                            await delay(800); // Wait between borrow steps
                        }
                    }

                    // Small pause before showing the result digit
                    await delay(300);

                    if (!isMounted.current) return;
                    // Show the result for this column
                    // visibleColumns logic: 0 means rightmost column is visible.
                    // 1 means rightmost 2 columns are visible, etc.
                    // So if we are at colIndex, we want visibleColumns to be (totalCols - 1 - colIndex)
                    setVisibleColumns(totalCols - 1 - colIndex);

                    // Wait before moving to the next column
                    await delay(1000);
                }
            } else if (stepIndex === 3) {
                setOperandVisibleIndex(totalCols);
                setVisibleColumns(totalCols);

                // Show all borrows fully
                const allBorrowProgress: { [key: number]: number } = {};
                Object.keys(borrowChains).forEach(key => {
                    const col = parseInt(key);
                    allBorrowProgress[col] = borrowChains[col].length + 1;
                });
                setBorrowAnimationProgress(allBorrowProgress);
            }
        };

        runAnimation();

    }, [stepIndex, totalCols, borrowChains]);

    const isDigitVisible = (index: number) => {
        // visibleColumns is how many columns from the right are visible (0-indexed)
        // e.g. if visibleColumns is 0, only the last column is visible.
        // index is from left (0) to right (totalCols-1).
        // so we want: (totalCols - 1 - index) <= visibleColumns
        if (stepIndex < 2) return false;
        return (totalCols - 1 - index) <= visibleColumns;
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

    const renderTopDigit = (char: string, index: number, originalDecLen: number) => {
        if (char === '.') {
            return <div key={index} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>;
        }

        const borrow = borrows[index];
        const showBorrowEffect = isBorrowVisible(index);
        const isPlaceholder = index > maxInt && (index - (maxInt + 1)) >= originalDecLen;

        return (
            <div key={index} className={`relative w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 border-transparent
            ${index > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
            ${isPlaceholder ? 'text-red-500' : ''}
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
            <div className="grid gap-x-1" style={{ gridTemplateColumns: `40px repeat(${maxInt}, 40px) 16px repeat(${maxDec}, 40px)` }}>

                <div className="w-10"></div>
                {paddedNum1.str.split('').map((d, i) => renderTopDigit(d, i, paddedNum1.originalDecLen))}

                <div className={`w-10 flex items-center justify-center text-3xl font-bold text-gray-400 transition-opacity duration-500 ${operandVisibleIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>-</div>
                {paddedNum2.str.split('').map((d, i) => {
                    if (d === '.') return <div key={i} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>;
                    const isPlaceholder = i > maxInt && (i - (maxInt + 1)) >= paddedNum2.originalDecLen;
                    return (
                        <div key={i} className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 border-transparent
                    ${i > operandVisibleIndex ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}
                    ${isPlaceholder ? 'text-red-500' : ''}
                 `}>
                            {d}
                        </div>
                    );
                })}

                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-700 ${operandVisibleIndex >= totalCols - 1 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                <div className="w-10"></div>
                {paddedResult.str.split('').map((d, i) => {
                    if (d === '.') return <div key={i} className="w-4 flex items-center justify-center text-3xl font-bold text-gray-400 pb-2">.</div>;
                    return (
                        <div
                            key={i}
                            className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 transform
                    ${isDigitVisible(i) ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-4'}
                    ${stepIndex >= 2 && (totalCols - 1 - i) === visibleColumns ? 'text-green-600' : stepIndex >= 2 ? 'text-blue-800' : ''}
                `}
                        >
                            {d}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DecimalSubtractionVisualizer;
