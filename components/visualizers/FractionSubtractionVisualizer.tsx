
import React, { useEffect, useState } from 'react';
import { Question } from '../../types';
import FractionComponent from '../Fraction';

interface FractionSubtractionVisualizerProps {
    question: Question;
    stepIndex: number;
}

interface ParsedMixed {
    w: number;
    n: number;
    d: number;
    originalStr: string;
}

const FractionSubtractionVisualizer: React.FC<FractionSubtractionVisualizerProps> = ({ question, stepIndex }) => {
    const [m1, setM1] = useState<ParsedMixed | null>(null);
    const [m2, setM2] = useState<ParsedMixed | null>(null);
    const [commonD, setCommonD] = useState<number>(1);
    const [needsCommonDenom, setNeedsCommonDenom] = useState(false);
    const [needsBorrow, setNeedsBorrow] = useState(false);
    const [conversionStage, setConversionStage] = useState(0); // 0: Original, 1: Show Multipliers, 2: Converted

    // Helper to parse fractions like "5 2/4" or "2" or "1/2"
    const parseMixed = (str: string): ParsedMixed => {
        str = str.trim();
        const parts = str.split(' ');
        if (parts.length === 2) {
            const [n, d] = parts[1].split('/').map(Number);
            return { w: parseInt(parts[0]), n, d, originalStr: str };
        }
        if (str.includes('/')) {
            const [n, d] = str.split('/').map(Number);
            return { w: 0, n, d, originalStr: str };
        }
        return { w: parseInt(str), n: 0, d: 1, originalStr: str };
    };

    const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;

    useEffect(() => {
        // Expected operands: ["5 2/4", "2 3/4"]
        const ops = question.operands || [];
        if (ops.length === 2) {
            const p1 = parseMixed(ops[0]);
            const p2 = parseMixed(ops[1]);
            setM1(p1);
            setM2(p2);

            const d1 = p1.d;
            const d2 = p2.d;
            const cD = (d1 * d2) / gcd(d1, d2);
            setCommonD(cD);

            const p1NewN = p1.n * (cD / d1);
            const p2NewN = p2.n * (cD / d2);

            const differentDenoms = d1 !== d2;
            setNeedsCommonDenom(differentDenoms);

            // Check borrow based on COMMON denominator numerators
            setNeedsBorrow(p1NewN < p2NewN);
        }
    }, [question]);



    // --- Calculate Derived Visual States based on logic flow ---

    // Logic Flow in Explanation Service:
    // Step 0: "Set up" (or find common den)
    // Step 1: Borrow (or subtract fractions if no borrow)
    // ...

    // We need to map `stepIndex` (from explanation service) to our visual stages.
    // The explanation service adds a step for "Common Denom" ONLY if needed.
    // Then "Borrow" ONLY if needed.

    // Let's deduce the "Current Active View" based on the step text or index?
    // Using stepIndex is fragile if we don't know exactly which path was taken.
    // However, we can reconstruct the path since we have the same logic variables (needsCommonDenom, needsBorrow).

    // Path A: Diff Denoms, Need Borrow
    // Step 0: Common Denom (Explanation: "Find a common...")
    // Step 1: Borrow (Explanation: "Borrow a whole...")
    // Step 2: Subtract Frac
    // Step 3: Subtract Whole
    // Step 4: Simplify/Final

    // Path B: Same Denoms, Need Borrow
    // Step 0: Setup (Explanation: "Set up...") -> Visual should show Initial
    // Step 1: Borrow
    // Step 2: Sub Frac
    // Step 3: Sub Whole
    // Step 4: Final

    // Path C: Diff Denoms, No Borrow
    // Step 0: Common Denom
    // Step 1: Check Frac (No borrow)
    // Step 2: Sub Frac
    // Step 3: Sub Whole
    // Step 4: Final

    // Path D: Same Denoms, No Borrow
    // Step 0: Setup
    // Step 1: Check Frac
    // Step 2: Sub Frac
    // Step 3: Sub Whole
    // Step 4: Final

    // We can standardize the "Visual Phase":
    // Phase 0: Initial
    // Phase 1: Common Denominator (active if needsCommonDenom)
    // Phase 2: Borrow (active if needsBorrow)
    // Phase 3: Subtraction
    // Phase 4: Final

    // Determine visual phase based on stepIndex and problem type
    let phase = 0;
    let currentStep = 0;

    // 1. Common Denominator Step
    if (needsCommonDenom) {
        if (stepIndex === currentStep) phase = 1;
        currentStep++;
    } else {
        // If no common denom needed, step 0 is "Setup" (Phase 0)
        if (stepIndex === currentStep) phase = 0;
        currentStep++;
    }

    // If we haven't found the phase yet, check next steps
    if (stepIndex >= currentStep) {
        // 2. Borrow / Check Step
        if (stepIndex === currentStep) phase = 2;
        currentStep++;

        if (stepIndex >= currentStep) {
            // 3. Subtract Fractions
            if (stepIndex === currentStep) phase = 3;
            currentStep++;

            if (stepIndex >= currentStep) {
                // 4. Subtract Wholes
                if (stepIndex === currentStep) phase = 3; // Keep showing subtraction view
                currentStep++;

                if (stepIndex >= currentStep) {
                    // 5. Final / Simplify
                    phase = 4;
                }
            }
        }
    }

    // Adjusted Logic to be safer:
    // Use specific states map?
    // A simpler approach: Render the "State after X operations".
    // If phase >= 1 && needsCommonDenom, use common denom values.
    // If phase >= 2 && needsBorrow, use borrowed values.


    // Manage Transition for Phase 1
    useEffect(() => {
        if (phase === 1 && needsCommonDenom) {
            setConversionStage(0);

            // Step 1: Show Multipliers
            const timer1 = setTimeout(() => {
                setConversionStage(1);
            }, 1000);

            // Step 2: Show Converted
            const timer2 = setTimeout(() => {
                setConversionStage(2);
            }, 3500); // Give time to read multipliers

            return () => { clearTimeout(timer1); clearTimeout(timer2); };
        } else if (phase > 1) {
            setConversionStage(2);
        } else {
            setConversionStage(0);
        }
    }, [phase, needsCommonDenom]);

    // Current Values Calculation
    // If phase == 1, we respect 'conversionStage >= 2'.
    // If phase > 1, we always show converted (handled by useEffect above setting it true, but good to force it).
    const showCommonDenomVal = needsCommonDenom ? (phase > 1 || (phase === 1 && conversionStage >= 2)) : true;
    const showBorrow = needsBorrow ? (phase >= 2) : false;

    // V1 (Initial or CD)
    if (!m1 || !m2) return null;
    let v1 = { ...m1 };
    let v2 = { ...m2 };

    if (showCommonDenomVal && needsCommonDenom) {
        v1.n = v1.n * (commonD / v1.d);
        v1.d = commonD;
        v2.n = v2.n * (commonD / v2.d);
        v2.d = commonD;
    }

    // V1 after Borrow
    let v1Borrowed = { ...v1 };
    if (showBorrow && needsBorrow) {
        v1Borrowed.w -= 1;
        v1Borrowed.n += v1Borrowed.d;
    }

    // Result
    const resN = v1Borrowed.n - v2.n;
    const resW = v1Borrowed.w - v2.w;

    // Render Helpers

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-inner min-h-[220px]">
            <div className="text-gray-500 mb-10 font-medium uppercase tracking-widest text-xs">Visualisation</div>

            {/* Container for the calculation */}
            <div className="flex items-center gap-4 md:gap-8">

                {/* Left Side (First Number) */}
                <div className="relative flex flex-col items-center">
                    {/* If we borrowed, show the OLD number crossed out above or behind, and NEW number prominent? 
                 Or show change in place. 
                 Image shows: 5 2/4 crossed out, 4 6/4 written next to it.
             */}

                    {showBorrow ? (
                        <div className="flex flex-col items-center animation-fade-in-up">
                            {/* The crossed out original */}
                            <div className="relative mb-2">
                                <FractionComponent whole={v1.w} numerator={v1.n} denominator={v1.d} crossedOut={true} size="xl" />
                                {/* Arrow or visual cue? */}
                            </div>
                            {/* The new borrowed version */}
                            <FractionComponent whole={v1Borrowed.w} numerator={v1Borrowed.n} denominator={v1Borrowed.d} highlight={true} size="xl" />
                        </div>
                    ) : (
                        <div className="relative">
                            <FractionComponent
                                whole={v1.w}
                                numerator={v1.n}
                                denominator={v1.d}
                                highlight={phase >= 1 && needsCommonDenom && phase < 2}
                                size="xl"
                            />
                            {phase === 1 && conversionStage === 1 && needsCommonDenom && (
                                <div className="absolute top-0 -right-8 flex flex-col text-xs text-blue-500 font-bold bg-blue-100 p-1 rounded animate-pulse z-10">
                                    <span>×{Math.round(commonD / m1!.d)}</span>
                                    <span className="mt-2">×{Math.round(commonD / m1!.d)}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Operator */}
                <div className="text-4xl font-bold text-gray-400">−</div>

                {/* Right Side (Second Number) */}
                <div>
                    <div className="relative">
                        <FractionComponent
                            whole={v2.w}
                            numerator={v2.n}
                            denominator={v2.d}
                            highlight={phase >= 1 && needsCommonDenom && phase < 2}
                            size="xl"
                        />
                        {phase === 1 && conversionStage === 1 && needsCommonDenom && (
                            <div className="absolute top-0 -right-8 flex flex-col text-xs text-blue-500 font-bold bg-blue-100 p-1 rounded animate-pulse z-10">
                                <span>×{Math.round(commonD / m2!.d)}</span>
                                <span className="mt-2">×{Math.round(commonD / m2!.d)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Equals */}
                <div className="text-4xl font-bold text-gray-400">=</div>

                {/* Result Area */}
                {phase >= 3 ? (
                    <div className="animation-fade-in">
                        <div className="flex items-center gap-1 font-mono text-xl md:text-2xl text-blue-600 font-bold">
                            <FractionComponent
                                whole={resW > 0 || (resW === 0 && resN === 0) ? (resW === 0 && resN === 0 ? "0" : resW) : ""}
                                numerator={resN > 0 || (resW === 0 && resN === 0) ? resN : ""}
                                denominator={resN > 0 || (resW === 0 && resN === 0) ? v1Borrowed.d : ""}
                                size="xl"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 font-bold text-2xl border-2 border-dashed border-gray-200">
                        ?
                    </div>
                )}

            </div>

            {/* Helper Text / Annotations */}
            <div className="mt-8 h-8 text-center">
                {phase === 1 && needsCommonDenom && (
                    <span className="text-blue-500 font-bold animate-pulse">Converting to common denominator...</span>
                )}
                {phase === 2 && needsBorrow && (
                    <span className="text-orange-500 font-bold animate-pulse">Indices too small! Borrow 1 whole ({v1.d}/{v1.d}).</span>
                )}
                {phase === 3 && (
                    <span className="text-green-600 font-bold">Subtracting {showBorrow ? 'new' : ''} values...</span>
                )}
            </div>

        </div>
    );
};

const renderTextWithFractions = (text: string) => {
    const regex = /(\d+\s+\d+\/\d+)|(\d+\/\d+)/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
        if (!part) return null;
        if (part.match(regex)) {
            const mixedMatch = part.match(/^(\d+)\s+(\d+)\/(\d+)$/);
            if (mixedMatch) {
                return (
                    <FractionComponent
                        key={i}
                        whole={mixedMatch[1]}
                        numerator={mixedMatch[2]}
                        denominator={mixedMatch[3]}
                        size="inherit"
                    />
                );
            }
            const fractionMatch = part.match(/^(\d+)\/(\d+)$/);
            if (fractionMatch) {
                return (
                    <FractionComponent
                        key={i}
                        numerator={fractionMatch[1]}
                        denominator={fractionMatch[2]}
                        size="inherit"
                    />
                );
            }
        }
        return <span key={i}>{part}</span>;
    });
};

export default FractionSubtractionVisualizer;
