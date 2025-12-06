import React, { useEffect, useState, useMemo } from 'react';
import { Question } from '../../types';
import { getPercentageStrategy, PercentageStrategy } from '../../services/percentageStrategy';

interface Props {
    question: Question;
    stepIndex: number;
}

const PercentagesOfAmountsVisualizer: React.FC<Props> = ({ question, stepIndex }) => {
    const [strategy, setStrategy] = useState<PercentageStrategy | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [percentage, setPercentage] = useState<number>(0);

    useEffect(() => {
        // Parse question: "35% of 200 ="
        const match = question.text.match(/(\d+)%\s+of\s+(\d+)/);
        if (match) {
            const p = parseInt(match[1], 10);
            const a = parseInt(match[2], 10);
            setPercentage(p);
            setAmount(a);
            setStrategy(getPercentageStrategy(p));
        }
    }, [question]);

    if (!strategy) return null;

    const width = 400;
    const height = 60;
    const pixelsPerPercent = width / 100;

    // Calculate accumulated widths
    const parts = strategy.components.flatMap(c => Array(c.count).fill(c.value));

    const isSubtraction = strategy.method.includes('subtraction');

    // Grid Logic
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const allValues = [...parts, 100];
    const gridUnit = allValues.reduce((acc, val) => gcd(acc, val));
    const numDivisions = 100 / gridUnit;

    const formatNumber = (num: number) => parseFloat(Number(num).toPrecision(12));

    const renderBackgroundGrid = () => {
        const lines = [];
        for (let i = 0; i <= numDivisions; i++) {
            const x = (i * gridUnit) * pixelsPerPercent;
            lines.push(
                <line
                    key={`grid-${i}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={height}
                    stroke={gridUnit === 100 ? "transparent" : "#e5e7eb"}
                    strokeWidth={1}
                />
            );
        }
        return (
            <g>
                <rect x={0} y={0} width={width} height={height} fill="#f9fafb" rx={4} stroke="#d1d5db" />
                <text x={width / 2} y={-10} textAnchor="middle" fontSize="12" fill="#6b7280">100% = {amount}</text>
                {lines}
            </g>
        );
    };

    const renderAdditionParams = () => {
        let currentX = 0;
        return (
            <g>
                {renderBackgroundGrid()}

                {/* Segments - Iterate by Group to group labels */}
                {strategy.components.map((group, groupIdx) => {
                    const groupTotalVal = (group.value * group.count / 100) * amount;
                    const groupWidthPct = group.value * group.count;
                    const groupPixelWidth = groupWidthPct * pixelsPerPercent;

                    const startX = currentX;
                    currentX += groupPixelWidth;

                    // Render individual rects for the group
                    const rects = [];
                    for (let i = 0; i < group.count; i++) {
                        const segWidth = group.value * pixelsPerPercent;
                        const rx = startX + (i * segWidth);
                        rects.push(
                            <g key={`rect-${groupIdx}-${i}`}>
                                <rect
                                    x={rx}
                                    y={0}
                                    width={segWidth}
                                    height={height}
                                    fill="#3b82f6"
                                    stroke="white"
                                    strokeWidth={1}
                                    rx={0}
                                    opacity={0.9}
                                />
                                {segWidth > 20 && (
                                    <text x={rx + segWidth / 2} y={height / 2} fill="white" fontSize="11" textAnchor="middle" alignmentBaseline="middle">
                                        {group.value}%
                                    </text>
                                )}
                            </g>
                        );
                    }

                    return (
                        <g key={`group-${groupIdx}`}>
                            {rects}
                            {/* Value Label - Centered under the whole group */}
                            <text x={startX + groupPixelWidth / 2} y={height + 15} fill="#1f2937" fontSize="11" textAnchor="middle" fontWeight="bold">
                                {formatNumber(groupTotalVal)}
                            </text>
                        </g>
                    );
                })}

                {/* Brace for total */}
                <path
                    d={`M 0 ${height + 25} v 5 h ${currentX} v -5`}
                    fill="none"
                    stroke="#374151"
                    strokeWidth="1"
                />
                <text x={currentX / 2} y={height + 50} fill="#3b82f6" fontSize="16" fontWeight="bold" textAnchor="middle">
                    {formatNumber(parseFloat(question.answer))}
                </text>
            </g>
        );
    };

    const renderSubtractionParams = () => {
        const removedTotal = strategy.components.reduce((acc, c) => acc + (c.value * c.count), 0);
        const targetVal = strategy.base - removedTotal;
        const keepWidth = targetVal * pixelsPerPercent;

        let currentX = keepWidth;

        return (
            <g>
                {renderBackgroundGrid()}

                {/* Keep Part */}
                <rect x={0} y={0} width={keepWidth} height={height} fill="#3b82f6" opacity={0.3} />
                <text x={keepWidth / 2} y={height / 2} fill="#1e3a8a" fontSize="14" fontWeight="bold" textAnchor="middle">
                    {targetVal}%
                </text>

                {/* Removed Parts - Iterate by Group */}
                {strategy.components.map((group, groupIdx) => {
                    const groupTotalVal = (group.value * group.count / 100) * amount;
                    const groupWidthPct = group.value * group.count;
                    const groupPixelWidth = groupWidthPct * pixelsPerPercent;

                    const startX = currentX;
                    currentX += groupPixelWidth;

                    // Render individual rects
                    const rects = [];
                    for (let i = 0; i < group.count; i++) {
                        const segWidth = group.value * pixelsPerPercent;
                        const rx = startX + (i * segWidth);
                        rects.push(
                            <g key={`rect-${groupIdx}-${i}`}>
                                <rect
                                    x={rx}
                                    y={0}
                                    width={segWidth}
                                    height={height}
                                    fill="#ef4444"
                                    stroke="white"
                                    strokeWidth={1}
                                    rx={0}
                                    opacity={0.8}
                                />
                                {segWidth > 20 && (
                                    <text x={rx + segWidth / 2} y={height / 2} fill="white" fontSize="11" textAnchor="middle" alignmentBaseline="middle">
                                        {group.value}%
                                    </text>
                                )}
                            </g>
                        );
                    }

                    return (
                        <g key={`group-${groupIdx}`}>
                            {rects}
                            {/* Value Label - Centered under the whole group */}
                            <text x={startX + groupPixelWidth / 2} y={height + 15} fill="#7f1d1d" fontSize="11" textAnchor="middle" fontWeight="bold">
                                -{formatNumber(groupTotalVal)}
                            </text>
                        </g>
                    );
                })}

                {/* Answer Label */}
                <text x={keepWidth / 2} y={height + 50} fill="#3b82f6" fontSize="16" fontWeight="bold" textAnchor="middle">
                    = {formatNumber(parseFloat(question.answer))}
                </text>
            </g>
        );
    };

    return (
        <div className="p-4 flex flex-col items-center">
            <div className="mb-8 text-lg font-bold text-gray-700">
                Finding {percentage}% of {amount}
            </div>

            <svg width={width + 20} height={height + 60} overflow="visible">
                <g transform="translate(10, 20)">
                    {isSubtraction ? renderSubtractionParams() : renderAdditionParams()}
                </g>
            </svg>

            <div className="mt-4 text-sm text-gray-500 font-medium bg-gray-50 px-4 py-2 rounded-lg">
                Strategy: {isSubtraction
                    ? `Start with ${strategy.base}% and subtract parts.`
                    : `Break into chunks and add them.`
                }
            </div>
        </div>
    );
};

export default PercentagesOfAmountsVisualizer;
