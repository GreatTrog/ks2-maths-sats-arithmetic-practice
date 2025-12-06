import { Question, QuestionType } from '../types';

// Helper Functions
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const formatWithCommas = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// --- Fraction Helpers ---
type SimpleFraction = { n: number, d: number };
type MixedNumber = { w: number, n: number, d: number };

const toImproper = (f: MixedNumber): SimpleFraction => ({ n: f.w * f.d + f.n, d: f.d });
const toMixed = (f: SimpleFraction): MixedNumber => ({ w: Math.floor(f.n / f.d), n: f.n % f.d, d: f.d });
const simplify = (f: SimpleFraction): SimpleFraction => {
    const common = gcd(f.n, f.d);
    return { n: f.n / common, d: f.d / common };
};
const mixedNumberToString = (f: MixedNumber): string => {
    if (f.w === 0) return `${f.n}/${f.d}`;
    if (f.n === 0) return `${f.w}`;
    return `${f.w} ${f.n}/${f.d}`;
};
const simpleFractionToString = (f: SimpleFraction): string => {
    if (f.d === 1) return `${f.n}`;
    return `${f.n}/${f.d}`;
}
const createMixedNumber = (): MixedNumber => ({ w: randomInt(1, 4), n: randomInt(1, 4), d: randomInt(5, 9) });

// --- Question Generators ---

const generateAddition = (): Question => {
    const num1 = randomInt(100, 9999);
    const num2 = randomInt(100, 9999);
    const text = Math.random() < 0.5
        ? `${num1} + ${num2} =`
        : `_ = ${num1} + ${num2}`;
    return { type: QuestionType.Addition, text, answer: (num1 + num2).toString() };
};

const generateSubtraction = (): Question => {
    const num1 = randomInt(1000, 9999);
    const num2 = randomInt(100, num1 - 10);
    const text = Math.random() < 0.5
        ? `${num1} - ${num2} =`
        : `_ = ${num1} - ${num2}`;
    return { type: QuestionType.Subtraction, text, answer: (num1 - num2).toString() };
};

const generateSubtractionWithRegrouping = (): Question => {
    const multiple = randomInt(1, 9) * 1000;
    const num2 = randomInt(100, multiple - 100);
    return { type: QuestionType.SubtractionWithRegrouping, text: `${multiple} - ${num2} =`, answer: (multiple - num2).toString() };
};

const generateMultiplication = (): Question => {
    const num1 = randomInt(10, 99);
    const num2 = randomInt(2, 9);
    const text = Math.random() < 0.5
        ? `${num1} × ${num2} =`
        : `_ = ${num1} × ${num2}`;
    return { type: QuestionType.Multiplication, text, answer: (num1 * num2).toString() };
};

const generateMultiplication3Numbers = (): Question => {
    const nums = [randomInt(2, 10), randomInt(2, 10), randomInt(0, 10)];
    // shuffle
    for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    const answer = nums.reduce((a, b) => a * b, 1);
    return { type: QuestionType.Multiplication3Numbers, text: `${nums[0]} × ${nums[1]} × ${nums[2]} =`, answer: answer.toString() };
};

const generateDivision = (): Question => {
    const divisor = randomInt(2, 9);
    const quotient = randomInt(10, 99);
    const dividend = divisor * quotient;
    const text = Math.random() < 0.5
        ? `${dividend} ÷ ${divisor} =`
        : `_ = ${dividend} ÷ ${divisor}`;
    return { type: QuestionType.Division, text, answer: quotient.toString() };
};

const generateDivisionWithKnownFacts = (): Question => {
    const fact = randomInt(2, 12);
    const multiple = randomInt(2, 9) * fact;
    const powerOf10 = 10 ** randomInt(1, 3);
    const dividend = multiple * powerOf10;
    const answer = (dividend / fact).toString();
    return { type: QuestionType.DivisionWithKnownFacts, text: `${dividend} ÷ ${fact} =`, answer };
};


