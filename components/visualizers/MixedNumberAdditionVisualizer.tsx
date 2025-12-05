import React, { useMemo } from 'react';
import { Question } from '../../types';

interface MixedNumberAdditionVisualizerProps {
    question: Question;
    stepIndex: number;
}

// Reuse helper for GCD/LCM
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

const MixedNumberAdditionVisualizer: React.FC<MixedNumberAdditionVisualizerProps> = ({ question, stepIndex }) => {

    // --- Parse Data ---
    const { m1, m2, commonDenominator, totalWholes, fractionSumInvalid, extraWholes, remN } = useMemo(() => {
        // Parse "1 1/2 + 2 3/4" or similar
        // Helper to parse mixed number strings
        const parseMixed = (str: string) => {
            const parts = str.trim().split(' ');
            let w = 0, n = 0, d = 1;
            if (parts.length === 2) {
                w = parseInt(parts[0]);
                const f = parts[1].split('/');
                n = parseInt(f[0]);
                d = parseInt(f[1]);
            } else if (str.includes('/')) {
                const f = str.split('/');
                n = parseInt(f[0]);
                d = parseInt(f[1]);
            } else {
                w = parseInt(str);
            }
            return { w, n, d };
        };

        const operands = question.text.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+)/g);
        if (!operands || operands.length < 2) return { m1: { w: 0, n: 0, d: 1 }, m2: { w: 0, n: 0, d: 1 }, commonDenominator: 1, totalWholes: 0, fractionSumInvalid: { n: 0, d: 1 }, extraWholes: 0, remN: 0 };

        const m1 = parseMixed(operands[0]);
        const m2 = parseMixed(operands[1]);

        const totalWholes = m1.w + m2.w;
        const commonDenominator = lcm(m1.d, m2.d);

        // Fraction addition
        const n1 = m1.n * (commonDenominator / m1.d);
        const n2 = m2.n * (commonDenominator / m2.d);
        const totalN = n1 + n2;

        const extraWholes = Math.floor(totalN / commonDenominator);
        const remN = totalN % commonDenominator;

        return {
            m1, m2,
            commonDenominator,
            totalWholes,
            fractionSumInvalid: { n: totalN, d: commonDenominator },
            extraWholes,
            remN
        };
    }, [question]);

    // Dimensions
    const BLOCK_SIZE = 40; // Smaller bars
    const GAP = 10;

    // Render Helpers
    const renderWholeBar = (key: string, color: string) => (
        <div key={key} className={`flex-shrink-0 border-2 border-slate-700 ${color} rounded-sm`}
            style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}>
            {/* Can add grid lines if we want, but for wholes just plain is fine */}
            <div className="w-full h-full opacity-20 bg-white"></div>
        </div>
    );

    const renderFractionBar = (numerator: number, denominator: number, common: number, color: string) => {
        // Render a generic fraction bar scaled to fit e.g. width 200px?
        // Actually, let's keep it relative to the 'Whole' block size if possible?
        // No, Wholes are abstract "1".
        // Fractions need to show parts.
        // Let's make one "Whole" in fraction-land equal to say 200px width.
        const WIDTH = 240;
        const boxes = [];
        const unitW = WIDTH / common;

        // Convert input fraction to common denominator counts
        const count = numerator * (common / denominator);

        for (let i = 0; i < common; i++) {
            const filled = i < count;
            boxes.push(
                <div key={i} className={`h-full border-r border-slate-300 last:border-r-0 ${filled ? color : 'bg-slate-50'}`}
                    style={{ width: `${unitW}px` }}>
                </div>
            )
        }

        return (
            <div className="flex border-2 border-slate-700 bg-white h-10 rounded-sm overflow-hidden" style={{ width: `${WIDTH}px` }}>
                {boxes}
            </div>
        );
    };

    // Step Logic
    // 0: Problem Setup
    // 1: Add Wholes (Group m1.w and m2.w)
    // 2: Add Fractions Setup (Show m1.f and m2.f)
    // 3: Combine Fractions (Convert to one bar)
    // 4+: Regroup if needed

    // Step Mapping from Explanation Service:
    // 0: "Add wholes" (Result shown)
    // 1: "Add fractions" (Setup)
    // 2: "Combine fractions" (Result improper)
    // 3: "Convert improper" (if extraWholes > 0) OR "Combine totals" (if not)
    // 4: "Add extra whole" (if extraWholes > 0)
    // 5: "Simplify" (optional)

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 min-w-[500px] w-full overflow-x-auto">
            <div className="text-gray-500 font-bold mb-4 font-mono text-lg">{question.text}</div>

            {/* Section 1: Wholes */}
            <div className="w-full flex flex-col items-center gap-2 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest w-full text-center mb-2">Whole Numbers</div>

                {/* Visual Grouping */}
                <div className="flex gap-8 items-center">
                    {/* Group 1 */}
                    <div className="flex gap-1" style={{ opacity: stepIndex === 0 ? 1 : 0.5 }}>
                        {Array.from({ length: m1.w }).map((_, i) => renderWholeBar(`w1-${i}`, 'bg-green-400'))}
                        {m1.w === 0 && <span className="text-gray-300 text-sm italic">None</span>}
                    </div>

                    <div className="text-2xl font-bold text-gray-400">+</div>

                    {/* Group 2 */}
                    <div className="flex gap-1" style={{ opacity: stepIndex === 0 ? 1 : 0.5 }}>
                        {Array.from({ length: m2.w }).map((_, i) => renderWholeBar(`w2-${i}`, 'bg-green-400'))}
                        {m2.w === 0 && <span className="text-gray-300 text-sm italic">None</span>}
                    </div>

                    <div className="text-2xl font-bold text-gray-400">=</div>

                    {/* Total Wholes */}
                    <div className={`flex gap-1 transition-all duration-500 ${stepIndex >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        {Array.from({ length: totalWholes }).map((_, i) => renderWholeBar(`wt-${i}`, 'bg-green-500'))}
                        {/* Extra Whole Placeholder from Regrouping */}
                        {stepIndex >= 4 && extraWholes > 0 && (
                            <div className="animate-bounce">
                                {renderWholeBar(`w-extra`, 'bg-blue-400 border-blue-600')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Fractions */}
            {stepIndex >= 1 && (
                <div className="w-full flex flex-col items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-slide-up">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest w-full text-center mb-2">Fractions</div>

                    <div className="flex justify-around w-full items-center">
                        <div className="flex flex-col items-center gap-1">
                            {renderFractionBar(m1.n, m1.d, commonDenominator, 'bg-blue-400')}
                            <span className="font-mono text-sm text-blue-600 font-bold">{m1.n}/{m1.d}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-400">+</div>
                        <div className="flex flex-col items-center gap-1">
                            {renderFractionBar(m2.n, m2.d, commonDenominator, 'bg-orange-400')}
                            <span className="font-mono text-sm text-orange-600 font-bold">{m2.n}/{m2.d}</span>
                        </div>
                    </div>

                    {/* Combined Result */}
                    {stepIndex >= 2 && (
                        <>
                            <div className="w-full border-t border-blue-200 my-2"></div>
                            <div className="flex flex-col items-center gap-2">
                                {/* If improper (>1), show as separate wholes + rem? */}
                                {/* For simplicity, lets render one LOOOONG bar or wrapped bars if > 1? */}
                                {/* Actually, standard representation: Improper fraction. */}
                                {/* We can show 'extraWholes' full bars + 'remN' bar */}

                                <div className="flex gap-2 items-center">
                                    {Array.from({ length: extraWholes }).map((_, i) => (
                                        <div key={i} className="flex flex-col items-center relative">
                                            {/* If we are at step 4 (regrouping), these move up? */}
                                            {/* Just fade them out here and fade in up top? */}
                                            <div className={`transition-opacity duration-1000 ${stepIndex >= 4 ? 'opacity-20' : 'opacity-100'}`}>
                                                {renderFractionBar(1, 1, 1, 'bg-blue-500')}
                                            </div>
                                            <span className="text-xs text-blue-800 font-bold mt-1">1 Whole</span>
                                        </div>
                                    ))}

                                    {(remN > 0 || extraWholes === 0) && (
                                        <div className="flex flex-col items-center">
                                            {renderFractionBar(remN, commonDenominator, commonDenominator, 'bg-indigo-500')}
                                            <span className="font-mono text-sm text-indigo-700 font-bold">{remN}/{commonDenominator}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-blue-600">
                                    {fractionSumInvalid.n}/{commonDenominator}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {stepIndex >= 4 && extraWholes > 0 && (
                <div className="mt-4 text-green-600 font-bold animate-pulse">
                    Regrouped {extraWholes} whole(s) to the top!
                </div>
            )}

        </div>
    );
};

export default MixedNumberAdditionVisualizer;
