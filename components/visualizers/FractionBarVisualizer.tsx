import React, { useMemo } from 'react';
import { Question, QuestionType } from '../../types';
import FractionComponent from '../Fraction';

interface FractionBarVisualizerProps {
    question: Question;
    stepIndex: number;
}

type Fraction = { n: number; d: number };

// Helper to calculate GCD
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

// Helper to calculate LCM
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

// Constants for layout
const BAR_HEIGHT = 64; // h-16 = 64px
const GAP = 64; // Further increased space between bars
const TOP_OFFSET = 80; // Significantly increased space at top for stacked header
const BAR_1_Y = TOP_OFFSET;

const FractionBarVisualizer: React.FC<FractionBarVisualizerProps> = ({ question, stepIndex }) => {

    // --- Parse Data ---
    const { fraction1, fraction2, mode, commonDenominator } = useMemo(() => {
        // Find fractions in the text (e.g. "1/2 + 1/4")
        const matches = question.text.match(/(\d+)\/(\d+)\s*([+−-])\s*(\d+)\/(\d+)/);

        let f1: Fraction = { n: 0, d: 1 };
        let f2: Fraction = { n: 0, d: 1 };
        let op = '+';

        if (matches) {
            f1 = { n: parseInt(matches[1]), d: parseInt(matches[2]) };
            op = matches[3];
            f2 = { n: parseInt(matches[4]), d: parseInt(matches[5]) };
        }

        // Determine mode
        // Note: The regex might catch standard hyphen or u2212 '−'
        const isSubtraction = op === '-' || op === '−' ||
            question.type.includes('Subtraction');

        const currentMode = isSubtraction ? 'subtract' : 'add';

        // Calculate specific LCM/Common Denominator used in the question
        // Ideally we match what the explanation says, but mathematical LCM is safe
        const common = lcm(f1.d, f2.d);

        return {
            fraction1: f1,
            fraction2: f2,
            mode: currentMode,
            commonDenominator: common
        };
    }, [question]);

    // --- Provided Logic (Adapted) ---

    // stepIndex mapping:
    // The provided code assumes:
    // Step < 2 (Index 0, 1) -> Before Animation / Prep
    // Step 2 (Index 2) -> Animation
    // But our Explanation Service typically has:
    // Step 0: "Find common denominator" (Static, show breakdown?)
    // Step 1: "Make equivalent" (Show multiplication factors)
    // Step 2: "Add/Subtract" (Show animation/result)
    // Step 3: "Simplify" (Final)

    // Let's map our `stepIndex` to the visualizer `step` logic
    // Visualizer Step 0: Initial State
    // Visualizer Step 1: Show Grid / Factors
    // Visualizer Step 2: Animate / Result

    // We can just pass stepIndex directly if it roughly aligns. 
    // stepIndex 0: "Find CD" -> Show basic bars
    // stepIndex 1: "Make Equiv" -> Show Grid + Arrows (Index 1 matches `step >= 1` logic in code)
    // stepIndex 2: "Add/Sub" -> Animate block movement (Index 2 matches `step >= 2` logic)
    // Works perfectly!

    const BAR_2_Y = BAR_1_Y + BAR_HEIGHT + GAP;
    const MATH_Y = mode === 'subtract' ? BAR_1_Y + BAR_HEIGHT + 80 : BAR_2_Y + BAR_HEIGHT + 96;
    const CONTAINER_HEIGHT = MATH_Y + 120; // Increased padding

    const blocks = useMemo(() => {
        // Convert original fractions to common denominator counts
        const count1 = fraction1.n * (commonDenominator / fraction1.d);
        const count2 = fraction2.n * (commonDenominator / fraction2.d);

        const allBlocks: any[] = [];

        if (mode === 'add') {
            // Fraction 1 (Blue)
            for (let i = 0; i < count1; i++) {
                allBlocks.push({
                    id: `f1-${i}`,
                    type: 'f1',
                    initialIndex: i,
                    targetIndex: i,
                    startBar: 1,
                });
            }
            // Fraction 2 (Orange) moves to Bar 1
            for (let i = 0; i < count2; i++) {
                allBlocks.push({
                    id: `f2-${i}`,
                    type: 'f2',
                    initialIndex: i,
                    targetIndex: count1 + i,
                    startBar: 2,
                });
            }
        } else {
            // Subtraction
            for (let i = 0; i < count1; i++) {
                // Cross out the last `count2` blocks
                const isCrossedOut = i >= (count1 - count2);
                allBlocks.push({
                    id: `f1-${i}`,
                    type: 'f1',
                    initialIndex: i,
                    targetIndex: i,
                    startBar: 1,
                    isCrossedOut,
                });
            }
        }
        return allBlocks;
    }, [fraction1, fraction2, commonDenominator, mode]);

    const getBlockStyle = (block: any) => {
        const unitWidth = 100 / commonDenominator;

        let top = 0;
        let left = 0;
        const width = unitWidth;

        if (mode === 'add') {
            if (stepIndex < 2) { // Changed 'step' to 'stepIndex'
                top = block.startBar === 1 ? BAR_1_Y : BAR_2_Y;
                left = block.initialIndex * unitWidth;
            } else {
                // Animation (Combine)
                const targetSlot = block.targetIndex;
                if (targetSlot < commonDenominator) {
                    top = BAR_1_Y;
                    left = targetSlot * unitWidth;
                } else {
                    const overflowIndex = targetSlot - commonDenominator;
                    top = BAR_2_Y;
                    left = overflowIndex * unitWidth;
                }
            }
        } else { // Subtract
            top = BAR_1_Y;
            left = block.initialIndex * unitWidth;
        }

        return {
            top: `${top + 2}px`,
            left: `${left}%`,
            width: `${width}%`,
            height: `${BAR_HEIGHT}px`,
            marginLeft: '-1px', // Slight nudge left for visual alignment
        };
    };

    const renderOriginalGrid = (denom: number, yPos: number, isDotted: boolean = false) => {
        const lines = [];
        for (let i = 1; i < denom; i++) {
            lines.push(
                <div
                    key={`grid-${denom}-${i}`}
                    className={`absolute top-0 bottom-0 border-r-2 ${isDotted ? 'border-dashed border-slate-300' : 'border-slate-800'} pointer-events-none z-20`}
                    style={{
                        left: `${(i / denom) * 100}%`,
                        height: `${BAR_HEIGHT}px`,
                        top: `0px`, // Relative to bar now
                    }}
                />
            );
        }
        return lines;
    };

    const renderLCMGrid = (yPos: number) => {
        const lines = [];
        for (let i = 1; i < commonDenominator; i++) {
            lines.push(
                <div
                    key={`lcm-${i}`}
                    className="absolute border-r border-dashed border-slate-400/70 pointer-events-none z-10 transition-opacity duration-500"
                    style={{
                        left: `${(i / commonDenominator) * 100}%`,
                        top: `0px`, // Relative to bar now
                        height: `${BAR_HEIGHT}px`,
                        opacity: stepIndex >= 1 ? 1 : 0,
                    }}
                />
            );
        }
        return lines;
    };

    const CalculationDisplay = ({ fraction, factor, colorClass, delay }: { fraction: Fraction; factor: number; colorClass: string; delay: string; }) => {
        const newN = fraction.n * factor;
        const newD = fraction.d * factor;

        // Hide during initial step, show during step 1 (prep), hide during step 2+ (result shown elsewhere)
        // Actually, user code said: step === 1 ? opacity-100...
        // Let's keep it visible in step 1 only for clarity? Or maybe keep it?
        // User code: `step === 1 ? ... : ... pointer-events-none`
        // Let's stick to that.

        return (
            <div className={`flex items-center gap-4 transition-all duration-500 ${delay} ${stepIndex === 1 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
                <div className={`relative flex items-center gap-3 font-bold font-mono text-2xl ${colorClass}`}>
                    {/* Top Arrow (Numerator) -45 deg */}
                    <div className="absolute -top-8 left-0 w-full flex justify-center">
                        <div className="relative w-16 h-8">
                            <svg width="100%" height="100%" viewBox="0 0 60 30" preserveAspectRatio="none" className="overflow-visible">
                                <path d="M 10 25 Q 30 0 50 25" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path d="M 50 25 L 45 18 M 50 25 L 55 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(-45 50 25)" />
                                <text x="30" y="10" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">×{factor}</text>
                            </svg>
                        </div>
                    </div>

                    {/* Original Fraction */}
                    <FractionComponent numerator={fraction.n} denominator={fraction.d} size="xl" />

                    <span>=</span>

                    {/* New Fraction */}
                    <FractionComponent numerator={newN} denominator={newD} size="xl" />

                    {/* Bottom Arrow (Denominator) +45 deg */}
                    <div className="absolute -bottom-8 left-0 w-full flex justify-center">
                        <div className="relative w-16 h-8">
                            <svg width="100%" height="100%" viewBox="0 0 60 30" preserveAspectRatio="none" className="overflow-visible">
                                <path d="M 10 5 Q 30 30 50 5" fill="none" stroke="currentColor" strokeWidth="2" />
                                <path d="M 50 5 L 45 12 M 50 5 L 55 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" transform="rotate(45 50 5)" />
                                <text x="30" y="28" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="bold">×{factor}</text>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const factor1 = commonDenominator / fraction1.d;
    const factor2 = commonDenominator / fraction2.d;
    const eqN1 = fraction1.n * factor1;
    const eqN2 = fraction2.n * factor2;
    const resultN = mode === 'add' ? eqN1 + eqN2 : eqN1 - eqN2;

    return (
        <div className="flex flex-col items-center p-6 pl-20 sm:pl-24 bg-white rounded-3xl shadow-inner border-2 border-gray-100 min-w-[600px] w-full overflow-visible">
            <div className="relative w-full max-w-2xl mx-auto" style={{ height: `${CONTAINER_HEIGHT}px` }}>

                {/* Header for subtraction (or generally just useful) */}
                <div className="absolute w-full top-0 flex justify-center mt-4">
                    <div className="text-xl font-bold text-slate-500 font-mono flex items-center gap-3">
                        <FractionComponent numerator={fraction1.n} denominator={fraction1.d} />
                        <span className="text-2xl">{mode === 'add' ? '+' : '−'}</span>
                        <FractionComponent numerator={fraction2.n} denominator={fraction2.d} />
                    </div>
                </div>

                {/* --- BAR 1 --- */}
                <div
                    className="absolute w-full border-2 border-slate-800 bg-slate-100/50 overflow-hidden box-content -ml-[2px] rounded-sm"
                    style={{ top: BAR_1_Y, height: BAR_HEIGHT }}
                >
                    {renderLCMGrid(BAR_1_Y)}
                    {renderOriginalGrid(fraction1.d, BAR_1_Y)}
                </div>

                {/* --- BAR 2 (Add Only) --- */}
                {mode === 'add' && (
                    <div
                        className="absolute w-full border-2 border-slate-800 bg-slate-100/50 overflow-hidden box-content -ml-[2px] rounded-sm"
                        style={{ top: BAR_2_Y, height: BAR_HEIGHT }}
                    >
                        {renderLCMGrid(BAR_2_Y)}
                        {renderOriginalGrid(fraction2.d, BAR_2_Y)}
                    </div>
                )}

                {/* --- BLOCKS --- */}
                {blocks.map((block) => {
                    const style = getBlockStyle(block);
                    const isF1 = block.type === 'f1';
                    const showDivisions = stepIndex >= 1;
                    const showCrossOut = mode === 'subtract' && block.isCrossedOut && stepIndex >= 2;

                    return (
                        <div
                            key={block.id}
                            className={`absolute transition-all duration-1000 ease-in-out flex items-center justify-center overflow-hidden
                            ${isF1 ? 'bg-indigo-500' : 'bg-orange-500'}
                            ${stepIndex >= 2 ? 'z-30' : 'z-0'}
                            ${showDivisions ? 'border-r border-white/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : ''}
                        `}
                            style={style}
                        >
                            {showCrossOut && (
                                <div className="absolute inset-0 z-40 flex items-center justify-center animate-in fade-in zoom-in duration-500">
                                    <svg viewBox="0 0 24 24" className="w-full h-full text-red-600/80 p-1" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
                                </div>
                            )}
                            <div className={`w-full h-full flex items-center justify-center transition-opacity ${showDivisions ? 'opacity-0 hover:opacity-100' : 'opacity-0'}`}>
                                <span className="text-[10px] text-white font-mono">1/{commonDenominator}</span>
                            </div>
                        </div>
                    );
                })}

                {/* --- LABELS --- */}
                <div
                    className="absolute -left-12 sm:-left-16 flex items-center justify-end w-12 sm:w-16 font-bold text-slate-700 text-lg sm:text-xl pr-4"
                    style={{ top: BAR_1_Y, height: BAR_HEIGHT }}
                >
                    <FractionComponent numerator={fraction1.n} denominator={fraction1.d} />
                </div>

                {mode === 'add' && (
                    <div
                        className="absolute -left-12 sm:-left-16 flex items-center justify-end w-12 sm:w-16 font-bold text-slate-700 text-lg sm:text-xl pr-4"
                        style={{ top: BAR_2_Y, height: BAR_HEIGHT }}
                    >
                        <FractionComponent numerator={fraction2.n} denominator={fraction2.d} />
                    </div>
                )}

                {/* --- CALCULATIONS --- */}
                <div
                    className="absolute w-full flex justify-around items-center px-8"
                    style={{ top: MATH_Y }}
                >
                    <CalculationDisplay fraction={fraction1} factor={factor1} colorClass="text-indigo-600" delay="delay-0" />
                    <CalculationDisplay fraction={fraction2} factor={factor2} colorClass="text-orange-600" delay="delay-200" />
                </div>

                {/* --- FINAL EQUATION --- */}
                <div
                    className={`absolute w-full flex justify-center items-center transition-all duration-700 delay-700`}
                    style={{
                        top: MATH_Y,
                        opacity: stepIndex >= 2 ? 1 : 0,
                        transform: stepIndex >= 2 ? 'translateY(0)' : 'translateY(20px)',
                        pointerEvents: stepIndex >= 2 ? 'auto' : 'none'
                    }}
                >
                    <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-lg border border-slate-200 text-slate-800 text-2xl font-bold flex items-center gap-6">
                        {/* Fraction 1 (Equivalent) */}
                        <div className="text-indigo-600">
                            <FractionComponent numerator={eqN1} denominator={commonDenominator} size="2xl" />
                        </div>

                        <span className="text-slate-400">{mode === 'add' ? '+' : '−'}</span>

                        {/* Fraction 2 (Equivalent) */}
                        <div className="text-orange-600">
                            <FractionComponent numerator={eqN2} denominator={commonDenominator} size="2xl" />
                        </div>

                        <span className="text-slate-400">=</span>

                        {/* Result */}
                        <div className="text-slate-900 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                            <FractionComponent numerator={resultN} denominator={commonDenominator} size="2xl" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FractionBarVisualizer;