const generateLongMultiplication = (): Question => {
    const num1 = randomInt(100, 999);
    const num2 = randomInt(10, 99);
    return {
        type: QuestionType.LongMultiplication,
        text: `${num1} × ${num2} =`,
        operands: [num1.toString(), num2.toString()],
        operator: '×',
        answer: (num1 * num2).toString()
    }
};

const generateLongDivision = (): Question => {
    const divisor = randomInt(11, 40);
    const quotient = randomInt(11, 99);
    const dividend = divisor * quotient;
    return {
        type: QuestionType.LongDivision,
        text: `${divisor} │ ${dividend}`,
        answer: quotient.toString()
    }
};

const generateFractionAdditionUnlikeDenominators = (): Question => {
    const den1 = randomInt(3, 7);
    let den2 = randomInt(3, 7);
    while (den1 === den2) den2 = randomInt(3, 7);
    const num1 = randomInt(1, den1 - 1);
    const num2 = randomInt(1, den2 - 1);

    const resNum = (num1 * den2) + (num2 * den1);
    const resDen = den1 * den2;
    const answerFrac = simplify({ n: resNum, d: resDen });

    return {
        type: QuestionType.FractionAdditionUnlikeDenominators,
        text: `${num1}/${den1} + ${num2}/${den2} =`,
        operands: [`${num1}/${den1}`, `${num2}/${den2}`],
        operator: '+',
        answer: simpleFractionToString(answerFrac)
    }
};
const generateFractionAdditionSimpleDenominators = (): Question => {
    const den1 = randomInt(2, 6);
    const multiplier = randomInt(2, 4);
    const den2 = den1 * multiplier;
    const num1 = randomInt(1, den1 - 1);
    const num2 = randomInt(1, den2 - 1);

    const resNum = (num1 * multiplier) + num2;
    const resDen = den2;
    const answerFrac = simplify({ n: resNum, d: resDen });

    return {
        type: QuestionType.FractionAdditionSimpleDenominators,
        text: `${num1}/${den1} + ${num2}/${den2} =`,
        operands: [`${num1}/${den1}`, `${num2}/${den2}`],
        operator: '+',
        answer: simpleFractionToString(answerFrac)
    }
}

const generateFractionAdditionMixedNumbers = (): Question => {
    const f1 = createMixedNumber();
    const f2 = createMixedNumber();
    const imp1 = toImproper(f1);
    const imp2 = toImproper(f2);

    const resNum = (imp1.n * imp2.d) + (imp2.n * imp1.d);
    const resDen = imp1.d * imp2.d;
    const simplified = simplify({ n: resNum, d: resDen });
    const answerMixed = toMixed(simplified);

    return {
        type: QuestionType.FractionAdditionMixedNumbers,
        text: `${mixedNumberToString(f1)} + ${mixedNumberToString(f2)} =`,
        operands: [mixedNumberToString(f1), mixedNumberToString(f2)],
        operator: '+',
        answer: mixedNumberToString(answerMixed)
    }
}

