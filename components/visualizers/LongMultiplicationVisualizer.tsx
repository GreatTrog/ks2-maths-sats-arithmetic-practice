import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';

interface LongMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number;
}

const LongMultiplicationVisualizer: React.FC<LongMultiplicationVisualizerProps> = ({ question, stepIndex }) => {
    const { num1, num2, result } = useMemo(() => {
        const matches = question.text.match(/(\d+)\s*×\s*(\d+)/);
        if (matches) {
            return { num1: matches[1], num2: matches[2], result: question.answer };
        }
        return { num1: '0', num2: '0', result: '0' };
    }, [question]);

    const maxLength = Math.max(num1.length + num2.length, result.length);
    const paddedNum1 = num1.padStart(maxLength, ' ');
    const paddedNum2 = num2.padStart(maxLength, ' ');

    // Parse digits
    const onesDigit = parseInt(num2[num2.length - 1]);
    const tensDigit = num2.length > 1 ? parseInt(num2[num2.length - 2]) : 0;

    // Calculate partial products
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
                // Carry for the most significant digit becomes part of the product
                p1Digits.unshift(carry);
            }
        }
        const p1Str = p1Digits.join('').padStart(maxLength, ' ');

        // Partial Product 2 (num1 * tensDigit)
        const p2Digits: number[] = [];
        const c2: string[] = Array(maxLength).fill('');
        carry = 0;
        for (let i = num1.length - 1; i >= 0; i--) {
            const digit = parseInt(num1[i]);
            const product = digit * tensDigit + carry;
            p2Digits.unshift(product % 10);
            carry = Math.floor(product / 10);

            if (carry > 0 && i > 0) {
                const carryColumnIndex = maxLength - num1.length + i - 2; // Shifted left because of the zero
                c2[carryColumnIndex] = carry.toString();
            } else if (carry > 0 && i === 0) {
                p2Digits.unshift(carry);
            }
        }
        // Add the zero at the end
        p2Digits.push(0);
        const p2Str = p2Digits.join('').padStart(maxLength, ' ');

        // Final Addition Carries
        const fc: string[] = Array(maxLength).fill('');
        carry = 0;
        const p1Val = parseInt(p1Digits.join(''));
        const p2Val = parseInt(p2Digits.join(''));
        // We can just calculate carries based on the strings to align them
        const p1Rev = p1Str.split('').reverse();
        const p2Rev = p2Str.split('').reverse();

        for (let i = 0; i < maxLength; i++) {
            const d1 = parseInt(p1Rev[i] === ' ' ? '0' : p1Rev[i]);
            const d2 = parseInt(p2Rev[i] === ' ' ? '0' : p2Rev[i]);
            const sum = d1 + d2 + carry;
            if (sum >= 10) {
                carry = 1;
                // Carry goes to the next column (left)
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

    // Animation States
    const [animState, setAnimState] = useState({
        step1Col: -1, // Column being multiplied in step 1
        step3Col: -1, // Column being multiplied in step 3
        step3AddCol: -1, // Column being added in step 3 (after multiplication)
        showPartial1: false,
        showPartial2Zero: false,
        showPartial2: false,
        showFinal: false
    });

    useEffect(() => {
        // Reset state on step change
        if (stepIndex === 0) {
            // Step 1: Multiply by ones digit
            setAnimState(prev => ({ ...prev, step1Col: 0, showPartial1: true }));

            const interval = setInterval(() => {
                setAnimState(prev => {
                    if (prev.step1Col < num1.length) {
                        return { ...prev, step1Col: prev.step1Col + 1 };
                    } else {
                        clearInterval(interval);
                        return prev;
                    }
                });
            }, 1500);
            return () => clearInterval(interval);
        }
        else if (stepIndex === 1) {
            // Step 2: Place zero
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1, // Finished
                showPartial2Zero: true
            }));
        }
        else if (stepIndex === 2) {
            // Step 3: Multiply by tens digit
            // First animate multiplication
            setAnimState(prev => ({ ...prev, showPartial2: true, step3Col: 0, step3AddCol: -1 }));

            const interval = setInterval(() => {
                setAnimState(prev => {
                    // Multiplication Phase
                    if (prev.step3Col < num1.length) {
                        return { ...prev, step3Col: prev.step3Col + 1 };
                    }
                    // End of Multiplication Phase
                    else {
                        clearInterval(interval);
                        // Signal ready for addition
                        return { ...prev, step3Col: num1.length + 1, step3AddCol: 0 };
                    }
                });
            }, 1500);
            return () => clearInterval(interval);
        }
        else if (stepIndex === 3) {
            // Step 4: Final Answer
            setAnimState(prev => ({
                ...prev,
                step1Col: num1.length + 1,
                step3Col: num1.length + 1,
                step3AddCol: maxLength + 1,
                showFinal: true
            }));
        }
    }, [stepIndex, num1.length, maxLength]);

    // Separate effect for Addition Phase in Step 3
    useEffect(() => {
        if (stepIndex === 2 && animState.step3Col > num1.length) {
            const addInterval = setInterval(() => {
                setAnimState(prev => {
                    if (prev.step3AddCol < maxLength) {
                        return { ...prev, step3AddCol: prev.step3AddCol + 1 };
                    } else {
                        clearInterval(addInterval);
                        return prev;
                    }
                });
            }, 800);
            return () => clearInterval(addInterval);
        }
    }, [stepIndex, animState.step3Col, num1.length, maxLength]);

    const getDigitStyle = (row: 'top' | 'bottom' | 'p1' | 'p2' | 'res', index: number, char: string) => {
        const reverseIndex = maxLength - 1 - index;

        // Step 1: Multiply by ones
        if (stepIndex === 0 && animState.step1Col >= 0 && animState.step1Col < num1.length) {
            // animState.step1Col is 0 for the rightmost digit of num1
            const targetColumnIndex = maxLength - 1 - animState.step1Col;

            if (row === 'top' && index === targetColumnIndex) return 'bg-yellow-300 border-yellow-500 scale-110';
            if (row === 'bottom' && index === maxLength - 1) return 'bg-yellow-300 border-yellow-500 scale-110';
        }

        // Step 3: Multiply by tens
        if (stepIndex === 2 && animState.step3Col >= 0 && animState.step3Col < num1.length) {
            const targetColumnIndex = maxLength - 1 - animState.step3Col;

            if (row === 'top' && index === targetColumnIndex) return 'bg-yellow-300 border-yellow-500 scale-110';
            if (row === 'bottom' && index === maxLength - 2) return 'bg-yellow-300 border-yellow-500 scale-110';
        }

        // Step 3: Addition phase
        if (stepIndex === 2 && animState.step3Col >= num1.length) {
            // Highlight columns being added
            if (reverseIndex === animState.step3AddCol) {
                if (row === 'p1' || row === 'p2') return 'bg-blue-100 border-blue-300';
            }
        }

        // Step 4: Final Answer
        if (stepIndex === 3 && row === 'res') {
            return 'bg-green-100 border-green-300 text-green-600';
        }

        // Step 2: Red zero
        if (stepIndex >= 1 && row === 'p2' && index === maxLength - 1 && char === '0') {
            return 'text-red-500 font-bold';
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

    // Visibility Helpers
    const isP1Visible = (index: number) => {
        if (stepIndex > 0) return true;
        const reverseIndex = maxLength - 1 - index;
        // Show digits as we process them
        return animState.step1Col >= reverseIndex;
    };

    const isP2Visible = (index: number) => {
        if (stepIndex > 2) return true;
        if (stepIndex < 1) return false;
        if (stepIndex === 1) return index === maxLength - 1; // Only show zero

        // Step 3
        const reverseIndex = maxLength - 1 - index;
        if (index === maxLength - 1) return true; // Zero always visible
        // Show digits as we process them (shifted by 1 because of zero)
        return animState.step3Col >= (reverseIndex - 1);
    };

    const isResVisible = (index: number) => {
        if (stepIndex === 3) return true;
        if (stepIndex < 2) return false;
        if (animState.step3Col < num1.length) return false; // Still multiplying

        const reverseIndex = maxLength - 1 - index;
        return animState.step3AddCol >= reverseIndex;
    };

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100">
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
                    // Shifted by 2 because of zero and carry position
                    const isVisible = stepIndex === 2 && animState.step3Col >= (maxLength - 1 - i) - 2 && !!c;
                    return (
                        <div key={`c2-${i}`} className={`w-10 h-6 flex items-center justify-center text-xs font-bold text-blue-500 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                            {c}
                        </div>
                    );
                })}

                {/* Divider */}
                <div className={`col-span-full border-b-4 border-gray-800 my-2 transition-all duration-500 ${stepIndex >= 2 ? 'w-full opacity-100' : 'w-0 opacity-0'}`}></div>

                {/* Final Result */}
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
                        ${stepIndex >= 2 && animState.step3AddCol >= (maxLength - 1 - i) - 1 && c ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                    `}>
                        {c}
                    </div>
                ))}

            </div>
            <div className="h-6 mt-1 text-xs font-bold text-gray-400">
                {stepIndex >= 2 && "Addition carries shown below"}
            </div>
        </div>
    );
};

export default LongMultiplicationVisualizer;
