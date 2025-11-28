
export enum QuestionType {
  // Whole Number Operations
  Addition = 'Addition',
  Subtraction = 'Subtraction',
  SubtractionWithRegrouping = 'Subtraction (from multiples of 100/1000)',
  Multiplication = 'Multiplication (by 1 digit)',
  LongMultiplication = 'Long Multiplication (by 2 digits)',
  Multiplication3Numbers = 'Multiplication (3 numbers)',
  Division = 'Division (by 1 digit)',
  LongDivision = 'Long Division (by 2 digits)',
  DivisionWithKnownFacts = 'Division (using known facts)',
  BIDMAS = 'Order of Operations (BIDMAS)',

  // Place Value, Powers of 10, Indices
  PlaceValue = 'Place Value Partitioning',
  MultiplyBy10_100_1000 = 'Multiply by 10, 100, 1000',
  DivideBy10_100_1000 = 'Divide by 10, 100, 1000',
  PowersIndices = 'Powers/Indices (Squares & Cubes)',

  // Decimals
  DecimalAddition = 'Decimal Addition (varying places)',
  DecimalSubtraction = 'Decimal Subtraction (varying places)',
  DecimalMultiplication = 'Decimal Multiplication (by whole number)',

  // Fractions
  FractionAdditionSimpleDenominators = 'Fraction Addition (simple denominators)',
  FractionAdditionUnlikeDenominators = 'Fraction Addition (unlike denominators)',
  FractionAdditionMixedNumbers = 'Fraction Addition (mixed numbers)',
  FractionSubtractionSimpleDenominators = 'Fraction Subtraction (simple denominators)',
  FractionSubtractionUnlikeDenominators = 'Fraction Subtraction (unlike denominators)',
  FractionSubtractionMixedNumbers = 'Fraction Subtraction (mixed numbers)',
  FractionMultiplication = 'Fraction Multiplication',
  FractionMultiplicationMixedNumbers = 'Fraction Multiplication (mixed numbers)',
  FractionDivision = 'Fraction Division (by whole number)',
  FractionsOfAmounts = 'Fractions of Amounts',

  // Percentages
  Percentages = 'Percentages of Amounts',
}

export interface BidmasStep {
  expression: string;
  activeExpression?: string; // The specific part being calculated, e.g. "(10 + 2)"
  operation: string;
  operands: string[];
  result: string;
}

export interface BidmasMetadata {
  operations: string[];
  executionSteps: BidmasStep[];
  hasBrackets: boolean;
  hasIndices: boolean;
}

export interface Question {
  type: QuestionType;
  text: string;
  answer: string;
  operands?: string[];
  operator?: string;
  bidmasMetadata?: BidmasMetadata;
}

export interface PracticeState {
  type: QuestionType;
  correctInARow: number;
}