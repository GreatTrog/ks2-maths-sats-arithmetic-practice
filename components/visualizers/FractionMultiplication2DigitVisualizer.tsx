
import React, { useEffect, useState } from 'react';
import { Question } from '../../types';

interface FractionMultiplication2DigitVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface ParsedMixed {
    w: number;
    n: number;
    d: number;
}

const FractionMultiplication2DigitVisualizer: React.FC<FractionMultiplication2DigitVisualizerProps> = ({ question, stepIndex }) => {
    const [mixed, setMixed] = useState<ParsedMixed | null>(null);
    const [multiplier, setMultiplier] = useState<number | null>(null);

    useEffect(() => {
        // Expected operands: ["4 4/9", "34"] or similar
        // Generator: `${whole} ${numerator}/${denominator} × ${multiplier} =`
        // Operands: [`${whole} ${numerator}/${denominator}`, `${multiplier}`]
        const ops = question.operands || [];
        if (ops.length === 2) {
            // Parse mixed "4 4/9"
            const mStr = ops[0].trim();
            let mParams = { w: 0, n: 0, d: 1 };
            const parts = mStr.split(' ');
            if (parts.length === 2) {
                const [n, d] = parts[1].split('/').map(Number);
                mParams = { w: parseInt(parts[0]), n, d };
            } else if (mStr.includes('/')) {
                const [n, d] = mStr.split('/').map(Number);
                mParams = { w: 0, n, d };
            } else {
                mParams = { w: parseInt(mStr), n: 0, d: 1 };
            }
            setMixed(mParams);

            // Parse multiplier "34"
            setMultiplier(parseInt(ops[1]));
        }
    }, [question]);

    if (!mixed || multiplier === null) return null;

    // Phases derived from stepIndex
    // Step 0: Draw Area Model (Setup) -> Phase 0
    // Step 1: Multiply Whole -> Phase 1
    // Step 2: Multiply Fraction -> Phase 2
    // Step 3: Add Areas -> Phase 3
    const phase = stepIndex;

    const wholeRes = mixed.w * multiplier;
    const fracNumRes = mixed.n * multiplier;
    const fracWhole = Math.floor(fracNumRes / mixed.d);
    const fracRem = fracNumRes % mixed.d;
    const fracMixedStr = fracWhole > 0 ? (fracRem === 0 ? `${fracWhole}` : `${fracWhole} ${fracRem}/${mixed.d}`) : `${fracRem}/${mixed.d}`;

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-inner min-h-[300px] w-[600px]">
            <div className="text-gray-500 mb-6 font-medium uppercase tracking-widest text-xs">Area Model Visualisation</div>

            {/* Main Container */}
            <div className="flex items-start">

                {/* Left Label (Multiplier) */}
                <div className="flex flex-col justify-center h-48 mr-4">
                    <span className="text-3xl font-bold text-gray-700">{multiplier}</span>
                </div>

                {/* Rectangle Container */}
                <div className="flex flex-col w-[500px]">
                    {/* Top Labels */}
                    <div className="flex w-full mb-2 text-xl font-bold text-gray-600">
                        <div className="w-[350px] text-center">{mixed.w}</div>
                        <div className="w-[150px] text-center">{mixed.n}/{mixed.d}</div>
                    </div>

                    {/* Rectangles */}
                    <div className="flex h-48 border-2 border-gray-400 rounded-lg overflow-hidden relative">

                        {/* Section A: Whole Number */}
                        <div className={`w-[350px] shrink-0 flex flex-col items-center justify-center p-2 transition-colors duration-500 border-r-2 border-dashed border-gray-300 ${phase >= 1 ? 'bg-green-50' : 'bg-white'}`}>
                            {phase >= 1 && (
                                <div className="animation-fade-in text-center">
                                    <div className="text-lg font-bold text-green-700 mb-1">Area A</div>
                                    <div className="text-sm md:text-base text-gray-800">
                                        {multiplier} × {mixed.w} = <span className="font-bold">{wholeRes}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section B: Fraction */}
                        <div className={`w-[150px] shrink-0 flex flex-col items-center justify-center relative transition-colors duration-500 ${phase >= 2 ? 'bg-blue-50' : 'bg-white'}`}>

                            {/* Background Strips (Step 2 visual) */}
                            {phase >= 2 && (
                                <div className="absolute inset-0 flex opacity-20 pointer-events-none">
                                    {Array.from({ length: Math.min(mixed.d, 20) }).map((_, i) => ( // Cap strips at 20 for render sanity
                                        <div key={i} className={`flex-1 border-r border-gray-400 last:border-r-0 ${i < mixed.n ? 'bg-blue-600' : ''}`} />
                                    ))}
                                    {mixed.d > 20 && <div className="absolute inset-0 flex items-center justify-center text-xs">...</div>}
                                </div>
                            )}

                            {phase >= 2 && (
                                <div className="z-10 animation-fade-in text-center p-2 bg-white/80 rounded backdrop-blur-sm shadow-sm m-2">
                                    <div className="text-lg font-bold text-blue-700 mb-1">Area B</div>
                                    <div className="text-xs md:text-sm text-gray-800">
                                        {multiplier} × {mixed.n}/{mixed.d}
                                    </div>
                                    <div className="text-xs md:text-sm mt-1 border-t border-gray-300 pt-1">
                                        = {fracNumRes}/{mixed.d}
                                    </div>
                                    <div className="font-bold text-blue-700 mt-1">
                                        = {fracMixedStr}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Total Sum Bracket (Phase 3) */}
                    {phase >= 3 && (
                        <div className="mt-4 animation-fade-in">
                            <div className="flex items-center justify-center relative pt-4">
                                {/* CSS Bracket approximation */}
                                <div className="absolute top-0 w-full h-4 border-l-2 border-b-2 border-r-2 border-gray-400 rounded-b-lg"></div>
                                <div className="text-2xl font-bold bg-white px-4 z-10 -mt-3 text-purple-700">
                                    {wholeRes} + {fracMixedStr} = {question.answer}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default FractionMultiplication2DigitVisualizer;
