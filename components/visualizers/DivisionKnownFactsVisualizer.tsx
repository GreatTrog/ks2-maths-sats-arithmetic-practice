import React, { useMemo, useEffect, useState } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface DivisionKnownFactsVisualizerProps {
    question: Question;
    stepIndex: number;
}

const DivisionKnownFactsVisualizer: React.FC<DivisionKnownFactsVisualizerProps> = ({ question, stepIndex }) => {
    const { dividend, divisor, baseDividend, baseAnswer, powerOf10, zerosCount } = useMemo(() => {
        const numbers = question.text.match(/(\d+)/g) || [];
        const dividendStr = numbers[0];
        const divisorStr = numbers[1];
        const divisorVal = parseInt(divisorStr);

        let baseDividendVal = parseInt(dividendStr);
        const nonZeroMatch = dividendStr.match(/^(\d+?)0*$/);

        if (nonZeroMatch) {
            const prefix = parseInt(nonZeroMatch[1]);
            if (prefix % divisorVal === 0) {
                baseDividendVal = prefix;
            } else {
                let temp = prefix;
                let originalStr = nonZeroMatch[1];
                let zeros = dividendStr.length - originalStr.length;
                for (let i = 0; i < zeros; i++) {
                    temp = temp * 10;
                    if (temp % divisorVal === 0) {
                        baseDividendVal = temp;
                        break;
                    }
                }
            }
        }

        const baseAnswerVal = baseDividendVal / divisorVal;
        const powerOf10Val = parseInt(dividendStr) / baseDividendVal;
        const zerosCountVal = Math.log10(powerOf10Val);

        return {
            dividend: dividendStr,
            divisor: divisorStr,
            baseDividend: baseDividendVal,
            baseAnswer: baseAnswerVal,
            powerOf10: powerOf10Val,
            zerosCount: zerosCountVal
        };
    }, [question]);

    // Animation states
    const [showZerosInLockBox, setShowZerosInLockBox] = useState(false);
    const [showBaseFact, setShowBaseFact] = useState(false);
    const [showCounters, setShowCounters] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const [moveZerosBack, setMoveZerosBack] = useState(false);
    const [showFinalAnswer, setShowFinalAnswer] = useState(false);

    useEffect(() => {
        // Reset states when step changes
        if (stepIndex === 0) {
            setShowZerosInLockBox(false);
            setShowBaseFact(false);
            setShowCounters(false);
            setShowGroups(false);
            setMoveZerosBack(false);
            setShowFinalAnswer(false);

            // Step 1 Animation sequence
            const t1 = setTimeout(() => setShowZerosInLockBox(true), 1500);
            return () => { clearTimeout(t1); };
        } else if (stepIndex === 1) {
            setShowZerosInLockBox(true);
            setShowBaseFact(false);
            setShowCounters(true);
            setMoveZerosBack(false); // Reset to ensure zeros stay in lock box when stepping back
            // Step 2 Animation
            const t1 = setTimeout(() => setShowGroups(true), 1000);
            const t2 = setTimeout(() => setShowBaseFact(true), 2000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        } else if (stepIndex === 2) {
            setShowZerosInLockBox(true);
            setShowBaseFact(true);
            setShowCounters(false); // Hide counters to focus on numbers
            setShowGroups(false);
            setMoveZerosBack(false); // Reset to ensure zeros go back to lock box when stepping back
            // Step 3 Animation
            const t1 = setTimeout(() => setMoveZerosBack(true), 1000);
            return () => clearTimeout(t1);
        } else if (stepIndex === 3) {
            setShowZerosInLockBox(false); // Zeros are back
            setShowBaseFact(true);
            setMoveZerosBack(true);
            setShowFinalAnswer(true);
        }
    }, [stepIndex]);

    return (
        <div className="p-4 bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-h-[400px] w-[400px] mx-auto relative overflow-hidden">

            {/* Counters Visualization (Step 2) */}
            <div className="w-full min-h-[160px] flex items-center justify-center mb-6">
                <AnimatePresence mode='wait'>
                    {showCounters && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col gap-1 p-2"
                        >
                            {baseDividend <= 144 ? (
                                Array.from({ length: parseInt(divisor) }).map((_, rowIndex) => (
                                    <motion.div
                                        key={rowIndex}
                                        layout
                                        initial={{ scale: 0 }}
                                        animate={{
                                            scale: 1,
                                            gap: showGroups ? '0.5rem' : '0.25rem',
                                            padding: showGroups ? '0.5rem' : '0',
                                        }}
                                        transition={{
                                            layout: { duration: 0.5, ease: "easeInOut" },
                                            gap: { duration: 0.5, ease: "easeInOut" },
                                            padding: { duration: 0.5, ease: "easeInOut" }
                                        }}
                                        className={`flex items-center justify-center ${showGroups ? 'rounded-lg border-2' : ''}`}
                                        style={{
                                            borderColor: showGroups ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][rowIndex % 6] : undefined,
                                            backgroundColor: showGroups ? 'rgba(0,0,0,0.02)' : undefined,
                                            transition: 'border-color 0.5s ease-in-out, background-color 0.5s ease-in-out'
                                        }}
                                    >
                                        {Array.from({ length: baseAnswer }).map((_, colIndex) => (
                                            <motion.div
                                                key={colIndex}
                                                layout
                                                initial={{ scale: 0 }}
                                                animate={{
                                                    scale: 1,
                                                    backgroundColor: showGroups
                                                        ? ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][rowIndex % 6]
                                                        : '#9CA3AF',
                                                }}
                                                transition={{
                                                    layout: { duration: 0.5, ease: "easeInOut" },
                                                    backgroundColor: { duration: 0.5, ease: "easeInOut" }
                                                }}
                                                className="w-3 h-3 rounded-full"
                                            />
                                        ))}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-gray-500 italic">
                                    (Imagine {baseDividend} counters here...)
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Main Equation Area */}
            <div className="text-4xl font-bold mb-8 flex items-center space-x-2 relative z-10">
                {/* Dividend */}
                <div className="flex">
                    <span>{baseDividend}</span>
                    <AnimatePresence>
                        {!showZerosInLockBox && !moveZerosBack && (
                            <motion.span
                                initial={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="text-red-500"
                            >
                                {'0'.repeat(zerosCount)}
                            </motion.span>
                        )}
                        {moveZerosBack && (
                            <motion.span
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-green-600"
                            >
                                {'0'.repeat(zerosCount)}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <span>÷</span>
                <span>{divisor}</span>
                <span>=</span>

                {/* Answer Area */}
                <div className="flex items-center min-w-[60px] justify-center border-b-2 border-gray-300">
                    {showBaseFact && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-blue-600"
                        >
                            {baseAnswer}
                        </motion.span>
                    )}
                    {moveZerosBack && (
                        <motion.span
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="text-green-600 ml-1"
                        >
                            {'0'.repeat(zerosCount)}
                        </motion.span>
                    )}
                </div>
            </div>

            {/* Lock Box Area (Step 1 & 2) - Now Static Position */}
            <div className="h-24 w-full flex justify-center items-center mb-8">
                <AnimatePresence>
                    {showZerosInLockBox && !moveZerosBack && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20, scale: 0.5 }}
                            className="p-4 border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 flex flex-col items-center"
                        >
                            <span className="text-sm text-gray-500 mb-1">Zero Lock Box</span>
                            <span className="text-2xl font-bold text-red-500 tracking-widest">
                                {'0'.repeat(zerosCount)}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Step 3 & 4 Explainer Text Overlay */}
            <div className="h-8 text-center w-full px-4">
                {stepIndex === 1 && showCounters && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-600"
                    >
                        Shared into {divisor} groups of {baseAnswer}
                    </motion.p>
                )}
                {stepIndex === 3 && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xl font-bold text-green-700"
                    >
                        Final Answer: {question.answer}
                    </motion.p>
                )}
            </div>

        </div>
    );
};

export default DivisionKnownFactsVisualizer;
