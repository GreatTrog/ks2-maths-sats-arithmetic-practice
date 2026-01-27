import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Question, QuestionType, TestQuestion, TestQuestionMark, TestQuestionResponse, TestResponseEntry, TestSession } from './types';
import { generateQuestionByType, generateNewQuestion } from './services/questionService';
import { generateTestPaper, TEST_PAPER_VERSION, generatePupilAlias } from './services/testPaperService';
import { generateWeeklyPractice, buildWeeklyPracticeHtml } from './services/practiceGeneratorService';
import { getBakedExplanation } from './services/explanationService';
import AdditionVisualizer from './components/visualizers/AdditionVisualizer';
import SubtractionVisualizer from './components/visualizers/SubtractionVisualizer';
import ShortMultiplicationVisualizer from './components/visualizers/ShortMultiplicationVisualizer';
import LongMultiplicationVisualizer from './components/visualizers/LongMultiplicationVisualizer';
import { Multiplication3NumbersVisualizer } from './components/visualizers/Multiplication3NumbersVisualizer';
import ShortDivisionVisualizer from './components/visualizers/ShortDivisionVisualizer';
import LongDivisionVisualizer from './components/visualizers/LongDivisionVisualizer';
import DivisionKnownFactsVisualizer from './components/visualizers/DivisionKnownFactsVisualizer';
import MultiplyByPowersOfTenVisualizer from './components/visualizers/MultiplyByPowersOfTenVisualizer';
import DivideByPowersOfTenVisualizer from './components/visualizers/DivideByPowersOfTenVisualizer';
import PowersIndicesVisualizer from './components/visualizers/PowersIndicesVisualizer';
import FractionSubtractionVisualizer from './components/visualizers/FractionSubtractionVisualizer';
import FractionMultiplication2DigitVisualizer from './components/visualizers/FractionMultiplication2DigitVisualizer';
import FractionDivisionVisualizer from './components/visualizers/FractionDivisionVisualizer';
import DecimalAdditionVisualizer from './components/visualizers/DecimalAdditionVisualizer';
import DecimalSubtractionVisualizer from './components/visualizers/DecimalSubtractionVisualizer';
import DecimalMultiplicationVisualizer from './components/visualizers/DecimalMultiplicationVisualizer';
import FractionsOfAmountsVisualizer from './components/visualizers/FractionsOfAmountsVisualizer';
import DecimalLongMultiplicationVisualizer from './components/visualizers/DecimalLongMultiplicationVisualizer';
import FractionMultiplicationVisualizer from './components/visualizers/FractionMultiplicationVisualizer';
import MixedNumberAdditionVisualizer from './components/visualizers/MixedNumberAdditionVisualizer';
import MixedNumberMultiplicationVisualizer from './components/visualizers/MixedNumberMultiplicationVisualizer';
import FractionBarVisualizer from './components/visualizers/FractionBarVisualizer';
import PercentagesOfAmountsVisualizer from './components/visualizers/PercentagesOfAmountsVisualizer';
import BIDMASVisualizer from './components/visualizers/BIDMASVisualizer';
import WorkingOutCanvas from './components/WorkingOutCanvas';
import Fraction from './components/Fraction';

// --- Icons ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpeakerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-all duration-300 ${filled ? 'text-yellow-400 fill-current scale-110' : 'text-gray-300 scale-100'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={filled ? 0 : 2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// --- Helper Components ---

const PracticeTracker: React.FC<{ count: number }> = ({ count }) => (
  <div className="flex space-x-3 justify-center mb-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="transform transition-transform hover:scale-110">
        <StarIcon filled={i <= count} />
      </div>
    ))}
  </div>
);

const renderTextWithFractions = (text: string) => {
  // Regex for:
  // 1. Mixed number: "1 1/2"
  // 2. Simple fraction: "1/2"
  const regex = /(\d+\s+\d+\/\d+)|(\d+\/\d+)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.match(regex)) {
      const mixedMatch = part.match(/^(\d+)\s+(\d+)\/(\d+)$/);
      if (mixedMatch) {
        return <Fraction key={i} whole={mixedMatch[1]} numerator={mixedMatch[2]} denominator={mixedMatch[3]} />;
      }
      const fractionMatch = part.match(/^(\d+)\/(\d+)$/);
      if (fractionMatch) {
        return <Fraction key={i} numerator={fractionMatch[1]} denominator={fractionMatch[2]} />;
      }
    }
    return <span key={i}>{part}</span>;
  });
};

const renderPromptParts = (text: string) => {
  const parts = text.split(BLANK_TOKEN);
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {renderTextWithFractions(part)}
          {index < parts.length - 1 && (
            <span className="inline-block align-middle border-4 border-blue-600 w-24 h-12 mx-2 rounded-sm" />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

const QuestionDisplay: React.FC<{ question: Question }> = ({ question }) => {
  const isPlaceValue = question.type === QuestionType.PlaceValue;
  const isBidmas = question.type === QuestionType.BIDMAS;

  return (
    <div className="text-center">
      <div
        className={`${isPlaceValue
          ? 'text-lg md:text-lg'
          : isBidmas
            ? 'text-3xl md:text-5xl'   // adjust these sizes as you like
            : 'text-5xl md:text-7xl'
          } font-black text-gray-800 tracking-tight mb-4 font-mono`}
      >
        {renderPromptParts(question.text)}
      </div>
      {question.type.includes('Fraction') && (
        <div className="text-gray-500 text-lg italic">
          (Enter fractions like 1/2 or 1 1/2)
        </div>
      )}
    </div>
  );
};

const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  // First split by bold markers
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-primary">
              {renderTextWithFractions(part.slice(2, -2))}
            </strong>
          );
        }
        // Now handle italics within non-bold parts
        const italicParts = part.split(/(\*.*?\*)/g);
        return (
          <span key={i}>
            {italicParts.map((iPart, j) => {
              if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
                return (
                  <em key={j} className="italic">
                    {renderTextWithFractions(iPart.slice(1, -1))}
                  </em>
                );
              }
              return <span key={j}>{renderTextWithFractions(iPart)}</span>;
            })}
          </span>
        );
      })}
    </span>
  );
};