const generateFractionSubtractionUnlikeDenominators = (): Question => {
    let den1 = randomInt(3, 10);
    let den2 = randomInt(3, 10);
    let num1 = randomInt(1, den1 - 1);
    let num2 = randomInt(1, den2 - 1);

    if ((num1 / den1) < (num2 / den2)) {
        [num1, num2] = [num2, num1];
        [den1, den2] = [den2, den1];
    }

    const resNum = (num1 * den2) - (num2 * den1);
    if (resNum === 0) return generateFractionSubtractionUnlikeDenominators();

    const resDen = den1 * den2;
    const answerFrac = simplify({ n: resNum, d: resDen });

    return {
        type: QuestionType.FractionSubtractionUnlikeDenominators,
        text: `${num1}/${den1} - ${num2}/${den2} =`,
        operands: [`${num1}/${den1}`, `${num2}/${den2}`],
        operator: '−',
        answer: simpleFractionToString(answerFrac)
    }
};
const generateFractionSubtractionSimpleDenominators = (): Question => {
    // FIX: Changed den1 to let to allow for reassignment in the swap logic.
    let den1 = randomInt(2, 6);
    const multiplier = randomInt(2, 4);
    let den2 = den1 * multiplier;
    let num1 = randomInt(1, den1 - 1);
    let num2 = randomInt(1, den2 - 1);

    if ((num1 / den1) < (num2 / den2)) {
        [num1, num2] = [num2, num1];
        [den1, den2] = [den2, den1]; // den2 will now be the smaller one
    }
    const commonDen = Math.max(den1, den2);
    const mult = commonDen / Math.min(den1, den2);

    const resNum = den1 > den2 ? num1 - (num2 * mult) : (num1 * mult) - num2;
    if (resNum === 0) return generateFractionSubtractionSimpleDenominators();

    const answerFrac = simplify({ n: resNum, d: commonDen });

    return {
        type: QuestionType.FractionSubtractionSimpleDenominators,
        text: `${num1}/${den1} - ${num2}/${den2} =`,
        operands: [`${num1}/${den1}`, `${num2}/${den2}`],
        operator: '−',
        answer: simpleFractionToString(answerFrac)
    }
}
const generateFractionSubtractionMixedNumbers = (): Question => {
    let f1 = createMixedNumber();
    let f2 = createMixedNumber();
    let imp1 = toImproper(f1);
    let imp2 = toImproper(f2);

    if ((imp1.n / imp1.d) < (imp2.n / imp2.d)) {
        [f1, f2] = [f2, f1];
        [imp1, imp2] = [imp2, imp1];
    }

    const resNum = (imp1.n * imp2.d) - (imp2.n * imp1.d);
    if (resNum === 0) return generateFractionSubtractionMixedNumbers();

    const resDen = imp1.d * imp2.d;
    const simplified = simplify({ n: resNum, d: resDen });
    const answerMixed = toMixed(simplified);

    return {
        type: QuestionType.FractionSubtractionMixedNumbers,
        text: `${mixedNumberToString(f1)} - ${mixedNumberToString(f2)} =`,
        operands: [mixedNumberToString(f1), mixedNumberToString(f2)],
        operator: '−',
        answer: mixedNumberToString(answerMixed)
    }
}

const generateFractionMultiplication = (): Question => {
    const den1 = randomInt(2, 8);
    const den2 = randomInt(2, 8);
    const num1 = randomInt(1, den1);
    const num2 = randomInt(1, den2);

    const resNum = num1 * num2;
    const resDen = den1 * den2;
    const answerFrac = simplify({ n: resNum, d: resDen });

    return {
        type: QuestionType.FractionMultiplication,
        text: `${num1}/${den1} × ${num2}/${den2} =`,
        operands: [`${num1}/${den1}`, `${num2}/${den2}`],
        operator: '×',
        answer: simpleFractionToString(answerFrac)
    }
};

const generateFractionMultiplicationMixedNumbers = (): Question => {
    const f1 = createMixedNumber();
    const f2 = { w: 0, n: randomInt(1, 5), d: randomInt(6, 10) }; // one mixed, one simple
    const imp1 = toImproper(f1);
    const imp2 = toImproper(f2);

    const resNum = imp1.n * imp2.n;
    const resDen = imp1.d * imp2.d;
    const simplified = simplify({ n: resNum, d: resDen });
    const answerMixed = toMixed(simplified);

    return {
        type: QuestionType.FractionMultiplicationMixedNumbers,
        text: `${mixedNumberToString(f1)} × ${mixedNumberToString(f2)} =`,
        operands: [mixedNumberToString(f1), mixedNumberToString(f2)],
        operator: '×',
        answer: mixedNumberToString(answerMixed)
    }
}

