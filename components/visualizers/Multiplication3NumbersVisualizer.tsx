import React, { useEffect, useState } from 'react';
import { Question } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    question: Question;
}

interface CubeProps {
    x: number;
    y: number;
    z: number;
    color: string;
    cubeSize: number;
}

const IsometricCube: React.FC<CubeProps> = ({ x, y, z, color, cubeSize }) => {
    // Isometric projection
    // x goes right-down, y goes left-down, z goes up
    const isoX = (x - y) * cubeSize * 0.866; // cos(30)
    const isoY = (x + y) * cubeSize * 0.5 - (z * cubeSize); // sin(30)

    const topFace = `M 0 0 L ${cubeSize * 0.866} ${cubeSize * 0.5} L 0 ${cubeSize} L ${-cubeSize * 0.866} ${cubeSize * 0.5} Z`;
    const leftFace = `M ${-cubeSize * 0.866} ${cubeSize * 0.5} L 0 ${cubeSize} L 0 ${cubeSize * 2} L ${-cubeSize * 0.866} ${cubeSize * 1.5} Z`;
    const rightFace = `M 0 ${cubeSize} L ${cubeSize * 0.866} ${cubeSize * 0.5} L ${cubeSize * 0.866} ${cubeSize * 1.5} L 0 ${cubeSize * 2} Z`;

    return (
        <motion.g
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, x: isoX, y: isoY }}
            transition={{ duration: 0.3, delay: (x + y + z) * 0.05 }}
        >
            <path d={topFace} fill={color} stroke="#fff" strokeWidth="0.5" style={{ filter: 'brightness(1.1)' }} />
            <path d={leftFace} fill={color} stroke="#fff" strokeWidth="0.5" style={{ filter: 'brightness(0.9)' }} />
            <path d={rightFace} fill={color} stroke="#fff" strokeWidth="0.5" style={{ filter: 'brightness(0.7)' }} />
        </motion.g>
    );
};

export const Multiplication3NumbersVisualizer: React.FC<Props> = ({ question }) => {
    const [step, setStep] = useState(0); // 0: Line, 1: Base, 2: Volume
    const [animationKey, setAnimationKey] = useState(0); // Used to restart animation

    // Parse operands and apply smart ordering logic to match explanation
    const numbers = question.text.match(/(\d+)/g)?.map(Number) || [];
    const [rawN1, rawN2, rawN3] = numbers;

    // Re-implement smart ordering logic to ensure visualizer matches explanation
    const options = [
        { a: rawN1, b: rawN2, rem: rawN3 },
        { a: rawN2, b: rawN3, rem: rawN1 },
        { a: rawN1, b: rawN3, rem: rawN2 }
    ];

    let bestOption = options.find(opt => (opt.a * opt.b) % 10 === 0);
    if (!bestOption) {
        options.sort((x, y) => x.rem - y.rem);
        bestOption = options[0];
    }

    const { a: n1, b: n2, rem: n3 } = bestOption || { a: rawN1, b: rawN2, rem: rawN3 };

    // Calculate responsive cube size based on dimensions
    // Isometric projection dimensions:
    // Width: (n1 + n2) * cubeSize * 0.866
    // Height: (n1 + n2) * cubeSize * 0.5 + n3 * cubeSize

    // Target container: ~350px width, ~220px height
    const targetWidth = 350;
    const targetHeight = 220;

    // Calculate max cube size that fits both constraints
    const cubeSizeForWidth = targetWidth / ((n1 + n2) * 0.866);
    const cubeSizeForHeight = targetHeight / ((n1 + n2) * 0.5 + n3);

    const baseCubeSize = Math.min(30, Math.max(10, Math.min(cubeSizeForWidth, cubeSizeForHeight) * 0.85));

    useEffect(() => {
        setStep(0); // Reset to first step
        const timer1 = setTimeout(() => setStep(1), 1500);
        const timer2 = setTimeout(() => setStep(2), 3500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [animationKey]); // Re-run when animationKey changes

    const handleReplay = () => {
        setAnimationKey(prev => prev + 1);
    };

    // Calculate cubes to render based on current step
    const cubes: React.ReactElement[] = [];

    // Step 0: Line (n1 cubes along X)
    // Step 1: Base (n1 * n2 cubes)
    // Step 2: Volume (n1 * n2 * n3 cubes)

    const limitY = step >= 1 ? n2 : 1;
    const limitZ = step >= 2 ? n3 : 1;

    // Generate cubes back-to-front for correct painter's algorithm
    for (let z = 0; z < limitZ; z++) {
        for (let y = 0; y < limitY; y++) {
            for (let x = 0; x < n1; x++) {
                // Color gradient based on position
                const hue = 200 + (x * 10) + (y * 10) + (z * 10);
                const color = `hsl(${hue}, 70%, 60%)`;

                cubes.push(
                    <IsometricCube key={`${animationKey}-${x}-${y}-${z}`} x={x} y={y} z={z} color={color} cubeSize={baseCubeSize} />
                );
            }
        }
    }

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm mt-4">
            <div className="flex items-center justify-between w-full mb-2">
                <h3 className="text-lg font-bold text-purple-600">Visualising the Volume</h3>
                <button
                    onClick={handleReplay}
                    className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-semibold flex items-center gap-1"
                    title="Replay animation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Replay
                </button>
            </div>
            <div className="text-sm text-gray-600 mb-4 h-6">
                {step === 0 && `Step 1: Start with a line of ${n1} cubes.`}
                {step === 1 && `Step 2: Build the base layer (${n1} × ${n2} = ${n1 * n2}).`}
                {step === 2 && `Step 3: Stack ${n3} layers high (${n1 * n2} × ${n3} = ${n1 * n2 * n3}).`}
            </div>

            <div className="relative w-full h-64 flex justify-center items-center overflow-hidden">
                <svg viewBox="-200 -100 400 300" className="w-full h-full">
                    <g transform="translate(0, 50)">
                        <AnimatePresence>
                            {cubes}
                        </AnimatePresence>
                    </g>
                </svg>
            </div>

            <div className="flex gap-4 mt-2 text-sm font-mono">
                <div className={`px-2 py-1 rounded ${step >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                    Length: {n1}
                </div>
                <div className={`px-2 py-1 rounded ${step >= 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                    Width: {n2}
                </div>
                <div className={`px-2 py-1 rounded ${step >= 2 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                    Height: {n3}
                </div>
            </div>
        </div>
    );
};
