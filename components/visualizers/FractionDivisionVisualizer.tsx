
import React, { useEffect, useState } from 'react';
import { Question } from '../../types';
import FractionComponent from '../Fraction';

interface FractionDivisionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface ParsedFraction {
    n: number;
    d: number;
}

const FractionDivisionVisualizer: React.FC<FractionDivisionVisualizerProps> = ({ question, stepIndex }) => {
    const [fraction, setFraction] = useState<ParsedFraction | null>(null);
    const [divisor, setDivisor] = useState<number | null>(null);

    useEffect(() => {
        // Expected operands: ["4/7", "3"]
        const ops = question.operands || [];
        if (ops.length === 2) {
            // Parse fraction "4/7"
            const parts = ops[0].split('/');
            if (parts.length === 2) {
                setFraction({ n: parseInt(parts[0]), d: parseInt(parts[1]) });
            }
            // Parse divisor "3"
            setDivisor(parseInt(ops[1]));
        }
    }, [question]);

    if (!fraction || divisor === null) return null;

    // Phases derived from stepIndex
    // Note: Explanation service now has varying step counts depending on path.
    // Simple Path (Multiple): 4 steps (0,1,2,3) -> Understand, Draw, Share, Result
    // Cut Path (Non-multiple): 5 steps (0,1,2,3,4) -> Understand, Draw, Cut, Equivalent, Share

    // We need to map stepIndex to visual phases carefully.
    const isMult = fraction && divisor && (fraction.n % divisor === 0);

    // Mapping
    // Simple: Step 0->Phase 0, Step 1->Phase 1, Step 2->Phase 3 (skip cut), Step 3->Phase 3 (Result)
    // Cut: Step 0->Phase 0, Step 1->Phase 1, Step 2->Phase 2 (Cut), Step 3->Phase 3 (Equiv shown), Step 4->Phase 4 (Result)

    let phase = 0;
    if (isMult) {
        if (stepIndex <= 1) phase = stepIndex;
        else phase = 3; // Jump to share/result
    } else {
        phase = stepIndex;
    }

    // Visual logic
    // Phase 1: Draw Bar (d columns, n shaded)
    // Phase 2: Vertical Cuts. Each column subdivides into 'divisor' sub-columns.
    // Phase 3: Share. Highlight N sub-pieces in the shaded area.

    const cuts = divisor;
    const totalParts = isMult ? fraction.d : fraction.d * divisor;
    const shadedParts = isMult ? fraction.n : fraction.n * divisor;

    // For final answer display
    const finalN = isMult ? (fraction.n / divisor) : fraction.n;

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-inner min-h-[320px] w-[600px]">
            <div className="text-gray-500 mb-10 font-medium uppercase tracking-widest text-xs">Fraction Division Visualisation</div>

            {phase > 0 && (
                <div className="flex flex-col items-center w-[500px]">
                    {/* Context Text */}
                    <div className="text-lg font-medium text-gray-700 mb-4 h-8 flex items-center justify-center gap-2">
                        {phase === 1 && (
                            <>
                                <span>Represent</span>
                                <FractionComponent numerator={fraction.n} denominator={fraction.d} />
                            </>
                        )}
                        {phase === 2 && `Split each part vertically into ${divisor} smaller pieces`}
                        {phase >= 3 && `Share ${shadedParts} pieces into ${divisor} groups`}
                    </div>

                    {/* Bar Model Container */}
                    <div className="relative w-full h-32 border-2 border-gray-800 rounded bg-white overflow-hidden shadow-lg transition-all duration-500">

                        {/* Columns */}
                        <div className="absolute inset-0 flex">
                            {Array.from({ length: fraction.d }).map((_, i) => {
                                const isOriginalShaded = i < fraction.n;

                                return (
                                    <div key={`col-${i}`} className={`flex-1 border-r border-gray-400 last:border-r-0 flex`}>
                                        {/* Inner Splits (Vertical Cuts) */}
                                        {/* If Phase >= 2 (Cut) AND !isMult, we show multiple sub-columns. Else just 1. */}
                                        {Array.from({ length: (phase >= 2 && !isMult) ? divisor : 1 }).map((_, subIndex) => {

                                            // Coloring Logic
                                            const splits = (phase >= 2 && !isMult) ? divisor : 1;

                                            // We highlight the first 'finalN' pieces of the shaded area.
                                            // The shaded area is the first fraction.n columns.
                                            // The sub-indices are filled left-to-right.

                                            let isResult = false;
                                            if (isOriginalShaded) {
                                                const myShadedIndex = (i * splits) + subIndex;
                                                if (phase >= 3 && myShadedIndex < finalN) {
                                                    isResult = true;
                                                }
                                            }

                                            return (
                                                <div
                                                    key={`sub-${subIndex}`}
                                                    className={`flex-1 h-full border-r border-gray-200 last:border-r-0 transition-colors duration-500
                                                ${isResult ? 'bg-green-400' : (isOriginalShaded ? 'bg-blue-300' : 'bg-transparent')}
                                            `}
                                                >
                                                    {isResult && (
                                                        <div className="w-full h-full animate-pulse" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Labels under the bar */}
                    {phase >= 3 && (
                        <div className="mt-6 text-center animation-fade-in flex flex-col items-center p-4 bg-gray-50 rounded-xl w-full">
                            <div className="flex items-center space-x-6">
                                <div>
                                    <span className="text-gray-500 text-sm block">Total Pieces</span>
                                    <span className="text-xl font-bold text-gray-800">{totalParts}</span>
                                </div>
                                <div className="text-2xl text-gray-300">|</div>
                                <div>
                                    <span className="text-gray-500 text-sm block">Shaded Pieces</span>
                                    <span className="text-xl font-bold text-blue-600">{shadedParts}</span>
                                </div>
                                <div className="text-2xl text-gray-300">|</div>
                                <div>
                                    <span className="text-gray-500 text-sm block">Group Size</span>
                                    <span className="text-xl font-bold text-green-600">{finalN}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200 w-full flex items-center justify-center gap-3">
                                <span className="text-lg text-gray-600">Answer:</span>
                                <FractionComponent numerator={finalN} denominator={totalParts} size="3xl" />
                            </div>
                        </div>
                    )}

                </div>
            )}

            {phase === 0 && (
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-center gap-2">
                    <span className="text-lg text-blue-800 font-medium whitespace-nowrap">Think: </span>
                    <FractionComponent numerator={fraction.n} denominator={fraction.d} size="lg" />
                    <span className="text-lg text-blue-800 font-medium whitespace-nowrap"> shared among {divisor} people.</span>
                </div>
            )}

        </div>
    );
};

export default FractionDivisionVisualizer;