const generateFractionDivision = (): Question => {
    const den1 = randomInt(2, 10);
    const num1 = randomInt(1, 9);
    const divisor = randomInt(2, 5);

    const resNum = num1;
    const resDen = den1 * divisor;
    const answerFrac = simplify({ n: resNum, d: resDen });

    return {
        type: QuestionType.FractionDivision,
        text: `${num1}/${den1} ÷ ${divisor} =`,
        operands: [`${num1}/${den1}`, `${divisor}`],
        operator: '÷',
        answer: simpleFractionToString(answerFrac)
    };
};

const generateFractionsOfAmounts = (): Question => {
    const den = randomInt(2, 10);
    const num = randomInt(1, den - 1);
    const multiple = randomInt(2, 12);
    const amount = den * multiple;

    const answer = (amount / den) * num;

    return {
        type: QuestionType.FractionsOfAmounts,
        text: `${num}/${den} of ${amount} =`,
        answer: answer.toString(),
    };
};


const generateDecimalAddition = (): Question => {
    const places1 = randomInt(1, 3);
    const places2 = randomInt(1, 3);
    const num1 = parseFloat((Math.random() * 50).toFixed(places1));
    const num2 = parseFloat((Math.random() * 50).toFixed(places2));
    const answer = (num1 + num2).toFixed(Math.max(places1, places2));
    return { type: QuestionType.DecimalAddition, text: `${num1} + ${num2} =`, answer: answer.toString() };
};

const generateDecimalSubtraction = (): Question => {
    const places1 = randomInt(1, 3);
    const places2 = randomInt(1, 3);
    const num1 = parseFloat((Math.random() * 50 + 50).toFixed(places1));
    const num2 = parseFloat((Math.random() * 50).toFixed(places2));
    const answer = (num1 - num2).toFixed(Math.max(places1, places2));
    return { type: QuestionType.DecimalSubtraction, text: `${num1} - ${num2} =`, answer: answer.toString() };
};

const generateDecimalMultiplication = (): Question => {
    const num1 = (Math.random() * 9 + 1).toFixed(1);
    const num2 = randomInt(1, 9);
    const answer = (parseFloat(num1) * num2).toFixed(1);
    return { type: QuestionType.DecimalMultiplication, text: `${num1} × ${num2} =`, answer: answer.toString() };
};

const generateDecimalMultiplication2Digit = (): Question => {
    // Generate ones.tenths format (e.g., 4.8)
    const ones = randomInt(1, 9);
    const tenths = randomInt(1, 9);
    const num1 = parseFloat(`${ones}.${tenths}`);

    // Generate two-digit multiplier (10-99)
    const num2 = randomInt(10, 99);

    const answer = (num1 * num2).toFixed(1);
    return {
        type: QuestionType.DecimalMultiplication2Digit,
        text: `${num1} × ${num2} =`,
        answer: answer.toString()
    };
};

const generateFractionMultiplication2Digit = (): Question => {
    // Generate mixed number between 1 and 4
    const whole = randomInt(1, 4);
    const numerator = randomInt(1, 5);
    const denominator = randomInt(numerator + 1, 9); // Ensure proper fraction

    // Generate two-digit multiplier (10-99)
    const multiplier = randomInt(10, 99);

    // Convert to improper fraction for calculation
    const improperNum = whole * denominator + numerator;

    // Calculate answer
    const resultNum = improperNum * multiplier;
    const simplified = simplify({ n: resultNum, d: denominator });
    const answerMixed = toMixed(simplified);

    return {
        type: QuestionType.FractionMultiplication2Digit,
        text: `${whole} ${numerator}/${denominator} × ${multiplier} =`,
        operands: [`${whole} ${numerator}/${denominator}`, `${multiplier}`],
        operator: '×',
        answer: mixedNumberToString(answerMixed)
    };
};

