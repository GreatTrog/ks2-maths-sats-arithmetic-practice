import { Question, QuestionType, TestQuestion, TestSession } from '../types';
import {
  generateQuestionByType,
  generateMultiplyByPowersOf10Sats,
  generateDivideByPowersOf10DecimalSats,
  generateMultiplication2or3DigitSats,
  generateMissingSubtrahendSats,
  generateInverseAdditionSats,
  generateDecimalAdditionDifferentPlacesSats,
  generateDecimalSubtractionConstrainedSats,
  generateDivision3or4DigitBy1DigitSats,
  generateKnownFactsDivisionSats,
  generateBidmasDifferentLevelsSats,
  generateMultiplication3NumbersWithTwoDigitSats,
  generateProperFractionTimesLargeIntSats,
  generateFractionAdditionThreeRelatedSats,
  generateFractionAdditionUnlikeWithMixedSats,
  generateDecimalMultiplication2DigitSats,
  generateLongDivision3DigitBy2DigitSats,
  generateLongDivision4DigitBy2DigitSats,
  generateLongMultiplication4DigitBy2DigitSats,
  generatePercentageQuestionSats,
} from './questionService';

export type DailyPractice = {
  day: string; // "Monday", "Tuesday", etc.
  questions: Question[];
};

export type WeeklyPractice = {
  sessionId: string;
  generatedAt: string;
  days: DailyPractice[];
  pupilAlias?: string;
};

/**
 * Identifies errors from a test session and returns them sorted by difficulty (slotNumber).
 */
export const analyzeErrors = (session: TestSession): TestQuestion[] => {
  if (!session.marks) return [];

  const errorQuestions = session.questions.filter((q) => {
    const mark = session.marks?.find((m) => m.questionId === q.questionId);
    return mark && mark.marksAwarded < q.markValue;
  });

  return errorQuestions.sort((a, b) => a.slotNumber - b.slotNumber);
};

/**
 * Maps a test question back to a generator function that produces a similar question.
 */
const generateVariation = (template: TestQuestion): Question => {
  const flags = template.constraintFlags;

  if (flags.includes('multiplyBy10_100_1000')) return generateMultiplyByPowersOf10Sats();
  if (flags.includes('divideBy10_100_1000DecimalDividend')) return generateDivideByPowersOf10DecimalSats();
  if (flags.includes('2or3DigitBy1Digit')) return generateMultiplication2or3DigitSats();
  if (flags.includes('missingSubtrahendOrInverseAddition')) {
    return Math.random() < 0.5 ? generateMissingSubtrahendSats() : generateInverseAdditionSats();
  }
  if (flags.includes('differentDecimalPlaces')) return generateDecimalAdditionDifferentPlacesSats();
  if (flags.includes('mixedBidmasLevels')) return generateBidmasDifferentLevelsSats();
  if (flags.includes('3or4DigitDivisionRemainderPossible')) return generateDivision3or4DigitBy1DigitSats();
  if (flags.includes('decimalSubtractionConstraint')) return generateDecimalSubtractionConstrainedSats();
  if (flags.includes('threeNumbersOneTwoDigit')) return generateMultiplication3NumbersWithTwoDigitSats();
  if (flags.includes('properFractionByLargeInteger')) return generateProperFractionTimesLargeIntSats();
  if (flags.includes('threeFractionsRelatedDenominators')) return generateFractionAdditionThreeRelatedSats();
  if (flags.includes('1dpBy2Digit')) return generateDecimalMultiplication2DigitSats();
  if (flags.includes('unlikeDenominatorsMixedOptional')) return generateFractionAdditionUnlikeWithMixedSats();
  if (flags.includes('3digitBy2digitDivision')) return generateLongDivision3DigitBy2DigitSats();
  if (flags.includes('4digitBy2digitMultiplication')) return generateLongMultiplication4DigitBy2DigitSats();
  if (flags.includes('4digitBy2digitDivision')) return generateLongDivision4DigitBy2DigitSats();

  // Known facts
  const knownFactsFlag = flags.find((f) => f.startsWith('knownFacts:'));
  if (knownFactsFlag) {
    const diff = knownFactsFlag.split(':')[1] as any;
    return generateKnownFactsDivisionSats(diff);
  }

  // Percentages
  const percentageFlag = flags.find((f) => f.startsWith('percentage:'));
  if (percentageFlag) {
    const constraint = percentageFlag.split(':')[1] as any;
    return generatePercentageQuestionSats(constraint);
  }

  // Fallback to type-based generation
  return generateQuestionByType(template.type);
};

