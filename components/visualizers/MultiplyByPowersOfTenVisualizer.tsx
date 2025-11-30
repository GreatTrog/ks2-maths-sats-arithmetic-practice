import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface MultiplyByPowersOfTenVisualizerProps {
    question: Question;
    stepIndex: number;
}

const PLACE_VALUES = [
    { label: 'M', value: 1000000, color: 'bg-purple-200 border-purple-400' },
    { label: 'HTh', value: 100000, color: 'bg-indigo-200 border-indigo-400' },
    { label: 'TTh', value: 10000, color: 'bg-blue-200 border-blue-400' },
    { label: 'Th', value: 1000, color: 'bg-cyan-200 border-cyan-400' },
    { label: 'H', value: 100, color: 'bg-teal-200 border-teal-400' },
    { label: 'T', value: 10, color: 'bg-green-200 border-green-400' },
    { label: 'O', value: 1, color: 'bg-lime-200 border-lime-400' },
    { label: '•', value: 0, color: 'bg-gray-100 border-gray-300' }, // Decimal point
    { label: 't', value: 0.1, color: 'bg-yellow-200 border-yellow-400' },
    { label: 'h', value: 0.01, color: 'bg-orange-200 border-orange-400' },
    { label: 'th', value: 0.001, color: 'bg-red-200 border-red-400' },
];

