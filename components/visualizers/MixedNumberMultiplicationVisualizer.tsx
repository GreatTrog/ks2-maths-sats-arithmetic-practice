import React, { useMemo } from 'react';
import { Question } from '../../types';
import FractionComponent from '../Fraction';

interface MixedNumberMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number;
}

const MixedNumberMultiplicationVisualizer: React.FC<MixedNumberMultiplicationVisualizerProps> = ({ question, stepIndex }) => {

    const { m1, m2, imp1, imp2, res, final } = useMemo(() => {
        // Parse operands
        const operands = question.text.match(/(\d+\s+\d+\/\d+|\d+\/\d+|\d+)/g);
        if (!operands || operands.length < 2) return {
            m1: { w: 0, n: 0, d: 1 }, m2: { w: 0, n: 0, d: 1 },
            imp1: { n: 0, d: 1 }, imp2: { n: 0, d: 1 },
            res: { n: 0, d: 1 },
            final: { w: 0, n: 0, d: 1 }
        };

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

        const m1 = parseMixed(operands[0]);
        const m2 = parseMixed(operands[1]);

        const imp1 = { n: m1.w * m1.d + m1.n, d: m1.d };
        const imp2 = { n: m2.w * m2.d + m2.n, d: m2.d };

        const res = { n: imp1.n * imp2.n, d: imp1.d * imp2.d };
        const final = { w: Math.floor(res.n / res.d), n: res.n % res.d, d: res.d };

        return { m1, m2, imp1, imp2, res, final };
    }, [question]);

    // Helpers
    const renderBar = (numerator: number, denominator: number, small: boolean = false) => {
        const parts = [];
        for (let i = 0; i < denominator; i++) {
            parts.push(
                <div key={i} className={`flex-1 border-r border-slate-300 last:border-r-0 ${i < numerator ? 'bg-indigo-400' : 'bg-slate-100'}`}>
                </div>
            )
        }
        return (
            <div className={`flex border-2 border-slate-700 rounded-sm overflow-hidden ${small ? 'w-16 h-8' : 'w-24 h-10'}`}>
                {parts}
            </div>
        )
    };

    // Step 0: Conversion Visuals
    // Needs to show M1 (e.g. 2 2/3) becoming Imp1 (8/3)
    const renderConversion = (m: { w: number, n: number, d: number }, imp: { n: number, d: number }, label: string) => {
        return (
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-500 mb-2">{label}</div>
                <div className="flex items-center gap-2 mb-2">
                    <FractionComponent whole={m.w} numerator={m.n} denominator={m.d} size="2xl" />
                </div>

                {/* Initial Bars: Wholes + Fraction */}
                <div className="flex gap-2 mb-2">
                    {Array.from({ length: m.w }).map((_, i) => (
                        <div key={i} className="relative flex flex-col items-center">
                            {/* Whole Bar, animated to split */}
                            {renderBar(m.d, m.d, true)}
                            <div className="mt-1">
                                <FractionComponent numerator={m.d} denominator={m.d} size="sm" />
                            </div>
                        </div>
                    ))}
                    <div className="relative flex flex-col items-center">
                        {renderBar(m.n, m.d, true)}
                        <div className="mt-1">
                            <FractionComponent numerator={m.n} denominator={m.d} size="sm" />
                        </div>
                    </div>
                </div>

                <div className="my-2 text-slate-400">↓</div>

                {/* Result Improper */}
                <div className="flex flex-col items-center animate-bounce-in mt-4">
                    <FractionComponent numerator={imp.n} denominator={imp.d} size="lg" className="text-indigo-600" />
                </div>
            </div>
        )
    }

    // Step 2: Reversion Visuals
    // Show resN / resD -> Final Mixed
    // We visualize "Filling" buckets of size D
    // e.g. 44/15. We draw empty buckets of size 15. We fill them up.
    const renderBuckets = () => {
        const buckets = [];
        // We draw (FinalW + 1) buckets
        // The first 'FinalW' are full.
        // The last one is 'FinalRem' full.
        const totalBuckets = final.n > 0 ? final.w + 1 : final.w;

        for (let i = 0; i < totalBuckets; i++) {
            const isFull = i < final.w;
            const fillAmount = isFull ? res.d : final.n;
            const isLast = i === totalBuckets - 1;

            buckets.push(
                <div key={i} className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: `${i * 200}ms` }}>
                    {/* Bucket Label */}
                    <span className="text-xs font-bold text-slate-400 mb-1">Group {i + 1}</span>
                    {/* The Bar */}
                    <div className="w-full max-w-[200px] h-12 border-2 border-slate-600 bg-white rounded-md flex overflow-hidden relative">
                        {/* We might not want to render 15 divs for performance if D is huge, but usually < 20 in KS2 */}
                        {/* If D > 30, maybe just use a percentage bar? */}
                        {res.d <= 20 ? (
                            Array.from({ length: res.d }).map((_, j) => (
                                <div key={j} className={`flex-1 border-r border-slate-100 last:border-r-0 ${j < fillAmount ? 'bg-green-500' : 'bg-transparent'}`}></div>
                            ))
                        ) : (
                            <div className="h-full bg-green-500" style={{ width: `${(fillAmount / res.d) * 100}%` }}></div>
                        )}
                    </div>
                    <span className="text-sm font-bold mt-1 text-green-700">
                        {isFull ? `${res.d} (1 Whole)` : `${fillAmount} (Remainder)`}
                    </span>
                </div>
            )
        }
        return buckets;
    }

    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-inner border-2 border-gray-100 w-full overflow-x-auto">

            {/* Step 0: Conversion */}
            {stepIndex === 0 && (
                <div className="flex flex-col md:flex-row gap-8 items-start justify-center w-full animate-fade-in">
                    {renderConversion(m1, imp1, "Mixed Number")}
                    <div className="text-4xl font-black text-slate-300 self-center">×</div>
                    {/* Render second number statically since it's already a fraction */}
                    <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-500 mb-2">Multiplier</div>
                        <div className="flex flex-col items-center mb-2">
                            <FractionComponent numerator={imp2.n} denominator={imp2.d} size="2xl" />
                        </div>
                        <div className="relative mt-2 flex flex-col items-center">
                            {renderBar(imp2.n, imp2.d, true)}
                            <div className="mt-1">
                                <FractionComponent numerator={imp2.n} denominator={imp2.d} size="sm" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 1: Multiplication */}
            {stepIndex === 1 && (
                <div className="flex flex-col items-center gap-10 animate-fade-in">
                    <div className="text-xl font-bold text-slate-600 mb-6">Multiply Improper Fractions</div>

                    <div className="flex items-center gap-4 text-3xl font-mono font-bold text-slate-800">
                        <FractionComponent numerator={imp1.n} denominator={imp1.d} size="3xl" className="text-indigo-600" />
                        <span>×</span>
                        <FractionComponent numerator={imp2.n} denominator={imp2.d} size="3xl" className="text-indigo-600" />
                        <span>=</span>
                        <div className="flex flex-col items-center p-4 bg-green-50 rounded-xl border-2 border-green-200 min-w-[80px]">
                            <div className="text-sm text-green-600 mb-1 opacity-70">
                                <span>{imp1.n}×{imp2.n}</span>
                            </div>

                            <FractionComponent numerator={res.n} denominator={res.d} size="3xl" className="text-green-700" />

                            <div className="text-sm text-green-600 mt-1 opacity-70">
                                <span>{imp1.d}×{imp2.d}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Reversion */}
            {stepIndex >= 2 && (
                <div className="flex flex-col items-center gap-10 w-full animate-fade-in">
                    <div className="text-lg font-bold text-slate-600 mb-4">
                        {res.n} ÷ {res.d} = ?
                    </div>

                    {/* Bucket Visualization */}
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                        {renderBuckets()}
                    </div>

                    {/* Final Equation */}
                    <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200 flex items-center gap-4 animate-bounce-in">
                        <FractionComponent numerator={res.n} denominator={res.d} size="xl" />
                        <span className="text-2xl font-bold text-slate-400">=</span>
                        <FractionComponent whole={final.w} numerator={final.n} denominator={final.d} size="3xl" />
                    </div>
                </div>
            )}

        </div>
    );
};

export default MixedNumberMultiplicationVisualizer;