/**
 * Generates a weekly practice plan based on test results.
 */
export const generateWeeklyPractice = (session: TestSession): WeeklyPractice => {
  const errors = analyzeErrors(session);
  const totalQuestionsNeeded = 30; // 6 per day
  const questionsPerDay = 6;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  let practicePool: Question[] = [];

  // Stage 0: Initial variations of actual errors
  errors.forEach((e) => practicePool.push(generateVariation(e)));

  // Stage 1: Repeat Variations if pool too small
  if (practicePool.length < 10 && errors.length > 0) {
    while (practicePool.length < 15) {
      const template = errors[Math.floor(Math.random() * errors.length)];
      practicePool.push(generateVariation(template));
    }
  }

  // Stage 2: Add Randomised Challenges from second half of the paper (slots 19-36)
  if (practicePool.length < totalQuestionsNeeded) {
    const secondHalf = session.questions.filter((q) => q.slotNumber >= 19);
    while (practicePool.length < totalQuestionsNeeded) {
      const template = secondHalf[Math.floor(Math.random() * secondHalf.length)];
      practicePool.push(generateVariation(template));
    }
  }

  // Truncate to exactly needed if overflowed
  if (practicePool.length > totalQuestionsNeeded) {
    practicePool = practicePool.slice(0, totalQuestionsNeeded);
  }

  // Distribute: Easier earlier, Harder later (roughly)
  // We already have errors sorted by slotNumber. Challenges were added at the end.
  // We'll keep them in this order and distribute.

  const dailyPractices: DailyPractice[] = days.map((day, index) => {
    const start = index * questionsPerDay;
    const end = start + questionsPerDay;
    return {
      day,
      questions: practicePool.slice(start, end),
    };
  });

  return {
    sessionId: session.sessionId,
    generatedAt: new Date().toISOString(),
    days: dailyPractices,
    pupilAlias: session.pupilAlias,
  };
};

/**
 * Builds HTML for the weekly practice printable sheet.
 */
export const buildWeeklyPracticeHtml = (practice: WeeklyPractice): string => {
  const css = `
    @media print {
      @page { size: A4 landscape; margin: 10mm; }
      body { margin: 0; padding: 0; font-family: sans-serif; }
    }
    body { font-family: sans-serif; color: #333; }
    .container { width: 100%; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0; color: #d97706; }
    .header p { margin: 5px 0; font-size: 0.9em; color: #666; }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      border: 2px solid #333;
    }
    .day-col {
      border-right: 1px solid #ccc;
      padding: 5px;
    }
    .day-col:last-child { border-right: none; }
    .day-title {
      text-align: center;
      background: #fef3c7;
      font-weight: bold;
      padding: 8px;
      border-bottom: 2px solid #333;
      margin-bottom: 10px;
    }
    .question-box {
      border: 1px solid #eee;
      margin-bottom: 15px;
      padding: 10px;
      min-height: 80px;
      position: relative;
    }
    .q-num {
      font-weight: bold;
      font-size: 0.8em;
      color: #999;
      margin-bottom: 5px;
    }
    .q-text {
      font-size: 1.1em;
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
    .answer-line {
      border-bottom: 1px solid #999;
      width: 60px;
      height: 20px;
      margin-left: auto;
    }
    .footer { margin-top: 20px; font-size: 0.8em; text-align: right; color: #999; }
  `;

  const columnsHtml = practice.days.map(day => `
    <div class="day-col">
      <div class="day-title">${day.day}</div>
      ${day.questions.map((q, i) => `
        <div class="question-box">
          <div class="q-num">Q${i + 1}</div>
          <div class="q-text">${q.text.replace('[blank]', '____')}</div>
          <div class="answer-line"></div>
        </div>
      `).join('')}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>${css}</style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Arithmetic Practice</h1>
          <p>Targeted Revision Sheet · Pupil: <strong>${practice.pupilAlias || '________________'}</strong></p>
        </div>
        <div class="grid">
          ${columnsHtml}
        </div>
        <div class="footer">
          Generated for targeted practice based on recent test results.
        </div>
      </div>
    </body>
    </html>
  `;
};
