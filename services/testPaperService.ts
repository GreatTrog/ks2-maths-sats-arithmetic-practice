import { BidmasMetadata, Question, QuestionType, TestQuestion } from '../types';
import { generateQuestionByType } from './questionService';

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};
const formatWithCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const BLANK_BOX = '[blank]';

type SimpleFraction = { n: number; d: number };
type MixedNumber = { w: number; n: number; d: number };

const simplify = (f: SimpleFraction): SimpleFraction => {
  const common = gcd(f.n, f.d);
  return { n: f.n / common, d: f.d / common };
};
const toMixed = (f: SimpleFraction): MixedNumber => ({ w: Math.floor(f.n / f.d), n: f.n % f.d, d: f.d });
const mixedNumberToString = (f: MixedNumber): string => {
  if (f.w === 0) return `${f.n}/${f.d}`;
  if (f.n === 0) return `${f.w}`;
  return `${f.w} ${f.n}/${f.d}`;
};
const simpleFractionToString = (f: SimpleFraction): string => {
  if (f.d === 1) return `${f.n}`;
  return `${f.n}/${f.d}`;
};
const toAnswerString = (value: number): string => {
  const sanitized = parseFloat(value.toFixed(10));
  return sanitized.toString();
};

const createQuestionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

const buildTestQuestion = (
  slotNumber: number,
  markValue: number,
  question: Question,
  constraintFlags: string[] = [],
): TestQuestion => ({
  questionId: createQuestionId(),
  slotNumber,
  type: question.type,
  prompt: question.text,
  correctAnswer: question.answer,
  markValue,
  constraintFlags,
  bidmasMetadata: question.bidmasMetadata,
});

const generateMultiplyByPowersOf10 = (): Question => {
  const power = [10, 100, 1000][randomInt(0, 2)];
  const num = parseFloat((Math.random() * 99 + 1).toFixed(randomInt(0, 2)));
  const answer = num * power;
  return {
    type: QuestionType.MultiplyBy10_100_1000,
    text: `${formatWithCommas(num)} × ${formatWithCommas(power)} =`,
    answer: toAnswerString(answer),
  };
};

const generateDivideByPowersOf10Decimal = (): Question => {
  const power = [10, 100, 1000][randomInt(0, 2)];
  const decimalPlaces = randomInt(1, 2);
  const numStr = (Math.random() * 99 + 1).toFixed(decimalPlaces);
  const num = parseFloat(numStr);
  const answer = num / power;
  return {
    type: QuestionType.DivideBy10_100_1000,
    text: `${numStr} ÷ ${formatWithCommas(power)} =`,
    answer: toAnswerString(answer),
  };
};

const generateMultiplication2or3Digit = (): Question => {
  const num1 = randomInt(10, 999);
  const num2 = randomInt(2, 9);
  return { type: QuestionType.Multiplication, text: `${formatWithCommas(num1)} × ${formatWithCommas(num2)} =`, answer: (num1 * num2).toString() };
};

const generateMissingSubtrahend = (): Question => {
  const minuend = randomInt(200, 9999);
  const subtrahend = randomInt(10, minuend - 10);
  const difference = minuend - subtrahend;
  return {
    type: QuestionType.Subtraction,
    text: `${formatWithCommas(minuend)} - ${BLANK_BOX} = ${formatWithCommas(difference)}`,
    answer: subtrahend.toString(),
  };
};

const generateInverseAddition = (): Question => {
  const total = randomInt(200, 9999);
  const addend = randomInt(10, total - 10);
  const missing = total - addend;
  return {
    type: QuestionType.Addition,
    text: `${BLANK_BOX} + ${formatWithCommas(addend)} = ${formatWithCommas(total)}`,
    answer: missing.toString(),
  };
};

const generateDecimalAdditionDifferentPlaces = (): Question => {
  let places1 = randomInt(1, 3);
  let places2 = randomInt(1, 3);
  while (places1 === places2) places2 = randomInt(1, 3);
  const num1Str = (Math.random() * 50 + 1).toFixed(places1);
  const num2Str = (Math.random() * 50 + 1).toFixed(places2);
  const num1 = parseFloat(num1Str);
  const num2 = parseFloat(num2Str);
  const answer = parseFloat((num1 + num2).toFixed(Math.max(places1, places2)));
  return { type: QuestionType.DecimalAddition, text: `${num1Str} + ${num2Str} =`, answer: answer.toString() };
};

