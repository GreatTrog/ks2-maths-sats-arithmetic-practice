import { BidmasMetadata, Question, QuestionType, TestQuestion } from '../types';
import {
  generateQuestionByType,
  generateMultiplyByPowersOf10Sats as generateMultiplyByPowersOf10,
  generateDivideByPowersOf10DecimalSats as generateDivideByPowersOf10Decimal,
  generateMultiplication2or3DigitSats as generateMultiplication2or3Digit,
  generateMissingSubtrahendSats as generateMissingSubtrahend,
  generateInverseAdditionSats as generateInverseAddition,
  generateDecimalAdditionDifferentPlacesSats as generateDecimalAdditionDifferentPlaces,
  generateDecimalSubtractionConstrainedSats as generateDecimalSubtractionConstrained,
  generateDivision3or4DigitBy1DigitSats as generateDivision3or4DigitBy1Digit,
  generateKnownFactsDivisionSats as generateKnownFactsDivision,
  KnownFactsDifficulty,
  generateBidmasDifferentLevelsSats as generateBidmasDifferentLevels,
  generateMultiplication3NumbersWithTwoDigitSats as generateMultiplication3NumbersWithTwoDigit,
  generateProperFractionTimesLargeIntSats as generateProperFractionTimesLargeInt,
  generateFractionAdditionThreeRelatedSats as generateFractionAdditionThreeRelated,
  generateFractionAdditionUnlikeWithMixedSats as generateFractionAdditionUnlikeWithMixed,
  generateDecimalMultiplication2DigitSats as generateDecimalMultiplication2Digit,
  generateLongDivision3DigitBy2DigitSats as generateLongDivision3DigitBy2Digit,
  generateLongDivision4DigitBy2DigitSats as generateLongDivision4DigitBy2Digit,
  generateLongMultiplication4DigitBy2DigitSats as generateLongMultiplication4DigitBy2Digit,
  generatePercentageQuestionSats as generatePercentageQuestion,
  PercentageConstraint,
} from './questionService';

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = <T,>(arr: T[]): T[] => {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
};

const createQuestionId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
};

export const generatePupilAlias = (): string => {
  const adjectives = [
    'Swift', 'Brave', 'Clever', 'Happy', 'Bright',
    'Quick', 'Calm', 'Wise', 'Strong', 'Bold',
    'Kind', 'Sharp', 'Grand', 'Great', 'Super',
    'Mighty', 'Proud', 'Magic', 'Golden', 'Silver'
  ];
  const animals = [
    'Panda', 'Tiger', 'Eagle', 'Dolphin', 'Lion',
    'Wolf', 'Bear', 'Hawk', 'Lynx', 'Otter',
    'Falcon', 'Fox', 'Whale', 'Owl', 'Rhino',
    'Shark', 'Rabbit', 'Turtle', 'Deer', 'Badger'
  ];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
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
