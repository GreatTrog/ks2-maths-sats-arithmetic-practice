import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Question } from '../../types';

interface DecimalLongMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number; // 0..5 based on our explanation steps
}

const DecimalLongMultiplicationVisualizer: React.FC<DecimalLongMultiplicationVisualizerProps> = ({ question, stepIndex }) => {

    // --- Data Preparation ---
    const { num1, num2, result, originalNum1, originalNum2, decimalPlaces } = useMemo(() => {
        // Extract operands. Expecting format like "4.8 x 34" or similar
        // We use a regex to capture them properly
        const matches = question.text.match(/([\d.]+)\s*×\s*([\d.]+)/);

        if (matches) {
            const n1Str = matches[1]; // e.g. "4.8"
            const n2Str = matches[2]; // e.g. "34"

            // Count decimal places
            const dp1 = (n1Str.split('.')[1] || '').length;
            const dp2 = (n2Str.split('.')[1] || '').length;
            const totalDp = dp1 + dp2;

            // Treat as integers by removing dot
            const intN1 = n1Str.replace('.', '');
            const intN2 = n2Str.replace('.', '');

            // Verify if parsing worked fine for calculation
            // Note: intResult is the integer product string
            const intResult = (parseInt(intN1) * parseInt(intN2)).toString();

            return {
                num1: intN1,     // e.g. "48"
                num2: intN2,     // e.g. "34"
                result: intResult, // e.g. "1632"
                originalNum1: n1Str,
                originalNum2: n2Str,
                decimalPlaces: totalDp
            };
        }
        return { num1: '0', num2: '0', result: '0', originalNum1: '0', originalNum2: '0', decimalPlaces: 0 };
    }, [question]);

    // Derived values for layout
    // The grid needs to be wide enough for the result + margins
    // num1.length + num2.length is a safe upper bound for result length
    const maxLength = Math.max(num1.length + num2.length, result.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedNum2 = num2.padStart(maxLength, ' ');

    // Digits for logic
    const onesDigit = parseInt(num2[num2.length - 1]);
    const tensDigit = num2.length > 1 ? parseInt(num2[num2.length - 2]) : 0;

    // --- Calculation Logic (Same as LongMultiplicationVisualizer) ---
    const { partial1, partial2, carries1, carries2, finalCarries } = useMemo(() => {
        // Partial Product 1 (num1 * onesDigit)
        const p1Digits: number[] = [];
        const c1: string[] = Array(maxLength).fill('');
        let carry = 0;
        for (let i = num1.length - 1; i >= 0; i--) {
            const digit = parseInt(num1[i]);
            const product = digit * onesDigit + carry;
            p1Digits.unshift(product % 10);
            carry = Math.floor(product / 10);

            if (carry > 0 && i > 0) {
                const carryColumnIndex = maxLength - num1.length + i - 1;
                c1[carryColumnIndex] = carry.toString();
            } else if (carry > 0 && i === 0) {
                p1Digits.unshift(carry);
            }
        }
        const p1Str = p1Digits.join('').padStart(maxLength, ' ');

        // Partial Product 2 (num1 * tensDigit)
        // Note: The zero at the end is explicit
        const p2Digits: number[] = [];
        const c2: string[] = Array(maxLength).fill('');
        carry = 0;
        for (let i = num1.length - 1; i >= 0; i--) {
            const digit = parseInt(num1[i]);
            const product = digit * tensDigit + carry;
            p2Digits.unshift(product % 10);
            carry = Math.floor(product / 10);

            if (carry > 0 && i > 0) {
                // Shifted left because of the zero
                const carryColumnIndex = maxLength - num1.length + i - 2;
                c2[carryColumnIndex] = carry.toString();
            } else if (carry > 0 && i === 0) {
                p2Digits.unshift(carry);
            }
        }
        p2Digits.push(0); // Add the zero
        const p2Str = p2Digits.join('').padStart(maxLength, ' ');

        // Final Addition Carries
        const fc: string[] = Array(maxLength).fill('');
        carry = 0;
        // Align for addition logic
        const p1Rev = p1Str.split('').reverse();
        const p2Rev = p2Str.split('').reverse();

        for (let i = 0; i < maxLength; i++) {
            const d1 = parseInt(p1Rev[i] === ' ' ? '0' : p1Rev[i]);
            const d2 = parseInt(p2Rev[i] === ' ' ? '0' : p2Rev[i]);
            const sum = d1 + d2 + carry;
            if (sum >= 10) {
                carry = 1;
                if (i + 1 < maxLength) {
                    fc[maxLength - 2 - i] = '1';
                }
            } else {
                carry = 0;
            }
        }

        return {
            partial1: p1Str,
            partial2: p2Str,
            carries1: c1,
            carries2: c2,
            finalCarries: fc
        };
    }, [num1, onesDigit, tensDigit, maxLength]);

    const paddedResult = result.padStart(maxLength, ' ');

    // --- Animation State ---
    const [animState, setAnimState] = useState({
        step1Col: -1, // Ones Mult Progress
        step3Col: -1, // Tens Mult Progress
        step3AddCol: -1, // Addition Progress
        showPartial1: false,
        showPartial2Zero: false,
        showPartial2: false,
        showFinalAddition: false,

        // Decimal Shift State
        shiftProgress: 0,
    });

    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    // Helper for async delays
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => {
        // Stop any running intervals/timeouts when effect re-runs?
        // We'll use a simple state-based logic here.

        // Reset states relevant to stepIndex
        if (stepIndex === 0) {
            // STEP 0: Setup / Ignore decimals
            // Show nothing but the problem
            setAnimState(prev => ({ ...prev, step1Col: -1, showPartial1: false }));
        }
        else if (stepIndex === 1) {
            // STEP 1: Multiply Ones
            // Need to animate step1Col from 0 to num1.length
            setAnimState(prev => ({ ...prev, showPartial1: true, step1Col: 0 }));

            // We use a local variable to avoid closure staleness if we were using intervals,
            // but here we just need to restart the animation if stepIndex changes to 1.
            let current = 0;
            const interval = setInterval(() => {
                if (!isMounted.current) return clearInterval(interval);
                if (current < num1.length) {
                    current++;
                    setAnimState(prev => ({ ...prev, step1Col: current }));
                } else {
                    clearInterval(interval);
                }
            }, 1000); // Slower speed
            return () => clearInterval(interval);
        }
        else if (stepIndex === 2) {
            // STEP 2: Place Zero
            // Ensure step 1 is fully shown
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1,
                showPartial1: true,
                showPartial2Zero: true
            }));
        }
        else if (stepIndex === 3) {
            // STEP 3: Multiply Tens (Excluding Addition)
            // Ensure step 2 state
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1,
                showPartial1: true,
                showPartial2Zero: true,
                showPartial2: true,
                step3Col: 0
            }));

            let current = 0;
            const interval = setInterval(() => {
                if (!isMounted.current) return clearInterval(interval);
                if (current < num1.length) {
                    current++;
                    setAnimState(prev => ({ ...prev, step3Col: current }));
                } else {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
        else if (stepIndex === 4) {
            // STEP 4: Add Rows
            // Ensure step 3 state
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1,
                showPartial1: true,
                showPartial2Zero: true,
                showPartial2: true,
                step3Col: num1.length + 1,
                showFinalAddition: true,
                step3AddCol: 0
            }));

            let current = 0;
            const interval = setInterval(() => {
                if (!isMounted.current) return clearInterval(interval);
                // We add up to maxLength columns
                if (current < maxLength) {
                    current++;
                    setAnimState(prev => ({ ...prev, step3AddCol: current }));
                } else {
                    clearInterval(interval);
                }
            }, 800);
            return () => clearInterval(interval);
        }
        else if (stepIndex === 5) {
            // STEP 5: Place Decimal
            // Ensure everything prior is done
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1,
                showPartial1: true,
                showPartial2Zero: true,
                showPartial2: true,
                step3Col: num1.length + 1,
                showFinalAddition: true,
                step3AddCol: maxLength + 1,
                shiftProgress: 0
            }));

            const runShift = async () => {
                await delay(1000);
                for (let i = 1; i <= decimalPlaces; i++) {
                    if (!isMounted.current) return;
                    setAnimState(prev => ({ ...prev, shiftProgress: i }));
                    await delay(800);
                }
            };
            runShift();
        }
    }, [stepIndex, num1.length, maxLength, decimalPlaces]);

    // --- Visualization Helpers ---

    const getDigitStyle = (row: 'top' | 'bottom' | 'p1' | 'p2' | 'res', index: number, char: string) => {
        const reverseIndex = maxLength - 1 - index;

        // Step 1: Multiply by ones highlighting
        if (stepIndex === 1 && animState.step1Col >= 0 && animState.step1Col < num1.length) {
            const targetColumnIndex = maxLength - 1 - animState.step1Col;
            if (row === 'top' && index === targetColumnIndex) return 'bg-yellow-300 border-yellow-500 scale-110';
            if (row === 'bottom' && index === maxLength - 1) return 'bg-yellow-300 border-yellow-500 scale-110';
        }

        // Step 3: Multiply by tens highlighting
        if (stepIndex === 3 && animState.step3Col >= 0 && animState.step3Col < num1.length) {
            const targetColumnIndex = maxLength - 1 - animState.step3Col;
            if (row === 'top' && index === targetColumnIndex) return 'bg-yellow-300 border-yellow-500 scale-110';
            if (row === 'bottom' && index === maxLength - 2) return 'bg-yellow-300 border-yellow-500 scale-110';
        }

        // Step 4: Addition highlighting
        if (stepIndex === 4 && animState.step3AddCol >= 0) {
            if (reverseIndex === animState.step3AddCol) {
                if (row === 'p1' || row === 'p2') return 'bg-blue-100 border-blue-300';
            }
        }

        // Step 2: Red zero
        if (stepIndex >= 2 && row === 'p2' && index === maxLength - 1 && char === '0') {
            return 'text-red-500 font-bold';
        }

        // Final Answer (Step 4 & 5)
        if (stepIndex >= 4 && row === 'res') {
            // No special highlighting usually, unless animating addition logic
        }

        return 'border-transparent';
    };

    const renderDigit = (char: string, index: number, row: 'top' | 'bottom' | 'p1' | 'p2' | 'res') => (
        <div
            key={`${row}-${index}`}
            className={`w-10 h-12 flex items-center justify-center text-3xl font-mono font-bold rounded transition-all duration-500 border-2 ${getDigitStyle(row, index, char)}`}
        >
            {char}
        </div>
    );

    // Visibility Logic
    const isP1Visible = (index: number) => {
        if (stepIndex > 1) return true;
        if (stepIndex < 1) return false;
        const reverseIndex = maxLength - 1 - index;
        return animState.step1Col >= reverseIndex;
    };

    const isP2Visible = (index: number) => {
        if (stepIndex > 3) return true;
        if (stepIndex < 2) return false;

        // Zero visible at step 2
        if (stepIndex === 2 && index === maxLength - 1) return true;
        if (stepIndex === 2) return false; // Only zero

        // Step 3: Multiplication
        const reverseIndex = maxLength - 1 - index;
        if (index === maxLength - 1) return true; // Zero
        // Digits appear as we process (shifted by 1)
        return animState.step3Col >= (reverseIndex - 1);
    };

    const isResVisible = (index: number) => {
        if (stepIndex > 4) return true;
        if (stepIndex < 4) return false;

        const reverseIndex = maxLength - 1 - index;
        return animState.step3AddCol >= reverseIndex;
    };

    // --- Final Step: Decimal Place Value Grid ---
    // Copied and adapted from DecimalMultiplicationVisualizer
    const renderPlaceValueGrid = () => {
        const digits = result.split('');
        const numDigits = digits.length;
        const maxPower = numDigits - 1;
        const minPower = -decimalPlaces;

        const columns: { label: string, power: number, isDot?: boolean }[] = [];
        for (let p = maxPower; p >= minPower; p--) {
            let label = '';
            if (p >= 0) label = Math.pow(10, p).toString();
            else label = `1/${Math.pow(10, -p)}`;
            columns.push({ label, power: p });
        }
        // Insert dot
        const dotIndex = columns.findIndex(c => c.power === 0) + 1;
        if (dotIndex > 0) columns.splice(dotIndex, 0, { label: '.', power: -0.5, isDot: true });

        return (
            <div className="flex flex-col items-center animate-fade-in w-full overflow-x-auto mt-4">
                <div className="mb-4 text-center">
                    <p className="text-gray-600 font-bold text-blue-600 transition-opacity duration-500" style={{ opacity: animState.shiftProgress > 0 ? 1 : 0 }}>
                        Move decimal point {decimalPlaces} place{decimalPlaces !== 1 ? 's' : ''} from the right
                    </p>
                </div>
                <div className="grid gap-0 border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(50px, 60px))` }}>
                    {/* Headers */}
                    {columns.map((col, i) => (
                        <div key={i} className={`flex items-center justify-center h-10 font-bold text-gray-500 text-xs sm:text-sm bg-gray-100 border-b border-r border-gray-200 last:border-r-0 ${col.isDot ? 'text-xl text-gray-800' : ''}`}>
                            {col.label}
                        </div>
                    ))}
                    {/* Grid Content */}
                    <div className="col-span-full relative h-24 bg-white">
                        {/* Lines */}
                        <div className="absolute inset-0 grid w-full h-full" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(50px, 60px))` }}>
                            {columns.map((col, i) => (
                                <div key={i} className={`border-r border-gray-100 h-full last:border-r-0 ${col.isDot ? 'bg-gray-50/50' : ''}`}></div>
                            ))}
                        </div>
                        {/* Fixed Dot */}
                        {columns.map((col, i) => col.isDot && (
                            <div key="fixed-dot" className="absolute top-0 bottom-0 flex items-center justify-center text-4xl font-bold text-gray-800 z-10"
                                style={{
                                    left: `${(i / columns.length) * 100}%`,
                                    width: `${(1 / columns.length) * 100}%`
                                }}>.</div>
                        ))}
                        {/* Animating Digits and Dot */}
                        {digits.map((d, i) => {
                            // Logic: In integer form (shift=0), the rightmost digit is at power 0.
                            // As shift increases, we move the decimal point... No, we move the DIGITS in valid math,
                            // or we move the decimal point?
                            // Explanation says "Move the decimal point".
                            // BUT standard visualizer usually moves digits to the right to make number smaller.
                            // Let's stick to "Move decimal point" logic if easier, or move digits to align with existing visualizer.
                            // The existing DecimalMultiplicationVisualizer moved DIGITS.
                            // "Move digits {decimalPlaces} places to the right" (Wait, that makes it smaller?)
                            // Yes, 48 * 34 = 1632. 4.8 * 3.4 ...
                            // Wait, existing visualizer said: "Move digits ... to the right".
                            // Digits move right -> value decreases. 100 becomes 10. Correct.

                            // Let's calculate the position based on shiftProgress.
                            // Base position: Rightmost digit (last index) is at Power 0.
                            // Digit Power = (numDigits - 1 - i).
                            // Adjusted Power = Digit Power - shiftProgress.

                            const currentPower = (numDigits - 1 - i) - animState.shiftProgress;
                            let colIndex = maxPower - currentPower;
                            // Adjust for dot column
                            if (currentPower < 0) colIndex += 1;

                            const leftPercent = (colIndex / columns.length) * 100;
                            const widthPercent = (1 / columns.length) * 100;

                            return (
                                <div key={i} className="absolute top-0 bottom-0 flex items-center justify-center transition-all duration-700 ease-in-out"
                                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}>
                                    <span className="text-3xl sm:text-4xl font-mono font-bold text-blue-600">{d}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    if (stepIndex === 5) {
        return (
            <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 min-h-[400px] justify-center">
                <div className="text-lg font-bold text-gray-700 mb-4">
                    <span className="text-2xl font-mono">{originalNum1} × {originalNum2}</span>
                </div>
                {renderPlaceValueGrid()}
            </div>
        );
    }

    // Default View (Long Multiplication Grid)
    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
            {/* Header showing what we are doing */}
            <div className="mb-4 text-gray-500 font-medium text-sm">
                Ignoring decimal points: {num1} × {num2}
            </div>

            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxLength + 1}, minmax(0, 1fr))` }}>

                {/* Row 1: Top Number */}
                <div className="w-10"></div>
                {paddedNum1.split('').map((d, i) => renderDigit(d, i, 'top'))}

                {/* Row 2: Bottom Number */}
                <div className="w-10 flex items-center justify-center text-3xl font-bold text-gray-400">×</div>
                {paddedNum2.split('').map((d, i) => renderDigit(d, i, 'bottom'))}

                {/* Divider */}
                <div className="col-span-full border-b-4 border-gray-800 my-2"></div>

                {/* Partial Product 1 */}
                <div className="w-10"></div>
                {partial1.split('').map((d, i) => (
                    <div key={`p1-${i}`} className={`transition-opacity duration-300 ${isP1Visible(i) ? 'opacity-100' : 'opacity-0'}`}>
                        {renderDigit(d, i, 'p1')}
                    </div>
                ))}

                {/* Carries for Partial Product 1 */}
                <div className="w-10"></div>
                {carries1.map((c, i) => {
                    const isVisible = stepIndex <= 1 && animState.step1Col >= (maxLength - 1 - i) - 1 && !!c;
                    return (
                        <div key={`c1-${i}`} className={`w-10 h-6 flex items-center justify-center text-xs font-bold text-blue-500 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                            {c}
                        </div>
                    );
                })}

                {/* Partial Product 2 */}
                <div className="w-10 flex items-center justify-center text-3xl font-bold text-gray-400">+</div>
                {partial2.split('').map((d, i) => (
                    <div key={`p2-${i}`} className={`transition-opacity duration-300 ${isP2Visible(i) ? 'opacity-100' : 'opacity-0'}`}>
                        {renderDigit(d, i, 'p2')}
                    </div>
                ))}

                {/* Carries for Partial Product 2 */}
                <div className="w-10"></div>
                {carries2.map((c, i) => {
                    // Shifted by 2 because of zero
                    const isVisible = stepIndex === 3 && animState.step3Col >= (maxLength - 1 - i) - 2 && !!c;
                    return (
                        <div key={`c2-${i}`} className={`w-10 h-6 flex items-center justify-center text-xs font-bold text-blue-500 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                            {c}
                        </div>
                    );
                })}

                {/* Divider */}
                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-500 ${stepIndex >= 4 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                {/* Final Result (Integer) */}
                <div className="w-10"></div>
                {paddedResult.split('').map((d, i) => (
                    <div key={`res-${i}`} className={`transition-opacity duration-300 ${isResVisible(i) ? 'opacity-100' : 'opacity-0'}`}>
                        {renderDigit(d, i, 'res')}
                    </div>
                ))}

                {/* Addition Carries (Below) */}
                <div className="w-10"></div>
                {finalCarries.map((c, i) => (
                    <div key={`fc-${i}`} className={`w-10 h-8 flex items-center justify-center text-sm font-bold text-red-500 transition-all duration-500 transform
                        ${stepIndex >= 4 && animState.step3AddCol >= (maxLength - 1 - i) - 1 && c ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        {c}
                    </div>
                ))}

            </div>
            <div className="h-6 mt-1 text-xs font-bold text-gray-400">
                {stepIndex >= 4 && "Addition carries shown below"}
            </div>
        </div>
    );
};

export default DecimalLongMultiplicationVisualizer;