const MultiplyByPowersOfTenVisualizer: React.FC<MultiplyByPowersOfTenVisualizerProps> = ({ question, stepIndex }) => {
    // Parse question
    const { startNum, multiplier, resultNum } = useMemo(() => {
        const parts = question.text.split(' ');
        const start = parseFloat(parts[0]);
        const mult = parseFloat(parts[2]);
        const res = parseFloat(question.answer);
        return { startNum: start, multiplier: mult, resultNum: res };
    }, [question]);

    // Determine shift amount (log10 of multiplier)
    const shiftAmount = useMemo(() => {
        return Math.log10(multiplier);
    }, [multiplier]);

    // Determine active columns
    const activeColumns = useMemo(() => {
        const maxVal = Math.max(startNum, resultNum);

        const getDecimalPlaces = (n: number) => {
            const s = n.toString();
            if (s.indexOf('.') === -1) return 0;
            return s.length - s.indexOf('.') - 1;
        };

        const maxDecimals = Math.max(getDecimalPlaces(startNum), getDecimalPlaces(resultNum));
        const minVal = Math.pow(0.1, maxDecimals);

        // Find the largest place value needed
        // e.g. 4520 -> 1000
        const maxPlace = Math.pow(10, Math.floor(Math.log10(maxVal || 1)));
        // Find smallest place value needed
        const minPlace = Math.pow(10, -maxDecimals);

        return PLACE_VALUES.filter(pv => {
            if (pv.label === '•') return maxDecimals > 0; // Only show decimal point if decimals exist
            // Include columns between maxPlace*10 (for safety/carry) and minPlace
            // But strictly, we just need to cover the range.
            return pv.value <= maxPlace * 10 && pv.value >= minPlace;
        });
    }, [startNum, resultNum]);

    // State for animation
    const [animState, setAnimState] = useState<'initial' | 'moving' | 'final'>('initial');

    useEffect(() => {
        if (stepIndex <= 1) setAnimState('initial');
        if (stepIndex === 2) setAnimState('moving');
        if (stepIndex >= 3) setAnimState('final');
    }, [stepIndex]);

    // Helper to get digits for a number in specific columns
    const getDigits = (num: number) => {
        const s = parseFloat(num.toString()).toString();
        const split = s.split('.');
        const whole = split[0];
        const decimal = split[1] || '';

        const digitMap: { [key: string]: number } = {};

        // Map whole number parts
        for (let i = 0; i < whole.length; i++) {
            const power = whole.length - 1 - i;
            const val = Math.pow(10, power);
            digitMap[val] = parseInt(whole[i]);
        }

        // Map decimal parts
        for (let i = 0; i < decimal.length; i++) {
            const power = -(i + 1);
            // Floating point math is tricky, use fixed precision for keys
            const val = parseFloat(Math.pow(10, power).toFixed(10));
            digitMap[val] = parseInt(decimal[i]);
        }
        return digitMap;
    };

    const startDigits = useMemo(() => getDigits(startNum), [startNum]);
    const resultDigits = useMemo(() => getDigits(resultNum), [resultNum]);

    // Animation constants (must match Tailwind classes used below)
    const COL_WIDTH = 80; // w-20 = 5rem = 80px
    const DOT_WIDTH = 16; // w-4 = 1rem = 16px
    const GAP = 4;        // gap-1 = 0.25rem = 4px

    const getColumnWidth = (label: string) => label === '•' ? DOT_WIDTH : COL_WIDTH;

    const getShiftPx = (colValue: number) => {
        const currentIdx = activeColumns.findIndex(c => c.value === colValue);
        const targetValue = colValue * multiplier;
        // Find closest column for target (floating point safety)
        const targetIdx = activeColumns.findIndex(c => Math.abs(c.value - targetValue) < 0.00001);

        if (currentIdx === -1 || targetIdx === -1) return 0;

        // Calculate center of current column
        let currentX = 0;
        for (let i = 0; i < currentIdx; i++) currentX += getColumnWidth(activeColumns[i].label) + GAP;
        const currentCenter = currentX + getColumnWidth(activeColumns[currentIdx].label) / 2;

        // Calculate center of target column
        let targetX = 0;
        for (let i = 0; i < targetIdx; i++) targetX += getColumnWidth(activeColumns[i].label) + GAP;
        const targetCenter = targetX + getColumnWidth(activeColumns[targetIdx].label) / 2;

        // Return difference (target - current). 
        // Since we are moving left (to higher place values), and higher place values are at lower indices (left side),
        // targetX should be smaller than currentX, resulting in a negative value, which is correct for translateX left.
        return targetCenter - currentCenter;
    };

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-3xl shadow-lg border-2 border-gray-100 overflow-x-auto max-w-full">
            <div className="flex gap-1">
                {activeColumns.map((col) => {
                    if (col.label === '•') {
                        return (
                            <div key={col.label} className="flex flex-col items-center justify-end pb-4 w-4 flex-none">
                                <div className="text-4xl font-bold text-gray-400">.</div>
                            </div>
                        );
                    }

                    const digit = startDigits[col.value];
                    const finalDigit = resultDigits[col.value];
                    const count = digit || 0;

                    // Check if this column is a placeholder zero in the result
                    // It is a placeholder if it wasn't present in startDigits (shifted) but is 0 in resultDigits
                    const isPlaceholder = animState === 'final' && finalDigit === 0 && !startDigits[col.value / multiplier];
                    const showPlaceholderRed = isPlaceholder;

                    const shiftPx = getShiftPx(col.value);

                    return (
                        <div key={col.label} className={`flex flex-col items-center border-2 rounded-xl p-2 w-20 flex-none transition-colors duration-300 ${col.color}`}>
                            <div className="text-xs font-bold text-gray-500 uppercase mb-2">{col.label}</div>

                            <div className="h-40 w-full relative flex flex-col-reverse items-center gap-1">
                                {/* Counters */}
                                {animState !== 'final' && Array.from({ length: count }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded-full shadow-sm border border-black/20 flex items-center justify-center text-[10px] font-bold text-white
                                            ${col.value >= 1 ? 'bg-blue-500' : 'bg-orange-500'}
                                            transition-transform duration-1000 ease-in-out
                                        `}
                                        style={{
                                            transform: animState === 'moving' ? `translateX(${shiftPx}px)` : 'none',
                                        }}
                                    >
                                        1
                                    </div>
                                ))}

                                {/* Final Digit */}
                                {animState === 'final' && (
                                    <div className={`text-4xl font-bold ${showPlaceholderRed ? 'text-red-500 animate-bounce' : 'text-gray-800'}`}>
                                        {(() => {
                                            const isWholeColumn = col.value >= 1;
                                            const digitHere = finalDigit;

                                            // Check if any fractional column to the right has a non-zero digit
                                            const hasRightNonZeroFraction = activeColumns.some((c) => {
                                                if (c.value <= 0 || c.value >= 1) return false;
                                                if (c.value < col.value) {
                                                    const d = resultDigits[c.value];
                                                    return d !== undefined && d !== 0;
                                                }
                                                return false;
                                            });

                                            if (digitHere !== undefined) return digitHere;

                                            if (isWholeColumn) {
                                                return col.value < resultNum ? 0 : '';
                                            }

                                            return hasRightNonZeroFraction ? 0 : '';
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-center text-gray-500 font-medium">
                {animState === 'initial' && "Represent the number with counters..."}
                {animState === 'moving' && `Multiply by ${multiplier}: Move digits ${shiftAmount} place${shiftAmount > 1 ? 's' : ''} left.`}
                {animState === 'final' && "Fill empty columns with placeholder zeros."}
            </div>
        </div>
    );
};

export default MultiplyByPowersOfTenVisualizer;