const StepByStepGuidancePanel: React.FC<{
  steps: string[],
  onContinue: () => void,
  speakText: (text: string) => void,
  question: Question
}> = ({ steps, onContinue, speakText, question }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  const handleNextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  return (
    <div className="mt-6 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-primary/20 animate-fade-in-up w-full max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary flex items-center gap-2">
          <span>💡</span> Let's solve it together!
        </h3>
        {!showAllSteps && (
          <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Step {stepIndex + 1} of {steps.length}
          </div>
        )}
      </div>

      {showAllSteps ? (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {steps.map((step, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </div>
              <div className="text-lg text-gray-700 font-medium leading-relaxed">
                <FormattedText text={step} />
                <button
                  onClick={() => speakText(step)}
                  className="ml-2 inline-block text-gray-400 hover:text-primary transition-colors align-middle"
                  title="Read step"
                >
                  <SpeakerIcon />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-4 text-center">
            <button
              onClick={() => setShowAllSteps(false)}
              className="text-primary font-bold hover:underline"
            >
              Show Step-by-Step View
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Text Explanation */}
          <div className="flex-1 space-y-4">
            <div className="text-lg text-gray-700 font-medium leading-relaxed flex items-start gap-2">
              <div className="flex-1">
                <FormattedText text={steps[stepIndex]} />
              </div>
              <button
                onClick={() => speakText(steps[stepIndex])}
                className="flex-shrink-0 text-gray-400 hover:text-primary transition-colors mt-1"
                title="Read step"
              >
                <SpeakerIcon />
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePrevStep}
                disabled={stepIndex === 0}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2
                          ${stepIndex === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:shadow-md'
                  }`}
              >
                <span>←</span> Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={stepIndex === steps.length - 1}
                className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                          ${stepIndex === steps.length - 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white'
                  }`}
              >
                Next Step →
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAllSteps(true)}
                className="flex-1 py-2 px-4 rounded-xl font-bold text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                View All Steps
              </button>
              <button
                onClick={onContinue}
                className="flex-1 py-2 px-4 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md hover:shadow-lg"
              >
                Ready to Practice! 🚀
              </button>
            </div>
          </div>

          {/* Visualizer */}
          <div className="flex-shrink-0 flex justify-center md:justify-end overflow-x-auto pb-4">
            {question.type === QuestionType.Addition && (
              <AdditionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {(question.type === QuestionType.Subtraction || question.type === QuestionType.SubtractionWithRegrouping) && (
              <SubtractionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.Multiplication3Numbers && (
              <Multiplication3NumbersVisualizer question={question} />
            )}
            {question.type === QuestionType.Multiplication && (
              <ShortMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.LongMultiplication && (
              <LongMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.Division && (
              <ShortDivisionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.LongDivision && (
              <LongDivisionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.DivisionWithKnownFacts && (
              <DivisionKnownFactsVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.BIDMAS && (
              <BIDMASVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.MultiplyBy10_100_1000 && (
              <MultiplyByPowersOfTenVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.DivideBy10_100_1000 && (
              <DivideByPowersOfTenVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.PowersIndices && (
              <PowersIndicesVisualizer question={question} />
            )}
            {question.type === QuestionType.DecimalAddition && (
              <DecimalAdditionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.DecimalSubtraction && (
              <DecimalSubtractionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.DecimalMultiplication && (
              <DecimalMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.DecimalMultiplication2Digit && (
              <DecimalLongMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionsOfAmounts && (
              <FractionsOfAmountsVisualizer question={question} stepIndex={stepIndex} />
            )}
            {(question.type === QuestionType.FractionAdditionSimpleDenominators ||
              question.type === QuestionType.FractionAdditionUnlikeDenominators ||
              question.type === QuestionType.FractionSubtractionSimpleDenominators ||
              question.type === QuestionType.FractionSubtractionUnlikeDenominators) && (
                <FractionBarVisualizer question={question} stepIndex={stepIndex} />
              )}
            {question.type === QuestionType.FractionAdditionMixedNumbers && (
              <MixedNumberAdditionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionSubtractionMixedNumbers && (
              <FractionSubtractionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionMultiplication && (
              <FractionMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionMultiplicationMixedNumbers && (
              <MixedNumberMultiplicationVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionMultiplication2Digit && (
              <FractionMultiplication2DigitVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.FractionDivision && (
              <FractionDivisionVisualizer question={question} stepIndex={stepIndex} />
            )}
            {question.type === QuestionType.Percentages && (
              <PercentagesOfAmountsVisualizer question={question} stepIndex={stepIndex} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const questionTypes = Object.values(QuestionType);

// Helper to parse fraction string into {n, d}
const parseFraction = (text: string): { n: number, d: number } | null => {
  text = text.trim();
  if (!text) return null;

  // Mixed number: "1 1/2"
  const mixedMatch = text.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const w = parseInt(mixedMatch[1], 10);
    const n = parseInt(mixedMatch[2], 10);
    const d = parseInt(mixedMatch[3], 10);
    if (d === 0) return null;
    return { n: w * d + n, d };
  }

  // Simple fraction: "1/2"
  const fractionMatch = text.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const n = parseInt(fractionMatch[1], 10);
    const d = parseInt(fractionMatch[2], 10);
    if (d === 0) return null;
    return { n, d };
  }

  // Whole number: "3"
  if (/^\d+$/.test(text)) {
    return { n: parseInt(text, 10), d: 1 };
  }

  return null;
};

// Helper to check fraction equivalence
const areFractionsEquivalent = (ans1: string, ans2: string): boolean => {
  const f1 = parseFraction(ans1);
  const f2 = parseFraction(ans2);

  if (!f1 || !f2) {
    // Fallback to simple string comparison if parsing fails
    return ans1.trim() === ans2.trim();
  }

  // Cross-multiply to check equivalence: n1/d1 == n2/d2 <=> n1*d2 == n2*d1
  return f1.n * f2.d === f2.n * f1.d;
};

// Helper for speech
const sanitizeForSpeech = (text: string) => {
  return text
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/(\d+)\/(\d+)/g, '$1 over $2') // Fractions
    .replace(/×/g, ' times ')  // Multiplication symbol
    .replace(/÷/g, ' divided by ')  // Division symbol
    .replace(/-/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' equals ');
};

// Helper for timer format
const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const TEST_SESSION_STORAGE_KEY = 'ks2-sats-test-session-v1';
const TEST_MODE_VERSION = 'practice-test-v1';
const TEST_DURATION_OPTIONS = [
  { label: '30:00', seconds: 30 * 60 },
  { label: '32:30', seconds: 32 * 60 + 30 },
  { label: '35:00', seconds: 35 * 60 },
  { label: '37:30', seconds: 37 * 60 + 30 },
  { label: '40:00', seconds: 40 * 60 },
];

const normalizeInput = (text: string) => text.trim().replace(/,/g, '').replace(/\s+/g, ' ');

const normalizeNumericString = (text: string) => {
  const clean = normalizeInput(text);
  if (!/^-?\d+(\.\d+)?$/.test(clean)) return clean;
  const parsed = Number(clean);
  if (Number.isNaN(parsed)) return clean;
  return parsed.toString();
};

const parseRemainderAnswer = (text: string) => {
  const match = normalizeInput(text)
    .replace(/,/g, '')
    .match(/^(\d+)\s*(?:r\.?|rem|remainder)\s*(\d+)$/i);
  if (!match) return null;
  return { quotient: match[1], remainder: match[2] };
};

const BLANK_TOKEN = '[blank]';

const parseDivisionPrompt = (prompt: string) => {
  const match = prompt.replace(/,/g, '').match(/(\d+)\s*÷\s*(\d+)/);
  if (!match) return null;
  return { dividend: Number(match[1]), divisor: Number(match[2]) };
};

const fractionToDecimal = (text: string) => {
  const fraction = parseFraction(text);
  if (!fraction) return null;
  return fraction.n / fraction.d;
};

const isFractionQuestionType = (type: QuestionType) => [
  QuestionType.FractionAdditionSimpleDenominators,
  QuestionType.FractionAdditionUnlikeDenominators,
  QuestionType.FractionAdditionMixedNumbers,
  QuestionType.FractionSubtractionSimpleDenominators,
  QuestionType.FractionSubtractionUnlikeDenominators,
  QuestionType.FractionSubtractionMixedNumbers,
  QuestionType.FractionMultiplication,
  QuestionType.FractionMultiplicationMixedNumbers,
  QuestionType.FractionDivision,
  QuestionType.FractionMultiplication2Digit,
].includes(type);

const escapeHtml = (text: string) => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const openPrintWindow = (title: string, bodyHtml: string) => {
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body>
        ${bodyHtml || '<p>Nothing to print yet.</p>'}
      </body>
    </html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  win.onload = () => {
    win.focus();
    win.print();
    URL.revokeObjectURL(url);
  };
};

const normalizePromptSymbols = (text: string) =>
  text
    .replace(/\u0627-/g, '\u00d7')
    .replace(/\u0627\u0652/g, '\u00f7')
    .replace(/ƒ"'/g, '⟌')
    .replace(/\u2502/g, '⟌');

const formatDate = (isoDate?: string) => {
  const date = isoDate ? new Date(isoDate) : new Date();
  return date.toLocaleDateString('en-GB');
};

const computeTestMarks = (session: TestSession): { marks: TestQuestionMark[]; total: number } => {
  const marks: TestQuestionMark[] = session.questions.map((question) => {
    const response = session.responses[question.questionId]?.latest;
    if (!response || !response.rawInput.trim()) {
      return { questionId: question.questionId, slotNumber: question.slotNumber, marksAwarded: 0 };
    }

    let isCorrect = false;
    if (isFractionQuestionType(question.type)) {
      isCorrect = areFractionsEquivalent(response.rawInput, question.correctAnswer);
    } else {
      const expectedRemainder = parseRemainderAnswer(question.correctAnswer);
      const givenRemainder = parseRemainderAnswer(response.rawInput);
      if (expectedRemainder) {
        const remainderMatches = Boolean(
          givenRemainder &&
          expectedRemainder.quotient === givenRemainder.quotient &&
          expectedRemainder.remainder === givenRemainder.remainder,
        );

        const promptDivision = parseDivisionPrompt(question.prompt);
        const expectedValue = promptDivision ? promptDivision.dividend / promptDivision.divisor : null;
        const numericAnswer = Number(normalizeNumericString(response.normalizedInput || response.rawInput));
        const decimalMatches = Number.isFinite(numericAnswer) && expectedValue !== null
          ? Math.abs(numericAnswer - expectedValue) < 1e-9
          : false;

        const fractionValue = fractionToDecimal(response.rawInput);
        const fractionMatches = expectedValue !== null && fractionValue !== null
          ? Math.abs(fractionValue - expectedValue) < 1e-9
          : false;

        isCorrect = remainderMatches || decimalMatches || fractionMatches;
      } else {
        const expected = normalizeNumericString(question.correctAnswer);
        const given = normalizeNumericString(response.normalizedInput || response.rawInput);
        isCorrect = expected === given;
      }
    }

    return {
      questionId: question.questionId,
      slotNumber: question.slotNumber,
      marksAwarded: isCorrect ? question.markValue : 0,
    };
  });

  const total = marks.reduce((sum, mark) => sum + mark.marksAwarded, 0);
  return { marks, total };
};

const fractionToHtml = (text: string) => {
  const regex = /(\d+\s+\d+\/\d+)|(\d+\/\d+)/g;
  return text.replace(regex, (match) => {
    const mixedMatch = match.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      return `<span class="frac-mixed">
          <span class="frac-whole">${mixedMatch[1]}</span>
          <span class="frac-stacked">
              <span class="frac-num">${mixedMatch[2]}</span>
              <span class="frac-den">${mixedMatch[3]}</span>
          </span>
      </span>`;
    }
    const fractionMatch = match.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      return `<span class="frac-stacked">
          <span class="frac-num">${fractionMatch[1]}</span>
          <span class="frac-den">${fractionMatch[2]}</span>
      </span>`;
    }
    return match;
  });
};

const formatPromptHtml = (text: string) => fractionToHtml(escapeHtml(text)).split(BLANK_TOKEN).join('<span class="blank-box"></span>');

const buildTestPaperHtml = (session: TestSession) => {
  const questionsHtml = session.questions.map((question) => {
    const gridId = `grid-${question.slotNumber}`;
    return `
    <div class="question">
      <div class="q-number">${question.slotNumber}</div>
      <div class="q-main">
        <div class="prompt">${formatPromptHtml(question.prompt)}</div>
        <div class="grid">
          <svg class="grid-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <defs>
              <pattern id="${gridId}" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#${gridId})" />
          </svg>
        </div>
      </div>
      <div class="q-mark">${question.markValue} mark${question.markValue > 1 ? 's' : ''}</div>
    </div>
  `;
  }).join('');

  return `
    <style>
      @page { size: A4 portrait; margin: 18mm; }
      body { font-family: "Georgia", "Times New Roman", serif; color: #111; margin: 24px; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 18px; }
      .title { font-size: 24px; font-weight: 700; }
      .meta { font-size: 14px; }
      .question { display: grid; grid-template-columns: 48px 1fr 90px; border: 1px solid #444; margin-bottom: 12px; min-height: 150px; break-inside: avoid; page-break-inside: avoid; }
      .q-number { background: #dfe6f5; font-weight: 700; font-size: 18px; display: flex; align-items: flex-start; justify-content: center; padding-top: 10px; border-right: 1px solid #444; }
      .q-main { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
      .prompt { font-size: 20px; font-weight: 700; }
      .grid { flex: 1; min-height: 110px; border-top: 1px solid #888; }
      .grid-svg { width: 100%; height: 100%; display: block; }
      .blank-box { display: inline-block; width: 90px; height: 36px; border: 3px solid #2563eb; vertical-align: middle; margin: 0 8px; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .question:nth-of-type(4n) { break-after: page; page-break-after: always; }
      }
      .q-mark { background: #dfe6f5; border-left: 1px solid #444; display: flex; align-items: flex-end; justify-content: center; font-size: 12px; font-weight: 700; padding-bottom: 10px; }
      .frac-mixed { display: inline-flex; align-items: center; vertical-align: middle; }
      .frac-whole { font-weight: 700; margin-right: 4px; font-size: 1.1em; }
      .frac-stacked { display: inline-flex; flex-direction: column; text-align: center; line-height: 1; vertical-align: middle; margin: 0 2px; }
      .frac-num { border-bottom: 2px solid currentColor; padding: 0 2px 2px 2px; font-weight: 700; }
      .frac-den { padding: 2px 2px 0 2px; font-weight: 700; }
    </style>
    <div class="header">
      <div>
        <div class="title">KS2 Arithmetic Practice Test</div>
        <div class="meta">Pupil: <strong>${session.pupilAlias || '____________________________'}</strong></div>
      </div>
      <div class="meta">Date: ${formatDate()}</div>
    </div>
    ${questionsHtml}
  `;
};

const buildAnswerSheetHtml = (session: TestSession) => {
  const rows = session.questions.map((question) => `
    <tr>
      <td>${question.slotNumber}</td>
      <td>${fractionToHtml(escapeHtml(question.correctAnswer))}</td>
      <td>${question.markValue}</td>
    </tr>
  `).join('');

  return `
    <style>
      body { font-family: "Georgia", "Times New Roman", serif; color: #111; margin: 24px; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 14px; }
      th { background: #f2f2f2; }
    </style>
    <h1>Answer Sheet</h1>
    <table>
      <thead>
        <tr>
          <th>Question</th>
          <th>Correct answer</th>
          <th>Marks</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const buildCombinedPaperHtml = (session: TestSession) => `
  <style>
    .page-break { break-before: page; page-break-before: always; }
  </style>
  ${buildTestPaperHtml(session)}
  <div class="page-break"></div>
  ${buildAnswerSheetHtml(session)}
`;

const buildShortFormPaperHtml = (session: TestSession) => {
  const rows = session.questions.map((question) => `
    <tr>
      <td class="q-num">${question.slotNumber}</td>
      <td class="q-prompt">${formatPromptHtml(question.prompt)}</td>
      <td class="q-box"><span class="blank-box short-box"></span></td>
      <td class="q-mark">${question.markValue}</td>
    </tr>
  `).join('');

  return `
    <style>
      .page-break { break-before: page; page-break-before: always; }
      @page { size: A4 portrait; margin: 12mm; }
      body { font-family: "Georgia", "Times New Roman", serif; color: #111; margin: 12px; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
      .title { font-size: 20px; font-weight: 700; }
      .meta { font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #333; padding: 6px; vertical-align: middle; }
      th { background: #f2f2f2; text-align: left; }
      .q-num { width: 36px; text-align: center; font-weight: 700; }
      .q-prompt { font-weight: 600; }
      .q-box { width: 90px; text-align: center; }
      .q-mark { width: 40px; text-align: center; font-weight: 700; }
      .short-box { width: 70px; height: 28px; border-width: 2px; }
      .frac-mixed { display: inline-flex; align-items: center; vertical-align: middle; }
      .frac-whole { font-weight: 700; margin-right: 3px; }
      .frac-stacked { display: inline-flex; flex-direction: column; text-align: center; line-height: 1; vertical-align: middle; }
      .frac-num { border-bottom: 1.5px solid currentColor; padding: 0 1px 1px 1px; font-weight: 600; }
      .frac-den { padding: 1px 1px 0 1px; font-weight: 600; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
    <div class="header">
      <div>
        <div class="title">KS2 Arithmetic Short Form</div>
        <div class="meta">Pupil: <strong>${session.pupilAlias || '____________________________'}</strong></div>
      </div>
      <div class="meta">Date: ${formatDate()}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Q</th>
          <th>Question</th>
          <th>Answer</th>
          <th>Marks</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="page-break"></div>
    ${buildAnswerSheetHtml(session)}
  `;
};

const buildSummaryHtml = (session: TestSession) => {
  const marksLookup = new Map(session.marks?.map((mark) => [mark.questionId, mark.marksAwarded]) ?? []);
  const rows = session.questions.map((question) => {
    const response = session.responses[question.questionId]?.latest;
    const pupilAnswer = response?.rawInput ?? '';
    const awarded = marksLookup.get(question.questionId) ?? 0;
    return `
      <tr>
        <td>${question.slotNumber}</td>
        <td>${formatPromptHtml(question.prompt)}</td>
        <td>${question.markValue}</td>
        <td>${fractionToHtml(escapeHtml(pupilAnswer))}</td>
        <td>${fractionToHtml(escapeHtml(question.correctAnswer))}</td>
        <td>${awarded}</td>
      </tr>
    `;
  }).join('');

  return `
    <style>
      body { font-family: "Georgia", "Times New Roman", serif; color: #111; margin: 24px; }
      .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 18px; }
      .title { font-size: 24px; font-weight: 700; }
      .meta { font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #333; padding: 6px; text-align: left; vertical-align: top; }
      th { background: #f2f2f2; }
      .frac-mixed { display: inline-flex; align-items: center; vertical-align: middle; }
      .frac-whole { font-weight: 700; margin-right: 3px; }
      .frac-stacked { display: inline-flex; flex-direction: column; text-align: center; line-height: 1.1; vertical-align: middle; }
      .frac-num { border-bottom: 1.5px solid currentColor; padding: 0 1px 1px 1px; font-weight: 600; }
      .frac-den { padding: 1px 1px 0 1px; font-weight: 600; }
    </style>
    <div class="header">
      <div>
        <div class="title">Practice Test Summary</div>
        <div class="meta">Pupil: <strong>${session.pupilAlias || '____________________________'}</strong></div>
        <div class="meta">Date: ${formatDate()}</div>
      </div>
      <div class="meta">
        Duration: ${formatCountdown(session.durationSeconds)}<br/>
        Score: ${session.totalMarksAwarded ?? 0} / 40
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Q</th>
          <th>Prompt</th>
          <th>Marks</th>
          <th>Pupil answer</th>
          <th>Correct answer</th>
          <th>Awarded</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

// Mastery Popup Component
const MasteryPopup: React.FC<{
  onSelectTopic: (topic: QuestionType) => void;
  onSelectRandom: () => void;
  questionTypes: string[];
}> = ({ onSelectTopic, onSelectRandom, questionTypes }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-yellow-400 animate-bounce-in relative">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-6xl">
          🏆
        </div>
        <h2 className="text-3xl font-black text-yellow-500 mb-4 mt-6">Congratulations!</h2>
        <p className="text-gray-600 mb-8 text-lg font-medium">You have mastered this topic!</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Choose another topic:</label>
            <div className="relative">
              <select
                onChange={(e) => onSelectTopic(e.target.value as QuestionType)}
                className="block w-full pl-4 pr-10 py-3 text-lg border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary rounded-xl shadow-sm bg-white appearance-none cursor-pointer transition-all hover:border-primary text-gray-700"
                defaultValue=""
              >
                <option value="" disabled>Select a topic...</option>
                {questionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t-2 border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 font-bold text-sm">OR</span>
            <div className="flex-grow border-t-2 border-gray-100"></div>
          </div>

          <button
            onClick={onSelectRandom}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🎲</span> Let me pick a random question
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'hidden' | 'correct' | 'incorrect' | 'timeout'>('hidden');
  const [isAnswering, setIsAnswering] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<QuestionType | 'All'>('All');
  const [explanation, setExplanation] = useState<string[] | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showMasteryPopup, setShowMasteryPopup] = useState(false);

  // Practice Mode State
  const [practiceState, setPracticeState] = useState<{ type: QuestionType, correctInARow: number } | null>(null);
  const [practiceTimerSeconds, setPracticeTimerSeconds] = useState<number>(0); // 0 means no timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const practiceTimerOptions = [
    { label: 'No Timer', seconds: 0 },
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '2m', seconds: 120 },
  ];

  // Test Mode State
  const [mode, setMode] = useState<'practice' | 'test'>('practice');
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [testCurrentIndex, setTestCurrentIndex] = useState(0);
  const [testAnswerInput, setTestAnswerInput] = useState('');
  const [testDurationSeconds, setTestDurationSeconds] = useState(TEST_DURATION_OPTIONS[0].seconds);
  const [testSecondsRemaining, setTestSecondsRemaining] = useState(0);
  const [showTestDurationPrompt, setShowTestDurationPrompt] = useState(false);

  // Speech Synthesis
  const [britishVoice, setBritishVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const gbVoice = voices.find(voice => voice.lang === 'en-GB' && voice.name.includes('Google')) || voices.find(voice => voice.lang === 'en-GB');
      setBritishVoice(gbVoice || null);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const storedSession = localStorage.getItem(TEST_SESSION_STORAGE_KEY);
    if (!storedSession) return;
    try {
      const parsed: TestSession = JSON.parse(storedSession);
      parsed.questions = parsed.questions.map((question) => ({
        ...question,
        prompt: normalizePromptSymbols(question.prompt),
      }));
      if (!parsed.completedAt) {
        const remaining = Math.max(0, Math.floor((new Date(parsed.endsAt).getTime() - Date.now()) / 1000));
        if (remaining === 0) {
          const { marks, total } = computeTestMarks(parsed);
          parsed.marks = marks;
          parsed.totalMarksAwarded = total;
          parsed.completedAt = new Date().toISOString();
          setTestSecondsRemaining(0);
        } else {
          setTestSecondsRemaining(remaining);
        }
      }
      setTestSession(parsed);
      setMode('test');
      setTestDurationSeconds(parsed.durationSeconds);
      const firstUnanswered = parsed.questions.findIndex((q) => {
        const response = parsed.responses[q.questionId]?.latest;
        return !response || !response.rawInput.trim();
      });
      setTestCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    } catch (error) {
      console.warn('Failed to load test session', error);
    }
  }, []);

  useEffect(() => {
    if (!testSession) return;
    const updatedQuestions = testSession.questions.map((question) => {
      const normalizedPrompt = normalizePromptSymbols(question.prompt);
      return normalizedPrompt === question.prompt ? question : { ...question, prompt: normalizedPrompt };
    });
    const hasChanges = updatedQuestions.some((question, index) => question !== testSession.questions[index]);
    if (hasChanges) {
      setTestSession({ ...testSession, questions: updatedQuestions });
    }
  }, [testSession]);

  useEffect(() => {
    if (testSession) {
      localStorage.setItem(TEST_SESSION_STORAGE_KEY, JSON.stringify(testSession));
    } else {
      localStorage.removeItem(TEST_SESSION_STORAGE_KEY);
    }
  }, [testSession]);

  // Timer transition ref
  const timeUpTransitionRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const testInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (timeUpTransitionRef.current) {
        clearTimeout(timeUpTransitionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mode === 'practice' && isAnswering && inputRef.current && !showMasteryPopup) {
      // Small timeout to ensure DOM is ready and transition is complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [currentQuestion, isAnswering, showMasteryPopup, mode]);

  useEffect(() => {
    if (mode === 'test' && testInputRef.current && testSession && !testSession.completedAt) {
      setTimeout(() => {
        testInputRef.current?.focus();
      }, 50);
    }
  }, [mode, testCurrentIndex, testSession?.completedAt, testSession]);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
    if (britishVoice) {
      utterance.voice = britishVoice;
    }
    utterance.pitch = 1;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [britishVoice]);

  const resetForNewQuestion = (question: Question) => {
    setCurrentQuestion(question);
    setUserAnswer('');
    setFeedback('hidden');
    setIsAnswering(true);
    setIsAnswering(true);
    setExplanation(null);
    setShowCanvas(false); // Hide canvas on new question
  }

  const startNewQuestion = useCallback((typeToExclude?: QuestionType) => {
    const newQ = generateNewQuestion(typeToExclude);
    resetForNewQuestion(newQ);
  }, []);

  const startPracticeQuestion = useCallback(() => {
    if (practiceState) {
      const newQ = generateQuestionByType(practiceState.type, practiceState.correctInARow);
      resetForNewQuestion(newQ);
    } else {
      // If no practice state (e.g. All Topics), generate a random new question
      startNewQuestion();
    }
  }, [practiceState, startNewQuestion]);

  const createNewTestSession = useCallback((durationSeconds: number) => {
    const startedAt = new Date().toISOString();
    const session: TestSession = {
      sessionId: (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `session_${Date.now()}`,
      startedAt,
      durationSeconds,
      endsAt: new Date(Date.now() + durationSeconds * 1000).toISOString(),
      paperVersion: TEST_PAPER_VERSION,
      modeVersion: TEST_MODE_VERSION,
      questions: generateTestPaper(),
      responses: {},
      marks: null,
      totalMarksAwarded: null,
      completedAt: null,
      pupilAlias: generatePupilAlias(),
    };
    setTestSession(session);
    setTestCurrentIndex(0);
    setTestAnswerInput('');
    setTestSecondsRemaining(durationSeconds);
    setMode('test');
  }, []);

  const updateTestResponse = useCallback((questionId: string, rawInput: string) => {
    const normalizedInput = normalizeInput(rawInput);
    const entry: TestResponseEntry = {
      rawInput,
      normalizedInput,
      submittedAt: new Date().toISOString(),
    };

    setTestSession((prev) => {
      if (!prev) return prev;
      const existing = prev.responses[questionId];
      const history = existing?.history ? [...existing.history] : [];
      if (existing?.latest && existing.latest.rawInput !== rawInput) {
        history.push(existing.latest);
      }
      const updatedResponses: Record<string, TestQuestionResponse> = {
        ...prev.responses,
        [questionId]: {
          latest: entry,
          history,
        },
      };
      return { ...prev, responses: updatedResponses };
    });
  }, []);

  const finalizeTestSession = useCallback((reason: 'manual' | 'timeout') => {
    setTestSession((prev) => {
      if (!prev || prev.completedAt) return prev;
      const { marks, total } = computeTestMarks(prev);
      return {
        ...prev,
        marks,
        totalMarksAwarded: total,
        completedAt: new Date().toISOString(),
      };
    });
    setTestSecondsRemaining(0);
    if (reason === 'timeout') {
      speakText("Time's up! Your test has finished.");
    }
  }, [speakText]);

  const handleTimerExpire = useCallback(() => {
    if (!currentQuestion) return;

    setFeedback('timeout');
    setIsAnswering(false);
    setExplanation(null);
    setPracticeState({ type: currentQuestion.type, correctInARow: 0 });
    setSelectedTopic(currentQuestion.type);
    setSecondsRemaining(0);
    speakText("Time's up! Keep calm and try again.");

    if (timeUpTransitionRef.current) {
      clearTimeout(timeUpTransitionRef.current);
    }
    timeUpTransitionRef.current = setTimeout(() => {
      startPracticeQuestion();
    }, 1500);
  }, [currentQuestion, startPracticeQuestion, speakText]);

  useEffect(() => {
    if (selectedTopic === 'All') {
      startNewQuestion();
    } else {
      const newQ = generateQuestionByType(selectedTopic);
      resetForNewQuestion(newQ);
      if (!practiceState || practiceState.type !== selectedTopic) {
        setPracticeState({ type: selectedTopic, correctInARow: 0 });
      }
    }
  }, [selectedTopic, startNewQuestion]);

  const handleTopicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTopic = event.target.value as QuestionType | 'All';
    setSelectedTopic(newTopic);
    if (newTopic === 'All') {
      setPracticeState(null);
    }
  };

  useEffect(() => {
    if (mode !== 'practice' || practiceTimerSeconds <= 0 || !practiceState || !currentQuestion || !isAnswering) {
      setSecondsRemaining(practiceTimerSeconds);
      return;
    }

    setSecondsRemaining(practiceTimerSeconds);
    const intervalId = setInterval(() => {
      setSecondsRemaining((prevSeconds) => {
        if (prevSeconds <= 1) {
          clearInterval(intervalId);
          handleTimerExpire();
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [practiceTimerSeconds, practiceState, currentQuestion, isAnswering, handleTimerExpire, mode]);

  useEffect(() => {
    if (!testSession || testSession.completedAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(testSession.endsAt).getTime() - Date.now()) / 1000));
      setTestSecondsRemaining(remaining);
      if (remaining <= 0) {
        finalizeTestSession('timeout');
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [testSession, finalizeTestSession]);

  useEffect(() => {
    if (!testSession) return;
    const activeQuestion = testSession.questions[testCurrentIndex];
    if (!activeQuestion) return;
    const response = testSession.responses[activeQuestion.questionId]?.latest;
    setTestAnswerInput(response?.rawInput ?? '');
  }, [testCurrentIndex, testSession]);


  const handleCheckAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;

    const fractionTypes = [
      QuestionType.FractionAdditionSimpleDenominators,
      QuestionType.FractionAdditionUnlikeDenominators,
      QuestionType.FractionAdditionMixedNumbers,
      QuestionType.FractionSubtractionSimpleDenominators,
      QuestionType.FractionSubtractionUnlikeDenominators,
      QuestionType.FractionSubtractionMixedNumbers,
      QuestionType.FractionMultiplication,
      QuestionType.FractionMultiplicationMixedNumbers,
      QuestionType.FractionMultiplication2Digit,
      QuestionType.FractionDivision,
    ];

    let isCorrect = false;
    const sanitizedUserAnswer = userAnswer.trim().replace(/,/g, '');
    const sanitizedCorrectAnswer = currentQuestion.answer.replace(/,/g, '');

    if (fractionTypes.includes(currentQuestion.type)) {
      isCorrect = areFractionsEquivalent(userAnswer, currentQuestion.answer);
    } else {
      isCorrect = sanitizedUserAnswer === sanitizedCorrectAnswer;
    }

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setIsAnswering(false);

    if (isCorrect) {
      if (practiceState) {
        const newCount = practiceState.correctInARow + 1;
        setPracticeState({ ...practiceState, correctInARow: newCount });

        if (newCount >= 5) {
          // Mastery achieved!
          setTimeout(() => {
            setShowMasteryPopup(true);
            speakText("Congratulations, you have mastered this topic!");
          }, 1500);
        } else {
          setTimeout(startPracticeQuestion, 1500);
        }
      } else {
        setTimeout(() => startNewQuestion(currentQuestion.type), 1500);
      }
    } else {
      setPracticeState({ type: currentQuestion.type, correctInARow: 0 });
      setSelectedTopic(currentQuestion.type);
      const expl = getBakedExplanation(currentQuestion);
      setExplanation(expl);
    }
  };

  const handleMasterySelectTopic = (topic: QuestionType) => {
    setShowMasteryPopup(false);
    setSelectedTopic(topic);
    // practiceState will be updated by the useEffect on selectedTopic
  };

  const handleMasterySelectRandom = () => {
    setShowMasteryPopup(false);
    setSelectedTopic('All');
    setPracticeState(null);
    startNewQuestion();
  };

  const activeTestQuestion = testSession?.questions[testCurrentIndex] ?? null;
  const activeTestMark = testSession?.marks?.find((mark) => mark.questionId === activeTestQuestion?.questionId);
  const workingOutQuestion = useMemo(() => {
    if (mode === 'test' && activeTestQuestion) {
      return {
        type: activeTestQuestion.type,
        text: activeTestQuestion.prompt,
        answer: activeTestQuestion.correctAnswer,
        bidmasMetadata: activeTestQuestion.bidmasMetadata,
      };
    }
    return currentQuestion;
  }, [mode, activeTestQuestion, currentQuestion]);

  const handleTestAnswerChange = (value: string) => {
    setTestAnswerInput(value);
    if (!testSession || testSession.completedAt || !activeTestQuestion) return;
    updateTestResponse(activeTestQuestion.questionId, value);
  };

  const handleTestNavigation = (direction: 'next' | 'prev') => {
    if (!testSession || !activeTestQuestion) return;
    if (!testSession.completedAt) {
      updateTestResponse(activeTestQuestion.questionId, testAnswerInput);
    }
    setTestCurrentIndex((prev) => {
      if (direction === 'next') {
        return Math.min(prev + 1, testSession.questions.length - 1);
      }
      return Math.max(prev - 1, 0);
    });
  };

  const handleEndTest = () => {
    if (!testSession) return;
    if (activeTestQuestion) {
      updateTestResponse(activeTestQuestion.questionId, testAnswerInput);
    }
    finalizeTestSession('manual');
  };

  const handleStartNewTest = () => {
    if (testSession) {
      const shouldReplace = window.confirm('Start a new test? This will replace the current paper and answers.');
      if (!shouldReplace) return;
    }
    setShowTestDurationPrompt(true);
  };

  const handleConfirmTestDuration = (seconds: number) => {
    setTestDurationSeconds(seconds);
    setShowTestDurationPrompt(false);
    setTimeout(() => {
      createNewTestSession(seconds);
    }, 0);
  };

  const createPrintableSession = (questions: TestQuestion[]) => ({
    sessionId: 'print',
    startedAt: new Date().toISOString(),
    durationSeconds: testDurationSeconds,
    endsAt: new Date().toISOString(),
    paperVersion: TEST_PAPER_VERSION,
    modeVersion: TEST_MODE_VERSION,
    questions,
    responses: {},
    marks: null,
    totalMarksAwarded: null,
    completedAt: null,
  });

  const handlePrintCombinedPaper = () => {
    const session = testSession ?? createPrintableSession(generateTestPaper());
    openPrintWindow('KS2 Arithmetic Test Paper', buildCombinedPaperHtml(session));
  };

  const handlePrintShortFormPaper = () => {
    const session = testSession ?? createPrintableSession(generateTestPaper());
    openPrintWindow('KS2 Arithmetic Short Form', buildShortFormPaperHtml(session));
  };

  const handlePrintWeeklyPractice = () => {
    if (!testSession || !testSession.completedAt) return;
    const practice = generateWeeklyPractice(testSession);
    const html = buildWeeklyPracticeHtml(practice);
    openPrintWindow('Weekly Arithmetic Practice', html);
  };

  const handlePrintSummary = () => {
    if (!testSession || !testSession.completedAt) return;
    openPrintWindow('Test Summary', buildSummaryHtml(testSession));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      {mode === 'practice' && showMasteryPopup && (
        <MasteryPopup
          onSelectTopic={handleMasterySelectTopic}
          onSelectRandom={handleMasterySelectRandom}
          questionTypes={questionTypes}
        />
      )}
      {mode === 'test' && showTestDurationPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border-4 border-amber-200">
            <h2 className="text-2xl font-bold text-secondary mb-2">Choose Test Duration</h2>
            <p className="text-gray-600 mb-6">Select how long pupils get for this paper.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {TEST_DURATION_OPTIONS.map((option) => (
                <button
                  key={`test-duration-modal-${option.seconds}`}
                  onClick={() => handleConfirmTestDuration(option.seconds)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform hover:scale-105 ${testDurationSeconds === option.seconds
                    ? 'bg-secondary text-white shadow-lg ring-2 ring-secondary ring-offset-2'
                    : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-secondary hover:text-secondary'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowTestDurationPrompt(false)}
              className="mt-6 w-full bg-white hover:bg-gray-50 text-gray-600 font-bold py-3 px-6 rounded-2xl border-2 border-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl text-center mb-8 animate-bounce-slow">
        <h1 className="text-5xl md:text-6xl font-bold text-primary drop-shadow-sm mb-2">KS2 Maths Fun! 🧮</h1>
        <p className="text-xl text-gray-600 font-medium">Master your maths skills, one question at a time!</p>
      </div>

      <div className="w-full max-w-md mx-auto mb-8">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setMode('practice')}
            className={`flex-1 py-3 rounded-2xl font-bold text-lg transition-all ${mode === 'practice'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary hover:text-primary'
              }`}
          >
            Practice Mode
          </button>
          <button
            onClick={() => setMode('test')}
            className={`flex-1 py-3 rounded-2xl font-bold text-lg transition-all ${mode === 'test'
              ? 'bg-secondary text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-secondary hover:text-secondary'
              }`}
          >
            Practice Test
          </button>
        </div>
      </div>

      {mode === 'practice' && (
        <>
          <div className="w-full max-w-xs mx-auto mb-8">
            <label htmlFor="topic-select" className="block text-lg font-bold text-gray-700 mb-2 text-center">
              Choose a topic to practice:
            </label>
            <div className="relative">
              <select
                id="topic-select"
                value={selectedTopic}
                onChange={handleTopicChange}
                className="block w-full pl-4 pr-10 py-3 text-lg border-2 border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary rounded-2xl shadow-sm bg-white appearance-none cursor-pointer transition-all hover:border-primary"
              >
                <option value="All">🎲 All Topics (Random)</option>
                {questionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                <svg className="h-6 w-6 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </div>
          </div>


          {practiceState && (
            <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl mb-8 border-4 border-blue-200 animate-fade-in">
              <h3 className="text-xl font-bold text-primary text-center mb-4">Practice Zone: {practiceState.type}</h3>
              <PracticeTracker count={practiceState.correctInARow} />
              <p className="text-center text-base text-gray-600 mt-3 font-medium">Get 5 stars to unlock a new topic! ⭐⭐⭐⭐⭐</p>
              <div className="mt-6 text-center">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Timer per question</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {practiceTimerOptions.map((option) => (
                    <button
                      key={`timer-${option.seconds}`}
                      onClick={() => {
                        setPracticeTimerSeconds(option.seconds);
                        setSecondsRemaining(option.seconds);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 transform hover:scale-105 ${practiceTimerSeconds === option.seconds
                        ? 'bg-primary text-white shadow-lg ring-2 ring-primary ring-offset-2'
                        : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-primary hover:text-primary'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {practiceTimerSeconds > 0 && currentQuestion && (
                  <div className={`mt-4 text-3xl font-black transition-colors duration-300 ${secondsRemaining <= 5 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                    ⏱️ {formatCountdown(secondsRemaining)}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentQuestion && !explanation && (
            <div className="w-full max-w-2xl mx-auto bg-white p-8 md:p-10 rounded-3xl shadow-2xl border-b-8 border-gray-200 transition-all duration-300">
              <div className="text-center mb-8">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">{currentQuestion.type}</span>
              </div>

              <QuestionDisplay question={currentQuestion} />

              <div className="mt-10">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && isAnswering && handleCheckAnswer()}
                    placeholder="?"
                    className={`w-full p-5 text-4xl font-bold border-4 rounded-2xl text-center transition-all duration-300 focus:ring-4 outline-none bg-gray-50 text-gray-800 placeholder:text-gray-300
                    ${feedback === 'hidden' ? 'border-gray-200 focus:border-primary focus:ring-primary/20' : ''}
                    ${feedback === 'correct' ? 'border-green-400 bg-green-50 focus:ring-green-200' : ''}
                    ${feedback === 'incorrect' ? 'border-red-400 bg-red-50 focus:ring-red-200' : ''}
                    ${feedback === 'timeout' ? 'border-orange-400 bg-orange-50 focus:ring-orange-200' : ''}`}
                    disabled={!isAnswering}
                    autoFocus
                  />
                  <button
                    onClick={() => setShowCanvas(true)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors p-2"
                    title="Show Working Out"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 min-h-[3rem] flex items-center justify-center">
                {feedback === 'correct' && (
                  <div className="flex items-center text-green-500 font-black text-xl animate-bounce">
                    <CheckIcon />
                    <span className="ml-2">Awesome! Correct! 🎉</span>
                    <button onClick={() => speakText('Correct! Well done!')} className="ml-2 text-gray-400 hover:text-green-600 transition-colors" aria-label="Read feedback aloud">
                      <SpeakerIcon />
                    </button>
                  </div>
                )}
                {feedback === 'incorrect' && (
                  <div className="flex items-center text-red-500 font-black text-xl animate-shake">
                    <CrossIcon />
                    <span className="ml-2">Oops! Not quite. 🤔</span>
                    <button onClick={() => speakText("Not quite, let's review.")} className="ml-2 text-gray-400 hover:text-red-600 transition-colors" aria-label="Read feedback aloud">
                      <SpeakerIcon />
                    </button>
                  </div>
                )}
                {feedback === 'timeout' && (
                  <div className="flex items-center text-orange-500 font-black text-xl">
                    <span className="text-3xl mr-2">⏰</span>
                    <span className="ml-2">Time's up! Try again!</span>
                    <button onClick={() => speakText("Time's up! Keep calm and try again.")} className="ml-2 text-gray-400 hover:text-orange-600 transition-colors" aria-label="Read timeout feedback aloud">
                      <SpeakerIcon />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckAnswer}
                disabled={!isAnswering || userAnswer.trim() === ''}
                className="mt-8 w-full bg-secondary hover:bg-amber-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[2px] transition-all duration-200 text-2xl uppercase tracking-wider"
              >
                Check Answer ✨
              </button>
            </div>
          )}

          {explanation && currentQuestion && (
            <StepByStepGuidancePanel steps={explanation} onContinue={startPracticeQuestion} speakText={speakText} question={currentQuestion} />
          )}
        </>
      )}

      {mode === 'test' && (
        <div className="w-full max-w-4xl mx-auto">
          {!testSession && (
            <div className="bg-white p-8 rounded-3xl shadow-xl border-4 border-amber-200 mb-8">
              <h2 className="text-2xl font-bold text-secondary mb-2">Practice Test Mode</h2>
              <p className="text-gray-600 mb-6">
                Sit a full 36-question paper (40 marks) in the official SATs-style order.
              </p>
              <button
                onClick={handleStartNewTest}
                className="w-full bg-secondary hover:bg-amber-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 text-xl uppercase tracking-wider"
              >
                Start Test
              </button>
              <button
                onClick={handlePrintCombinedPaper}
                className="mt-3 w-full bg-white hover:bg-gray-50 text-secondary font-bold py-3 px-6 rounded-2xl border-2 border-secondary transition-all duration-200"
              >
                Printable paper + answer sheet
              </button>
              <button
                onClick={handlePrintShortFormPaper}
                className="mt-3 w-full bg-white hover:bg-gray-50 text-secondary font-bold py-3 px-6 rounded-2xl border-2 border-secondary transition-all duration-200"
              >
                Short-form paper
              </button>
            </div>
          )}

          {testSession && (
            <>
              <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-amber-200 mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-secondary">Practice Test Mode</h2>
                    <p className="text-sm text-gray-500">
                      Paper version: {testSession.paperVersion} · Session ID: {testSession.sessionId.slice(0, 8)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Time remaining</div>
                    <div className={`text-3xl font-black ${testSecondsRemaining <= 300 && !testSession.completedAt ? 'text-red-500' : 'text-secondary'}`}>
                      {formatCountdown(testSecondsRemaining)}
                    </div>
                    <div className="mt-2 text-xl font-black text-amber-600 uppercase tracking-tight">
                      {testSession.pupilAlias}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handlePrintCombinedPaper}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white border-2 border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary transition-all"
                  >
                    Printable paper + answer sheet
                  </button>
                  <button
                    onClick={handlePrintShortFormPaper}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-white border-2 border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary transition-all"
                  >
                    Short-form paper
                  </button>
                  {!testSession.completedAt && (
                    <button
                      onClick={handleEndTest}
                      className="px-4 py-2 rounded-full text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all"
                    >
                      End test
                    </button>
                  )}
                  <button
                    onClick={handleStartNewTest}
                    className="px-4 py-2 rounded-full text-sm font-bold bg-secondary text-white hover:bg-amber-500 transition-all"
                  >
                    Start new test
                  </button>
                </div>
              </div>

              {testSession.completedAt && (
                <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-green-200 mb-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-green-600">Test complete</h3>
                      <p className="text-gray-600">Score: {testSession.totalMarksAwarded ?? 0} / 40</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handlePrintWeeklyPractice}
                        className="px-5 py-3 rounded-xl font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-lg"
                      >
                        Download Weekly Practice
                      </button>
                      <button
                        onClick={handlePrintSummary}
                        className="px-5 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-all"
                      >
                        Download summary PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTestQuestion && (
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border-b-8 border-gray-200 transition-all duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Question {activeTestQuestion.slotNumber} of {testSession.questions.length}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Marks</div>
                      <div className="text-xl font-black text-gray-700">{activeTestQuestion.markValue}</div>
                    </div>
                  </div>

                  <div className="text-center text-4xl md:text-5xl font-black text-gray-800 tracking-tight mb-8 font-mono">
                    {renderPromptParts(activeTestQuestion.prompt)}
                  </div>

                  {activeTestQuestion.type.includes('Fraction') && (
                    <div className="text-center text-gray-500 text-lg italic mb-4">
                      (Enter fractions like 1/2 or 1 1/2)
                    </div>
                  )}

                  <div className="relative">
                    <input
                      ref={testInputRef}
                      type="text"
                      value={testAnswerInput}
                      onChange={(e) => handleTestAnswerChange(e.target.value)}
                      placeholder="Answer"
                      className="w-full p-5 text-3xl font-bold border-4 rounded-2xl text-center transition-all duration-300 focus:ring-4 outline-none bg-gray-50 text-gray-800 placeholder:text-gray-300 border-gray-200 focus:border-secondary focus:ring-secondary/20"
                      disabled={Boolean(testSession.completedAt)}
                    />
                    <button
                      onClick={() => setShowCanvas(true)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors p-2"
                      title="Show Working Out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  {testSession.completedAt && activeTestMark && (
                    <div className="mt-4 text-center text-lg font-bold text-gray-600">
                      Marks awarded: {activeTestMark.marksAwarded} / {activeTestQuestion.markValue}
                    </div>
                  )}

                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => handleTestNavigation('prev')}
                      disabled={testCurrentIndex === 0}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${testCurrentIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary'
                        }`}
                    >
                      Back
                    </button>
                    <button
                      onClick={() => handleTestNavigation('next')}
                      disabled={testCurrentIndex === testSession.questions.length - 1}
                      className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 ${testCurrentIndex === testSession.questions.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-secondary text-white shadow-lg'
                        }`}
                    >
                      Next question
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <WorkingOutCanvas
        isVisible={showCanvas}
        onClose={() => setShowCanvas(false)}
        question={workingOutQuestion}
      />
    </div>
  );
}