const generateDecimalSubtractionConstrained = (): Question => {
  if (Math.random() < 0.5) {
    const whole = randomInt(10, 200);
    const decimalStr = (Math.random() * 9 + 0.1).toFixed(1);
    const decimal = parseFloat(decimalStr);
    const answer = parseFloat((whole - decimal).toFixed(1));
    return { type: QuestionType.DecimalSubtraction, text: `${whole} - ${decimalStr} =`, answer: answer.toString() };
  }

  let places1 = randomInt(1, 3);
  let places2 = randomInt(1, 3);
  while (places1 === places2) places2 = randomInt(1, 3);
  let num1Str = (Math.random() * 80 + 20).toFixed(places1);
  let num2Str = (Math.random() * 50).toFixed(places2);
  let num1 = parseFloat(num1Str);
  let num2 = parseFloat(num2Str);
  if (num2 > num1) {
    [num1, num2] = [num2, num1];
    [num1Str, num2Str] = [num2Str, num1Str];
  }
  const answer = parseFloat((num1 - num2).toFixed(Math.max(places1, places2)));
  return { type: QuestionType.DecimalSubtraction, text: `${num1Str} - ${num2Str} =`, answer: answer.toString() };
};

const generateDivision3or4DigitBy1Digit = (): Question => {
  while (true) {
    const divisor = randomInt(2, 9);
    const quotient = randomInt(100, 999);
    const hasRemainder = Math.random() < 0.5;
    const remainder = hasRemainder ? randomInt(1, divisor - 1) : 0;
    const dividend = divisor * quotient + remainder;
    if (dividend < 100 || dividend > 9999) continue;
    const answer = remainder > 0 ? `${quotient} r ${remainder}` : quotient.toString();
    return { type: QuestionType.Division, text: `${formatWithCommas(dividend)} ÷ ${formatWithCommas(divisor)} =`, answer };
  }
};

type KnownFactsDifficulty = 'easy' | 'medium' | 'hard';

const generateKnownFactsDivision = (difficulty: KnownFactsDifficulty): Question => {
  let fact = 2;
  let multiple = 2;
  let power = 10;

  if (difficulty === 'easy') {
    fact = randomInt(2, 5);
    multiple = randomInt(2, 6);
    power = 10;
  } else if (difficulty === 'medium') {
    fact = randomInt(2, 9);
    multiple = randomInt(2, 9);
    power = 10 ** randomInt(1, 2);
  } else {
    fact = randomInt(6, 12);
    multiple = randomInt(4, 12);
    power = 10 ** randomInt(2, 3);
  }

  const dividend = fact * multiple * power;
  return {
    type: QuestionType.DivisionWithKnownFacts,
    text: `${formatWithCommas(dividend)} ÷ ${formatWithCommas(fact)} =`,
    answer: (dividend / fact).toString(),
  };
};

const generateBidmasDifferentLevels = (): Question => {
  const isDifferentLevel = (metadata?: BidmasMetadata) => {
    if (!metadata?.operations?.length) return false;
    const levels = new Set(
      metadata.operations.map((op) => {
        if (op === '^') return 'indices';
        if (op === '×' || op === '÷') return 'multiply';
        return 'add';
      }),
    );
    return levels.size >= 2;
  };

  let candidate = generateQuestionByType(QuestionType.BIDMAS);
  while (!isDifferentLevel(candidate.bidmasMetadata)) {
    candidate = generateQuestionByType(QuestionType.BIDMAS);
  }
  return candidate;
};

const generateMultiplication3NumbersWithTwoDigit = (): Question => {
  const nums = [randomInt(2, 9), randomInt(2, 9), randomInt(10, 99)];
  const order = shuffle(nums);
  const answer = order.reduce((a, b) => a * b, 1);
  return { type: QuestionType.Multiplication3Numbers, text: `${formatWithCommas(order[0])} × ${formatWithCommas(order[1])} × ${formatWithCommas(order[2])} =`, answer: answer.toString() };
};

