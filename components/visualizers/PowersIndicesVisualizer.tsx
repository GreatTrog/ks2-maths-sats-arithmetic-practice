import React, { useEffect, useState, useMemo } from 'react';
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

const PowersIndicesVisualizer: React.FC<Props> = ({ question }) => {
    const [step, setStep] = useState(0);
    const [animationKey, setAnimationKey] = useState(0);

    const { base, power } = useMemo(() => {
        const match = question.text.match(/(\d+)([²³])/);
        if (match) {
            return {
                base: parseInt(match[1]),
                power: match[2] === '²' ? 2 : 3
            };
        }
        return { base: 0, power: 0 };
    }, [question]);

    useEffect(() => {
        setStep(0);
        const timer1 = setTimeout(() => setStep(1), 1500);
        const timer2 = setTimeout(() => setStep(2), 3500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [animationKey, question]);

    const handleReplay = () => {
        setAnimationKey(prev => prev + 1);
    };

    if (power === 2) {
        // Square Visualizer
        const gridSize = Math.min(300 / base, 40);
        const cells = [];

        // Step 0: Line (base)
        // Step 1: Square (base * base)
        const limitY = step >= 1 ? base : 1;

        for (let y = 0; y < limitY; y++) {
            for (let x = 0; x < base; x++) {
                cells.push(
                    <motion.div
                        key={`${animationKey}-${x}-${y}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: (x + y) * 0.05 }}
                        className="bg-blue-500 border border-white"
                        style={{
                            width: gridSize,
                            height: gridSize,
                        }}
                    />
                );
            }
        }

        return (
            <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm mt-4">
                <div className="flex items-center justify-between w-full mb-2">
                    <h3 className="text-lg font-bold text-blue-600">Visualising Square Numbers</h3>
                    <button onClick={handleReplay} className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-semibold flex items-center gap-1">
                        Replay
                    </button>
                </div>
                <div className="text-sm text-gray-600 mb-4 h-6">
                    {step === 0 && `Step 1: Start with a line of ${base}.`}
                    {step >= 1 && `Step 2: Make a square (${base} × ${base} = ${base * base}).`}
                </div>
                <div
                    className="grid gap-0.5 bg-gray-100 p-2 rounded"
                    style={{
                        gridTemplateColumns: `repeat(${base}, ${gridSize}px)`
                    }}
                >
                    <AnimatePresence>
                        {cells}
                    </AnimatePresence>
                </div>
                <div className="mt-2 text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded">
                    {base}² = {base} × {base} = {base * base}
                </div>
            </div>
        );
    } else if (power === 3) {
        // Cube Visualizer
        const targetWidth = 350;
        const targetHeight = 220;
        const cubeSizeForWidth = targetWidth / ((base + base) * 0.866);
        const cubeSizeForHeight = targetHeight / ((base + base) * 0.5 + base);
        const baseCubeSize = Math.min(30, Math.max(10, Math.min(cubeSizeForWidth, cubeSizeForHeight) * 0.85));

        const cubes: React.ReactElement[] = [];
        const limitY = step >= 1 ? base : 1;
        const limitZ = step >= 2 ? base : 1;

        for (let z = 0; z < limitZ; z++) {
            for (let y = 0; y < limitY; y++) {
                for (let x = 0; x < base; x++) {
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
                    <h3 className="text-lg font-bold text-purple-600">Visualising Cube Numbers</h3>
                    <button onClick={handleReplay} className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors font-semibold flex items-center gap-1">
                        Replay
                    </button>
                </div>
                <div className="text-sm text-gray-600 mb-4 h-6">
                    {step === 0 && `Step 1: Start with a line of ${base}.`}
                    {step === 1 && `Step 2: Make a square base (${base} × ${base}).`}
                    {step === 2 && `Step 3: Make a cube (${base} × ${base} × ${base} = ${base ** 3}).`}
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
                <div className="mt-2 text-sm font-mono bg-purple-50 text-purple-800 px-2 py-1 rounded">
                    {base}³ = {base} × {base} × {base} = {base ** 3}
                </div>
            </div>
        );
    }

    return null;
};

export default PowersIndicesVisualizer;
