import React, { useMemo } from 'react';
import { Question } from '../../types';

interface BIDMASVisualizerProps {
  question: Question;
  stepIndex: number;
}

const removeRedundantParens = (expr: string): string =>
  expr.replace(/\(\s*([-+]?\d+(?:\.\d+)?)\s*\)/g, '$1').replace(/\s+/g, ' ').trim();

const isPureNumber = (expr: string) => expr.trim().match(/^-?\d+(\.\d+)?$/);

const highlightNextPart = (expression: string, active: string | undefined): string => {
  if (!active) return expression.trim();
  const expr = expression.trim();
  const candidates = [active, `(${active})`, `( ${active} )`];
  for (const candidate of candidates) {
    const idx = expr.indexOf(candidate);
    if (idx !== -1) {
      const before = expr.slice(0, idx);
      const after = expr.slice(idx + candidate.length);
      return `${before}<span style="color: red; font-weight: 700;">${candidate}</span>${after}`.trim();
    }
  }
  return expr;
};

const rewriteExpression = (expression: string, target: string | undefined, result: string): string => {
  if (!target) return expression.trim();
  const expr = expression.trim();
  const candidates = [target, `(${target})`, `( ${target} )`];
  for (const candidate of candidates) {
    const idx = expr.indexOf(candidate);
    if (idx !== -1) {
      const updated = `${expr.slice(0, idx)}${result}${expr.slice(idx + candidate.length)}`;
      return removeRedundantParens(updated);
    }
  }
  return expr;
};

const renderPyramid = (pyramidLayers: number) => {
  const layers = [
    { label: 'B ()', color: '#EF4444', show: pyramidLayers >= 1 },
    { label: 'I ²/³', color: '#F59E0B', show: pyramidLayers >= 2 },
    { label: 'D ÷  M ×', color: '#10B981', show: pyramidLayers >= 3 },
    { label: 'A +  S -', color: '#3B82F6', show: pyramidLayers >= 4 },
  ];
  const slope = 1.1;
  return (
    <div className="relative w-full h-48 flex items-end justify-center">
      <svg viewBox="0 0 300 200" className="w-full h-full">
        {layers.map((layer, idx) => {
          if (!layer.show) return null;
          const topY = 20 + idx * 35;
          const bottomY = topY + 30;
          const halfWidthTop = (topY - 20) * slope;
          const halfWidthBottom = (bottomY - 20) * slope;
          const xTopLeft = 150 - halfWidthTop;
          const xTopRight = 150 + halfWidthTop;
          const xBottomLeft = 150 - halfWidthBottom;
          const xBottomRight = 150 + halfWidthBottom;
          const points = idx === 0
            ? `150,${topY} ${xBottomRight},${bottomY} ${xBottomLeft},${bottomY}`
            : `${xTopLeft},${topY} ${xTopRight},${topY} ${xBottomRight},${bottomY} ${xBottomLeft},${bottomY}`;
          return (
            <g key={idx}>
              <polygon points={points} fill={layer.color} opacity={0.8} />
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
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const BIDMASVisualizer: React.FC<BIDMASVisualizerProps> = ({ question, stepIndex }) => {
  const questionText = question.text.replace('=', '').trim();
  const metadata = question.bidmasMetadata;

  // Build the sequence of expressions to show on the right:
  // [initial, highlight step1, rewritten step1, highlight step2, rewritten step2, ...]
  const displayExpressions = useMemo(() => {
  const seq: string[] = [questionText];

  // Fallback when no metadata
  if (!metadata || !metadata.executionSteps || metadata.executionSteps.length === 0) {
    const numbers = questionText.match(/\d+/g) || [];
    const num2 = numbers[1];
    const num3 = numbers[2];
    if (num2 && num3) {
      const multResult = parseInt(num2, 10) * parseInt(num3, 10);
      const multiplicationPartMatch = questionText.match(new RegExp(`${num2}\\s*[^\\d]+\\s*${num3}`));
      const multiplicationPart = multiplicationPartMatch ? multiplicationPartMatch[0] : `${num2} × ${num3}`;
      const highlighted = questionText.replace(
        multiplicationPart,
        `<span style="color: red; font-weight: 700;">${multiplicationPart}</span>`
      );
      const rewritten = questionText.replace(multiplicationPart, multResult.toString());
      seq.push(highlighted);
      seq.push(rewritten);
    }
    return seq;
  }

  let currentExpr = questionText;
  metadata.executionSteps.forEach((step) => {
    const activeExpr = step.activeExpression || `${step.operands[0]} ${step.operation} ${step.operands[1]}`;
    if (isPureNumber(activeExpr)) {
      currentExpr = rewriteExpression(currentExpr, activeExpr, step.result);
      return;
    }
    const highlighted = highlightNextPart(currentExpr, activeExpr);
    seq.push(highlighted);
    currentExpr = rewriteExpression(currentExpr, activeExpr, step.result);
    seq.push(currentExpr);
  });

  return seq;
}, [questionText, metadata]);

// Align with text steps: step 0 shows the pyramid, step 1 shows the
  // untouched expression (explainer "Scan the question"), and each later
  // step moves through highlight -> rewrite just like the explanation list.
  const visualIdx = Math.min(
    Math.max(stepIndex - 1, 0),
    displayExpressions.length - 1
  );

  const currentDisplay = displayExpressions[visualIdx];

  return (
    <div className="p-4 bg-white rounded-lg shadow-md flex flex-col items-center justify-center min-h-[400px] w-[400px] mx-auto">
      {stepIndex === 0 ? (
        renderPyramid(4)
      ) : (
        <div
          className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2 flex-wrap my-6 text-center"
          dangerouslySetInnerHTML={{ __html: currentDisplay }}
        />
      )}
    </div>
  );
};

export default BIDMASVisualizer;
