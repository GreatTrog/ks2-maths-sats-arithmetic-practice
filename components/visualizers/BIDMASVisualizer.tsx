import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface BIDMASVisualizerProps {
    question: Question;
    stepIndex: number;
}

const BIDMASVisualizer: React.FC<BIDMASVisualizerProps> = ({ question, stepIndex }) => {
    const [pyramidLayers, setPyramidLayers] = useState<number>(0);
    const [highlightedOps, setHighlightedOps] = useState<string[]>([]);
    const [bracePosition, setBracePosition] = useState<number>(-1);
    const [calculationSteps, setCalculationSteps] = useState<string[]>([]);

    const metadata = question.bidmasMetadata;
    const questionText = question.text.replace('=', '').trim();

    // Step 0: Reveal pyramid layers
    useEffect(() => {
        if (stepIndex === 0) {
            setPyramidLayers(0);
            const timers = [
                setTimeout(() => setPyramidLayers(1), 500),
                setTimeout(() => setPyramidLayers(2), 1000),
                setTimeout(() => setPyramidLayers(3), 1500),
                setTimeout(() => setPyramidLayers(4), 2000),
            ];
            return () => timers.forEach(clearTimeout);
        }
    }, [stepIndex]);

    // Step 1: Highlight operators
    useEffect(() => {
        if (stepIndex === 1 && metadata) {
            setHighlightedOps(metadata.operations);
        } else {
            setHighlightedOps([]);
        }
    }, [stepIndex, metadata]);

    // Step 2: Show brace
    useEffect(() => {
        if (stepIndex === 2 && metadata?.executionSteps[0]) {
            setBracePosition(0);
        } else {
            setBracePosition(-1);
        }
    }, [stepIndex, metadata]);

    // Step 3+: Build calculation steps
    useEffect(() => {
        if (stepIndex >= 3 && metadata) {
            const steps: string[] = [];
            for (let i = 0; i < stepIndex - 2 && i < metadata.executionSteps.length; i++) {
                const step = metadata.executionSteps[i];
                steps.push(`${step.operands[0]} ${step.operation} ${step.operands[1]} = ${step.result}`);
            }
            setCalculationSteps(steps);
        } else {
            setCalculationSteps([]);
        }
    }, [stepIndex, metadata]);

    // Render pyramid
    const renderPyramid = () => {
        const layers = [
            { label: 'B ()', color: '#EF4444', show: pyramidLayers >= 1 },
            { label: 'I ⁿ', color: '#F59E0B', show: pyramidLayers >= 2 },
            { label: 'D ÷  M ×', color: '#10B981', show: pyramidLayers >= 3 },
            { label: 'A +  S −', color: '#3B82F6', show: pyramidLayers >= 4 },
        ];
        const slope = 1.1; // Controls the steepness of the pyramid
        return (
            <div className="relative w-full h-48 flex items-end justify-center">
                <svg viewBox="0 0 300 200" className="w-full h-full">
                    <AnimatePresence>
                        {layers.map((layer, idx) => {
                            if (!layer.show) return null;

                            // Calculate geometry based on consistent slope
                            const topY = 20 + idx * 35;
                            const bottomY = topY + 30;

                            // Calculate widths based on distance from apex (y=20)
                            // Apex is at y=20, width=0 (conceptually)
                            const halfWidthTop = (topY - 20) * slope;
                            const halfWidthBottom = (bottomY - 20) * slope;
                            const xTopLeft = 150 - halfWidthTop;
                            const xTopRight = 150 + halfWidthTop;
                            const xBottomLeft = 150 - halfWidthBottom;
                            const xBottomRight = 150 + halfWidthBottom;
                            // For the top layer (idx 0), we want a triangle, so top width is 0
                            const points = idx === 0
                                ? `150,${topY} ${xBottomRight},${bottomY} ${xBottomLeft},${bottomY}` // Triangle
                                : `${xTopLeft},${topY} ${xTopRight},${topY} ${xBottomRight},${bottomY} ${xBottomLeft},${bottomY}`; // Trapezoid
                            return (
                                <motion.g
                                    key={idx}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <polygon
                                        points={points}
                                        fill={layer.color}
                                        opacity={0.8}
                                    />
                                    <text
                                        x={150}
                                        y={topY + 20}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="14"
                                        fontWeight="bold"
                                    >
                                        {layer.label}
                                    </text>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                    {/* Arrows code remains the same... */}
                    {pyramidLayers >= 3 && (
                        <>
                            <motion.line
                                x1="120" y1="115" x2="180" y2="115"
                                stroke="white" strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 1.5, duration: 0.5 }}
                            />
                            <motion.polygon
                                points="180,115 175,110 175,120"
                                fill="white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2 }}
                            />
                        </>
                    )}
                    {pyramidLayers >= 4 && (
                        <>
                            <motion.line
                                x1="120" y1="150" x2="180" y2="150"
                                stroke="white" strokeWidth="2"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 2, duration: 0.5 }}
                            />
                            <motion.polygon
                                points="180,150 175,145 175,155"
                                fill="white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 2.5 }}
                            />
                        </>
                    )}
                </svg>
            </div>
        );
    };

    // Render question with highlighting and inline brace
    const renderQuestion = () => {
        if (stepIndex === 0) return <div className="h-16"></div>;
        const parts = questionText.split(/([+\-×÷()])/).filter(p => p.trim());
        // If we are in step 2 (Brace step), we need to group the parts
        if (stepIndex === 2 && metadata && bracePosition >= 0) {
            const step = metadata.executionSteps[bracePosition];
            const targetExpression = step.activeExpression || step.expression;
            const stepParts = targetExpression.split(/([+\-×÷()])/).filter(p => p.trim());
            let startIndex = -1;
            // Find where the active step starts in the main parts array
            for (let i = 0; i <= parts.length - stepParts.length; i++) {
                let match = true;
                for (let j = 0; j < stepParts.length; j++) {
                    if (parts[i + j] !== stepParts[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    startIndex = i;
                    break;
                }
            }
            if (startIndex !== -1) {
                const before = parts.slice(0, startIndex);
                const active = parts.slice(startIndex, startIndex + stepParts.length);
                const after = parts.slice(startIndex + stepParts.length);
                return (
                    <div className="text-3xl font-bold text-gray-800 flex items-baseline justify-center gap-2 flex-wrap my-6">
                        {/* Before */}
                        {before.map((part, idx) => (
                            <span key={`b-${idx}`}>{part}</span>
                        ))}
                        {/* Active Part with Brace */}
                        <div className="flex flex-col items-center relative">
                            <div className="flex gap-2">
                                {active.map((part, idx) => {
                                    const isOperator = ['+', '-', '×', '÷'].includes(part.trim());
                                    const isHighlighted = highlightedOps.includes(part.trim());
                                    return (
                                        <motion.span
                                            key={`a-${idx}`}
                                            className={`${isOperator && isHighlighted ? 'text-red-500 font-black text-4xl' : ''}`}
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                                        >
                                            {part}
                                        </motion.span>
                                    );
                                })}
                            </div>
                            {/* Brace */}
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute top-full left-0 right-0 flex flex-col items-center"
                            >
                                <svg width="100%" height="20" viewBox="0 0 100 20" preserveAspectRatio="none" className="text-blue-600 mt-1">
                                    <path d="M0,0 Q0,10 5,10 L45,10 Q50,10 50,20 Q50,10 55,10 L95,10 Q100,10 100,0"
                                        fill="none" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                <span className="text-sm text-blue-600 whitespace-nowrap mt-1">Calculate this first</span>
                            </motion.div>
                        </div>
                        {/* After */}
                        {after.map((part, idx) => (
                            <span key={`af-${idx}`}>{part}</span>
                        ))}
                    </div>
                );
            }
        }
        // Default rendering for other steps
        return (
            <div className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2 flex-wrap my-6">
                {parts.map((part, idx) => {
                    const isOperator = ['+', '-', '×', '÷'].includes(part.trim());
                    const isHighlighted = highlightedOps.includes(part.trim());
                    return (
                        <motion.span
                            key={idx}
                            className={`${isOperator && isHighlighted ? 'text-red-500 font-black text-4xl' : ''}`}
                            animate={isHighlighted ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            {part}
                        </motion.span>
                    );
                })}
            </div>
        );
    };

    // Render calculation steps
    const renderCalculations = () => {
        if (calculationSteps.length === 0) return null;
        return (
            <div className="space-y-3 mt-6">
                {calculationSteps.map((step, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.3 }}
                        className="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center"
                    >
                        <span className="text-lg font-bold text-green-700">{step}</span>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-h-[400px] w-[400px] mx-auto">
            {stepIndex === 0 && renderPyramid()}
            {stepIndex >= 1 && renderQuestion()}
            {stepIndex >= 3 && renderCalculations()}
        </div>
    );
};

export default BIDMASVisualizer;