const generatePercentages = (difficulty: number = 0): Question => {
    let percentage: number;

    // Progressive difficulty based on correctInARow count (max 5 in practice zone)
    if (difficulty < 1) {
        // First question: Easy percentages (10, 20, 25, 50, 75)
        percentage = [10, 20, 25, 50, 75][randomInt(0, 4)];
    } else if (difficulty < 2) {
        // Question 2: Multiples of 10% (10, 20, 30, 40, 50, 60, 70, 80, 90)
        percentage = randomInt(2, 9) * 10;
    } else if (difficulty < 3) {
        // Questions 3-4: Multiples of 5% (5, 10, 15, 20, ..., 95)
        percentage = randomInt(3, 19) * 5;
    } else {
        // Question 5 (4-5 stars): Any multiple of 1% (1-99)
        do {
            percentage = randomInt(1, 99);
        } while (percentage % 5 === 0);
    }

    const num = randomInt(2, 20) * 10;
    const answerVal = (percentage / 100) * num;
    // Fix floating point precision (e.g. 26.4000000002)
    const answer = parseFloat(answerVal.toFixed(10));
    return { type: QuestionType.Percentages, text: `${percentage}% of ${num} =`, answer: answer.toString() };
};

const generateBIDMAS = (): Question => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const SQUARE_CHAR = '²';
    const toPowerToken = (base: number) => `${base}${SQUARE_CHAR}`;

    while (true) {
        const opPool: string[] = ['+', '-', '×', '÷', 'pow'];
        const uniqueOps = new Set<string>();
        while (uniqueOps.size < 2) uniqueOps.add(pick(opPool));
        const allowedOps = Array.from(uniqueOps);

        // Exactly two operations (three operands)
        const opSeq: string[] = [pick(allowedOps), pick(allowedOps)];

        const powCount = opSeq.filter(op => op === 'pow').length;
        // If any power is present, only one is allowed and the other op must be + or -
        if (powCount > 1) continue;
        if (powCount === 1 && opSeq.some(op => op !== 'pow' && op !== '+' && op !== '-')) continue;

        if (opSeq.filter(op => op === '÷').length > 1) continue; // at most one division

        const a = randomInt(2, 12);
        const b = randomInt(2, 12);
        const c = randomInt(2, 12);

        const firstOperand = opSeq[0] === 'pow' ? toPowerToken(a) : a.toString();
        const secondOperand = b.toString();
        const thirdOperand = opSeq[1] === 'pow' ? toPowerToken(c) : c.toString();

        const wrapFirst = opSeq[0] !== 'pow' && Math.random() < 0.35;

        const tokens: string[] = [];
        if (wrapFirst) tokens.push('(');
        tokens.push(firstOperand, opSeq[0] === 'pow' ? '×' : opSeq[0], secondOperand);
        if (wrapFirst) tokens.push(')');
        tokens.push(opSeq[1] === 'pow' ? '×' : opSeq[1], thirdOperand);

        const textExpr = tokens.join(' ');

        const parseTokens = (expr: string): string[] =>
            expr.match(/(\d+[²]?|\(|\)|[+\-×÷])/g) || [];
        const isPowTok = (tok: string) => tok.endsWith(SQUARE_CHAR);
        const powBase = (tok: string) => parseInt(tok.slice(0, -1), 10);

        const bidmasSteps: any[] = [];
        const applyOp = (aVal: number, op: string, bVal: number) => {
            switch (op) {
                case '+': return aVal + bVal;
                case '-': return aVal - bVal;
                case '×': return aVal * bVal;
                case '÷': return aVal / bVal;
                default: return NaN;
            }
        };

        const resolve = (toks: string[]): number => {
            while (toks.includes('(')) {
                const close = toks.indexOf(')');
                let open = close - 1;
                while (open >= 0 && toks[open] !== '(') open--;
                const inner = toks.slice(open + 1, close);
                const val = resolve(inner);
                bidmasSteps.push({
                    expression: toks.join(' '),
                    activeExpression: inner.join(' '),
                    operation: '()',
                    operands: [inner.join(' ')],
                    result: val.toString(),
                });
                toks.splice(open, close - open + 1, val.toString());
            }

            let i = 0;
            while (i < toks.length) {
                if (isPowTok(toks[i])) {
                    const base = powBase(toks[i]);
                    const res = Math.pow(base, 2);
                    bidmasSteps.push({
                        expression: toks.join(' '),
                        activeExpression: toks[i],
                        operation: '^',
                        operands: [base.toString(), '2'],
                        result: res.toString(),
                    });
                    toks.splice(i, 1, res.toString());
                    i = Math.max(i - 1, 0);
                } else {
                    i++;
                }
            }

            const resolveGroup = (group: string[]) => {
                let j = 0;
                while (j < toks.length) {
                    const op = toks[j];
                    if (!group.includes(op)) { j++; continue; }
                    const left = parseFloat(toks[j - 1]);
                    const right = parseFloat(toks[j + 1]);
                    const res = applyOp(left, op, right);
                    const active = `${toks[j - 1]} ${op} ${toks[j + 1]}`;
                    bidmasSteps.push({
                        expression: toks.join(' '),
                        activeExpression: active,
                        operation: op,
                        operands: [toks[j - 1], toks[j + 1]],
                        result: res.toString(),
                    });
                    toks.splice(j - 1, 3, res.toString());
                    j = Math.max(j - 1, 0);
                }
            };

            resolveGroup(['×', '÷']);
            resolveGroup(['+', '-']);
            return parseFloat(toks[0]);
        };

        const result = resolve(parseTokens(textExpr));
        const hasNonIntegerDivision = bidmasSteps.some(
            (step) => step.operation === '÷' && !Number.isInteger(Number(step.result))
        );

        if (!Number.isFinite(result) || result < 0 || hasNonIntegerDivision) continue;

        return {
            type: QuestionType.BIDMAS,
            text: `${textExpr} =`,
            answer: result.toString(),
            bidmasMetadata: {
                operations: opSeq.map(op => op === 'pow' ? '^' : op),
                executionSteps: bidmasSteps,
                hasBrackets: wrapFirst,
                hasIndices: opSeq.includes('pow'),
            }
        };
    }
};