const generateProperFractionTimesLargeInt = (): Question => {
  const den = randomInt(2, 12);
  const num = randomInt(1, den - 1);
  const power = [10, 100, 1000][randomInt(0, 2)];
  let integer = den * power;
  let attempts = 0;
  while ((integer < 100 || integer > 9999) && attempts < 50) {
    const factor = randomInt(1, 20);
    integer = den * factor * power;
    attempts += 1;
  }
  while (integer < 100 || integer > 9999) {
    const factor = randomInt(1, 30);
    integer = den * factor * power;
  }

  const resNum = num * integer;
  const simplified = simplify({ n: resNum, d: den });
  const mixed = toMixed(simplified);
  const answer = mixed.w > 0 ? mixedNumberToString(mixed) : simpleFractionToString(simplified);
  return {
    type: QuestionType.FractionMultiplication,
    text: `${num}/${den} × ${formatWithCommas(integer)} =`,
    answer,
  };
};

const generateFractionAdditionThreeRelated = (): Question => {
  const base = randomInt(2, 6);
  const mult1 = randomInt(2, 4);
  const mult2 = randomInt(2, 4);
  const den1 = base;
  const den2 = base * mult1;
  const den3 = base * mult1 * mult2;

  const num1 = randomInt(1, den1 - 1);
  const num2 = randomInt(1, den2 - 1);
  const num3 = randomInt(1, den3 - 1);

  const commonDen = den3;
  const resNum = num1 * (commonDen / den1) + num2 * (commonDen / den2) + num3;
  const simplified = simplify({ n: resNum, d: commonDen });
  const mixed = toMixed(simplified);
  const answer = mixed.w > 0 ? mixedNumberToString(mixed) : simpleFractionToString(simplified);

  return {
    type: QuestionType.FractionAdditionSimpleDenominators,
    text: `${num1}/${den1} + ${num2}/${den2} + ${num3}/${den3} =`,
    answer,
  };
};

const generateFractionAdditionUnlikeWithMixed = (): Question => {
  const useMixed = Math.random() < 0.5;
  const den1 = randomInt(3, 9);
  let den2 = randomInt(3, 9);
  while (den2 === den1) den2 = randomInt(3, 9);

  if (!useMixed) {
    const num1 = randomInt(1, den1 - 1);
    const num2 = randomInt(1, den2 - 1);
    const resNum = num1 * den2 + num2 * den1;
    const resDen = den1 * den2;
    const simplified = simplify({ n: resNum, d: resDen });
    return {
      type: QuestionType.FractionAdditionUnlikeDenominators,
      text: `${num1}/${den1} + ${num2}/${den2} =`,
      answer: simpleFractionToString(simplified),
    };
  }

  const whole = randomInt(1, 4);
  const num1 = randomInt(1, den1 - 1);
  const num2 = randomInt(1, den2 - 1);
  const resNum = (whole * den1 + num1) * den2 + num2 * den1;
  const resDen = den1 * den2;
  const simplified = simplify({ n: resNum, d: resDen });
  const mixed = toMixed(simplified);
  return {
    type: QuestionType.FractionAdditionUnlikeDenominators,
    text: `${whole} ${num1}/${den1} + ${num2}/${den2} =`,
    answer: mixedNumberToString(mixed),
  };
};

const generateDecimalMultiplication2Digit = (): Question => {
  const ones = randomInt(1, 9);
  const tenths = randomInt(1, 9);
  const num1 = parseFloat(`${ones}.${tenths}`);
  const num2 = randomInt(10, 99);
  const answer = parseFloat((num1 * num2).toFixed(1));
  return { type: QuestionType.DecimalMultiplication2Digit, text: `${num1} × ${formatWithCommas(num2)} =`, answer: answer.toString() };
};

const generateLongDivision3DigitBy2Digit = (): Question => {
  while (true) {
    const divisor = randomInt(12, 99);
    const quotient = randomInt(2, 99);
    const dividend = divisor * quotient;
    if (dividend < 100 || dividend > 999) continue;
    return {
      type: QuestionType.LongDivision,
      text: `${formatWithCommas(divisor)} ⟌ ${formatWithCommas(dividend)}`,
      answer: quotient.toString(),
    };
  }
};

