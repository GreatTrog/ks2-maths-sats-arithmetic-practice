import React, { useMemo } from 'react';
import { Question } from '../../types';
import FractionComponent from '../Fraction';

interface Fraction {
    numerator: number;
    denominator: number;
}

enum AnimationState {
    INITIAL = 'INITIAL',
    OVERLAPPING = 'OVERLAPPING',
    RESULT = 'RESULT',
}

interface FractionMultiplicationVisualizerProps {
    question: Question;
    stepIndex: number;
}

const parseFraction = (fracStr: string): Fraction => {
    const [n, d] = fracStr.split('/').map(Number);
    return { numerator: n, denominator: d };
};

const FractionMultiplicationVisualizer: React.FC<FractionMultiplicationVisualizerProps> = ({ question, stepIndex }) => {
    const SIZE = 160; // Much smaller to fit side-by-side

    const { fraction1, fraction2 } = useMemo(() => {
        // Extract operands from question text or operands array
        // Expected format: "1/2 × 3/4 ="
        const ops = question.operands || [];
        let f1: Fraction = { numerator: 1, denominator: 2 };
        let f2: Fraction = { numerator: 1, denominator: 2 };

        if (ops.length >= 2) {
            f1 = parseFraction(ops[0]);
            f2 = parseFraction(ops[1]);
        } else {
            // Fallback parsing from text
            const matches = question.text.match(/(\d+\/\d+)/g);
            if (matches && matches.length >= 2) {
                f1 = parseFraction(matches[0]);
                f2 = parseFraction(matches[1]);
            }
        }
        return { fraction1: f1, fraction2: f2 };
    }, [question]);

    // Map stepIndex to AnimationState
    // Step 0: Intro (Initial)
    // Step 1: Multiply Numerators (Start Overlap)
    // Step 2: Multiply Denominators (Show Result Grid)
    // Step 3: Simplify (Show Result)
    let animationState = AnimationState.INITIAL;
    if (stepIndex === 1) animationState = AnimationState.OVERLAPPING;
    if (stepIndex >= 2) animationState = AnimationState.RESULT;

    // Rectangle 1: Vertical slices (Blue)
    const rect1Slices = Array.from({ length: fraction1.denominator }).map((_, i) => {
        const width = SIZE / fraction1.denominator;
        const isColored = i < fraction1.numerator;
        return (
            <rect
                key={`v-${i}`}
                x={i * width}
                y={0}
                width={width}
                height={SIZE}
                fill={isColored ? '#38bdf8' : 'white'} // sky-400
                stroke="#e2e8f0" // slate-200
                strokeWidth="2"
            />
        );
    });

    // Rectangle 2: Horizontal slices (Rose)
    const rect2Slices = Array.from({ length: fraction2.denominator }).map((_, i) => {
        const height = SIZE / fraction2.denominator;
        const isColored = i < fraction2.numerator;
        return (
            <rect
                key={`h-${i}`}
                x={0}
                y={i * height}
                width={SIZE}
                height={height}
                fill={isColored ? '#fb7185' : 'transparent'} // rose-400
                stroke={isColored ? 'rgba(251, 113, 133, 0.5)' : '#e2e8f0'}
                fillOpacity={isColored ? 0.6 : 0}
                strokeWidth="2"
            />
        );
    });

    // Result Grid: To show the grid lines of the product clearly
    const resultGrid = [];
    if (animationState === AnimationState.RESULT || animationState === AnimationState.OVERLAPPING) {
        for (let i = 0; i < fraction1.denominator; i++) {
            for (let j = 0; j < fraction2.denominator; j++) {
                const w = SIZE / fraction1.denominator;
                const h = SIZE / fraction2.denominator;
                const isDoubleShaded = i < fraction1.numerator && j < fraction2.numerator;

                // Only draw special highlight if we are in RESULT state and it is double shaded
                if (animationState === AnimationState.RESULT && isDoubleShaded) {
                    resultGrid.push(
                        <rect
                            key={`res-${i}-${j}`}
                            x={i * w}
                            y={j * h}
                            width={w}
                            height={h}
                            fill="#a855f7" // purple-500
                            stroke="#7e22ce"
                            strokeWidth="2"
                            className="animate-pulse"
                        />
                    );
                }
            }
        }
    }

    const isOverlapped = animationState !== AnimationState.INITIAL;

    return (
        <div className="relative h-[340px] w-[400px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden p-8 mx-auto">

            {/* Container for Rectangle 1 (Target) */}
            <div className={`relative transition-all duration-1000 ease-in-out ${isOverlapped ? 'translate-x-0' : '-translate-x-[80px]'}`}>
                <svg width={SIZE} height={SIZE} className="shadow-md bg-white">
                    <g>{rect1Slices}</g>
                    {/* We render the result highlights on top of rect 1 when overlapped */}
                    <g>{resultGrid}</g>
                </svg>
                <div className={`absolute -top-20 left-0 w-full flex flex-col items-center text-sm font-bold text-sky-600 transition-opacity duration-300 ${isOverlapped ? 'opacity-0' : 'opacity-100'}`}>
                    <FractionComponent numerator={fraction1.numerator} denominator={fraction1.denominator} size="sm" />
                    <span>(Vertical)</span>
                </div>
            </div>

            {/* Container for Rectangle 2 (Slider) */}
            <div
                className={`absolute transition-all duration-1000 ease-in-out shadow-md`}
                style={{
                    left: '50%',
                    top: '50%',
                    width: SIZE,
                    height: SIZE,
                    transform: isOverlapped
                        ? `translate(-50%, -50%)`
                        : `translate(5px, -50%)`,
                    opacity: isOverlapped ? 1 : 1,
                    pointerEvents: 'none' // Let clicks pass through
                }}
            >
                <svg width={SIZE} height={SIZE} className="bg-transparent">
                    <defs>
                        <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                            <rect width="0.5" height="8" transform="translate(0,0)" fill="rgba(0,0,0,0.1)" />
                        </pattern>
                    </defs>
                    <g>{rect2Slices}</g>
                    {/* Grid lines to make multiplication clear */}
                    {Array.from({ length: fraction2.denominator }).map((_, i) => (
                        <line
                            key={`line-${i}`}
                            x1="0"
                            y1={(i + 1) * (SIZE / fraction2.denominator)}
                            x2={SIZE}
                            y2={(i + 1) * (SIZE / fraction2.denominator)}
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="1"
                        />
                    ))}

                </svg>
                <div className={`absolute -bottom-20 left-0 w-full flex flex-col items-center text-sm font-bold text-rose-500 transition-opacity duration-300 ${isOverlapped ? 'opacity-0' : 'opacity-100'}`}>
                    <FractionComponent numerator={fraction2.numerator} denominator={fraction2.denominator} size="sm" />
                    <span>(Horizontal)</span>
                </div>
            </div>

        </div>
    );
};

export default FractionMultiplicationVisualizer;