const generateMultiplyByPowersOf10 = (): Question => {
    const power = [10, 100, 1000][randomInt(0, 2)];
    const num = parseFloat((Math.random() * 99 + 1).toFixed(randomInt(1, 2)));
    const answer = num * power;
    const sanitizedAnswer = parseFloat(answer.toFixed(10)).toString();
    return { type: QuestionType.MultiplyBy10_100_1000, text: `${num} × ${power} =`, answer: sanitizedAnswer };
};

const generateDivideByPowersOf10 = (): Question => {
    const power = [10, 100, 1000][randomInt(0, 2)];
    const num = parseFloat((Math.random() * 99 + 1).toFixed(randomInt(1, 2)));
    const answer = num / power;
    const sanitizedAnswer = parseFloat(answer.toFixed(10)).toString();
    return { type: QuestionType.DivideBy10_100_1000, text: `${num} ÷ ${power} =`, answer: sanitizedAnswer };
};

const generatePlaceValue = (): Question => {
    const num = randomInt(1000000, 9999999);
    let strNum = num.toString();
    const parts: number[] = [];
    for (let i = 0; i < strNum.length; i++) {
        if (strNum[i] !== '0') {
            parts.push(parseInt(strNum[i]) * Math.pow(10, strNum.length - 1 - i));
        }
    }
    if (parts.length < 2) return generatePlaceValue();

    const answerIndex = randomInt(0, parts.length - 1);
    const answer = parts[answerIndex];
    const questionParts = [...parts.slice(0, answerIndex), ...parts.slice(answerIndex + 1)];

    // Shuffle question parts and add the blank
    const displayParts = [...questionParts.map(formatWithCommas), '_'];
    for (let i = displayParts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [displayParts[i], displayParts[j]] = [displayParts[j], displayParts[i]];
    }

    const text = `${formatWithCommas(num)} = ${displayParts.join(' + ')}`;
    return { type: QuestionType.PlaceValue, text, answer: formatWithCommas(answer) };
};