const generateLongDivision4DigitBy2Digit = (): Question => {
  while (true) {
    const divisor = randomInt(12, 99);
    const quotient = randomInt(10, 99);
    const dividend = divisor * quotient;
    if (dividend < 1000 || dividend > 9999) continue;
    return {
      type: QuestionType.LongDivision,
      text: `${formatWithCommas(divisor)} ⟌ ${formatWithCommas(dividend)}`,
      answer: quotient.toString(),
    };
  }
};

const generateLongMultiplication4DigitBy2Digit = (): Question => {
  const num1 = randomInt(1000, 9999);
  const num2 = randomInt(10, 99);
  return {
    type: QuestionType.LongMultiplication,
    text: `${formatWithCommas(num1)} × ${formatWithCommas(num2)} =`,
    answer: (num1 * num2).toString(),
  };
};

type PercentageConstraint = 'small' | 'large-non-multiple' | 'standard';

const pickNonMultipleOfFive = (min: number, max: number) => {
  let percentage = randomInt(min, max);
  while (percentage % 5 === 0) {
    percentage = randomInt(min, max);
  }
  return percentage;
};

const generatePercentageQuestion = (constraint: PercentageConstraint): Question => {
  let percentage = 10;
  if (constraint === 'small') {
    percentage = pickNonMultipleOfFive(6, 25);
  } else if (constraint === 'large-non-multiple') {
    percentage = pickNonMultipleOfFive(50, 99);
  } else {
    percentage = pickNonMultipleOfFive(26, 49);
  }

  const num = randomInt(10, 999) * 10;
  const answer = (percentage / 100) * num;
  return { type: QuestionType.Percentages, text: `${percentage}% of ${formatWithCommas(num)} =`, answer: toAnswerString(answer) };
};

export const TEST_PAPER_VERSION = 'ks2-sats-arithmetic-v1';

