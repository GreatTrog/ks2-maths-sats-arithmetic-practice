import React, { useMemo } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    question: Question;
    stepIndex: number;
}

const FractionsOfAmountsVisualizer: React.FC<Props> = ({ question, stepIndex }) => {
    const { num, den, amount } = useMemo(() => {
        const match = question.text.match(/(\d+)\/(\d+)\s+of\s+(\d+)/);
        if (match) {
            return {
                num: parseInt(match[1]),
                den: parseInt(match[2]),
                amount: parseInt(match[3])
            };
        }
        return { num: 0, den: 1, amount: 0 };
    }, [question]);

    const partValue = amount / den;

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 w-full max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Bar Model</h3>

            <div className="w-[400px] relative h-32 flex flex-col items-center justify-center">
                <AnimatePresence mode='wait'>
                    {stepIndex === 0 ? (
                        <motion.div
                            key="whole"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full h-16 bg-gray-200 rounded-lg border-2 border-gray-400 flex items-center justify-center relative"
                        >
                            <span className="font-bold text-gray-600 text-xl">Whole: {amount}</span>
                            {/* Bracket for the whole */}
                            <div className="absolute -top-6 left-0 w-full h-4 border-t-2 border-l-2 border-r-2 border-gray-400 rounded-t-lg"></div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="divided"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full border-2 border-gray-400 rounded-lg overflow-hidden h-16 flex"
                        >
                            {Array.from({ length: den }).map((_, i) => {
                                const isHighlighted = stepIndex >= 2 && i < num;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`flex-1 flex items-center justify-center border-r-2 border-gray-300 last:border-r-0 transition-colors duration-500
                                            ${isHighlighted ? 'bg-blue-200 text-blue-800 font-bold' : 'bg-white text-gray-500'}
                                        `}
                                    >
                                        {partValue}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Explanatory Text */}
            <div className="mt-2 text-center text-sm text-gray-600 space-y-2 h-20">
                {stepIndex === 0 && (
                    <p>The whole bar represents <strong>{amount}</strong>.</p>
                )}
                {stepIndex === 1 && (
                    <p>
                        Divide the bar into <strong>{den}</strong> equal parts.<br />
                        {amount} ÷ {den} = <strong>{partValue}</strong> per part.
                    </p>
                )}
                {stepIndex >= 2 && (
                    <p>
                        Select <strong>{num}</strong> parts.<br />
                        {partValue} × {num} = <strong className="text-blue-600 text-lg">{partValue * num}</strong>
                    </p>
                )}
            </div>
        </div>
    );
};

export default FractionsOfAmountsVisualizer;