const generatePowersIndices = (): Question => {
    const base = randomInt(2, 10);
    const power = randomInt(2, 3);
    const powerChar = power === 2 ? '²' : '³';
    const text = `${base}${powerChar} =`;
    const answer = Math.pow(base, power);
    return { type: QuestionType.PowersIndices, text, answer: answer.toString() };
};


const generators: Record<QuestionType, () => Question> = {
    [QuestionType.Addition]: generateAddition,
    [QuestionType.Subtraction]: generateSubtraction,
    [QuestionType.SubtractionWithRegrouping]: generateSubtractionWithRegrouping,
    [QuestionType.Multiplication]: generateMultiplication,
    [QuestionType.LongMultiplication]: generateLongMultiplication,
    [QuestionType.Multiplication3Numbers]: generateMultiplication3Numbers,
    [QuestionType.Division]: generateDivision,
    [QuestionType.LongDivision]: generateLongDivision,
    [QuestionType.DivisionWithKnownFacts]: generateDivisionWithKnownFacts,
    [QuestionType.BIDMAS]: generateBIDMAS,
    [QuestionType.PlaceValue]: generatePlaceValue,
    [QuestionType.MultiplyBy10_100_1000]: generateMultiplyByPowersOf10,
    [QuestionType.DivideBy10_100_1000]: generateDivideByPowersOf10,
    [QuestionType.PowersIndices]: generatePowersIndices,
    [QuestionType.DecimalAddition]: generateDecimalAddition,
    [QuestionType.DecimalSubtraction]: generateDecimalSubtraction,
    [QuestionType.DecimalMultiplication]: generateDecimalMultiplication,
    [QuestionType.DecimalMultiplication2Digit]: generateDecimalMultiplication2Digit,
    [QuestionType.FractionAdditionSimpleDenominators]: generateFractionAdditionSimpleDenominators,
    [QuestionType.FractionAdditionUnlikeDenominators]: generateFractionAdditionUnlikeDenominators,
    [QuestionType.FractionAdditionMixedNumbers]: generateFractionAdditionMixedNumbers,
    [QuestionType.FractionSubtractionSimpleDenominators]: generateFractionSubtractionSimpleDenominators,
    [QuestionType.FractionSubtractionUnlikeDenominators]: generateFractionSubtractionUnlikeDenominators,
    [QuestionType.FractionSubtractionMixedNumbers]: generateFractionSubtractionMixedNumbers,
    [QuestionType.FractionMultiplication]: generateFractionMultiplication,
    [QuestionType.FractionMultiplicationMixedNumbers]: generateFractionMultiplicationMixedNumbers,
    [QuestionType.FractionMultiplication2Digit]: generateFractionMultiplication2Digit,
    [QuestionType.FractionDivision]: generateFractionDivision,
    [QuestionType.FractionsOfAmounts]: generateFractionsOfAmounts,
    [QuestionType.Percentages]: generatePercentages,
};

export const questionTypes = Object.values(QuestionType);

export const generateNewQuestion = (excludeType?: QuestionType): Question => {
    let availableTypes = questionTypes;
    if (excludeType) {
        availableTypes = questionTypes.filter(t => t !== excludeType);
    }
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    return generators[randomType]();
};

export const generateQuestionByType = (type: QuestionType, difficulty: number = 0): Question => {
    // Special handling for Percentages with difficulty
    if (type === QuestionType.Percentages) {
        return generatePercentages(difficulty);
    }

    // Handle the case where two enums point to the same generator
    if (type === QuestionType.DivideBy10_100_1000) {
        // We need to ensure a division question is generated
        let q = generators[type]();
        while (q.type !== QuestionType.DivideBy10_100_1000) {
            q = generators[type]();
        }
        return q;
    }
    return generators[type]();
};