export const generateTestPaper = (): TestQuestion[] => {
  const percentageAssignments = shuffle<PercentageConstraint>(['small', 'large-non-multiple', 'standard']);
  const knownFactsAssignments = shuffle<KnownFactsDifficulty>(['easy', 'medium', 'hard', 'medium']);

  const slots: Array<{
    slotNumber: number;
    markValue: number;
    generator: () => Question;
    constraintFlags?: string[];
  }> = [
    { slotNumber: 1, markValue: 1, generator: generateMultiplyByPowersOf10, constraintFlags: ['multiplyBy10_100_1000'] },
    { slotNumber: 2, markValue: 1, generator: () => generateQuestionByType(QuestionType.PlaceValue) },
    { slotNumber: 3, markValue: 1, generator: () => generateQuestionByType(QuestionType.Addition) },
    { slotNumber: 4, markValue: 1, generator: generateDivideByPowersOf10Decimal, constraintFlags: ['divideBy10_100_1000DecimalDividend'] },
    { slotNumber: 5, markValue: 1, generator: () => generateQuestionByType(QuestionType.Subtraction) },
    { slotNumber: 6, markValue: 1, generator: () => generateKnownFactsDivision(knownFactsAssignments[0]), constraintFlags: [`knownFacts:${knownFactsAssignments[0]}`] },
    { slotNumber: 7, markValue: 1, generator: () => generateQuestionByType(QuestionType.SubtractionWithRegrouping) },
    { slotNumber: 8, markValue: 1, generator: generateMultiplication2or3Digit, constraintFlags: ['2or3DigitBy1Digit'] },
    {
      slotNumber: 9,
      markValue: 1,
      generator: () => (Math.random() < 0.5 ? generateMissingSubtrahend() : generateInverseAddition()),
      constraintFlags: ['missingSubtrahendOrInverseAddition'],
    },
    { slotNumber: 10, markValue: 1, generator: generateDecimalAdditionDifferentPlaces, constraintFlags: ['differentDecimalPlaces'] },
    { slotNumber: 11, markValue: 1, generator: () => generateKnownFactsDivision(knownFactsAssignments[1]), constraintFlags: [`knownFacts:${knownFactsAssignments[1]}`] },
    { slotNumber: 12, markValue: 1, generator: generateBidmasDifferentLevels, constraintFlags: ['mixedBidmasLevels'] },
    { slotNumber: 13, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionSubtractionSimpleDenominators) },
    { slotNumber: 14, markValue: 1, generator: generateDivision3or4DigitBy1Digit, constraintFlags: ['3or4DigitDivisionRemainderPossible'] },
    { slotNumber: 15, markValue: 1, generator: generateDecimalSubtractionConstrained, constraintFlags: ['decimalSubtractionConstraint'] },
    {
      slotNumber: 16,
      markValue: 1,
      generator: () => generatePercentageQuestion(percentageAssignments[0]),
      constraintFlags: [`percentage:${percentageAssignments[0]}`],
    },
    { slotNumber: 17, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionMultiplication) },
    { slotNumber: 18, markValue: 1, generator: generateMultiplication3NumbersWithTwoDigit, constraintFlags: ['threeNumbersOneTwoDigit'] },
    { slotNumber: 19, markValue: 1, generator: () => generateKnownFactsDivision(knownFactsAssignments[2]), constraintFlags: [`knownFacts:${knownFactsAssignments[2]}`] },
    { slotNumber: 20, markValue: 1, generator: generateProperFractionTimesLargeInt, constraintFlags: ['properFractionByLargeInteger'] },
    { slotNumber: 21, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionDivision) },
    { slotNumber: 22, markValue: 1, generator: generateFractionAdditionThreeRelated, constraintFlags: ['threeFractionsRelatedDenominators'] },
    { slotNumber: 23, markValue: 1, generator: generateDivision3or4DigitBy1Digit, constraintFlags: ['3or4DigitDivisionRemainderPossible'] },
    { slotNumber: 24, markValue: 1, generator: generateDecimalMultiplication2Digit, constraintFlags: ['1dpBy2Digit'] },
    { slotNumber: 25, markValue: 1, generator: generateFractionAdditionUnlikeWithMixed, constraintFlags: ['unlikeDenominatorsMixedOptional'] },
    {
      slotNumber: 26,
      markValue: 1,
      generator: () => generatePercentageQuestion(percentageAssignments[1]),
      constraintFlags: [`percentage:${percentageAssignments[1]}`],
    },
    { slotNumber: 27, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionAdditionMixedNumbers) },
    { slotNumber: 28, markValue: 1, generator: () => generateKnownFactsDivision(knownFactsAssignments[3]), constraintFlags: [`knownFacts:${knownFactsAssignments[3]}`] },
    { slotNumber: 29, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionSubtractionMixedNumbers) },
    { slotNumber: 30, markValue: 1, generator: generateBidmasDifferentLevels, constraintFlags: ['mixedBidmasLevels'] },
    { slotNumber: 31, markValue: 2, generator: () => generateQuestionByType(QuestionType.LongMultiplication) },
    {
      slotNumber: 32,
      markValue: 1,
      generator: () => generatePercentageQuestion(percentageAssignments[2]),
      constraintFlags: [`percentage:${percentageAssignments[2]}`],
    },
    { slotNumber: 33, markValue: 2, generator: generateLongDivision3DigitBy2Digit, constraintFlags: ['3digitBy2digitDivision'] },
    { slotNumber: 34, markValue: 1, generator: () => generateQuestionByType(QuestionType.FractionMultiplication2Digit) },
    { slotNumber: 35, markValue: 2, generator: generateLongMultiplication4DigitBy2Digit, constraintFlags: ['4digitBy2digitMultiplication'] },
    { slotNumber: 36, markValue: 2, generator: generateLongDivision4DigitBy2Digit, constraintFlags: ['4digitBy2digitDivision'] },
  ];

  return slots.map((slot) => {
    const question = slot.generator();
    let flags = slot.constraintFlags ?? [];
    if (slot.slotNumber === 9) {
      flags = [
        ...flags,
        question.type === QuestionType.Addition ? 'inverseAddition' : 'missingSubtrahend',
      ];
    }
    return buildTestQuestion(slot.slotNumber, slot.markValue, question, flags);
  });
};
