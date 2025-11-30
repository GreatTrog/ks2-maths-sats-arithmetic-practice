import { Question, QuestionType } from '../types';

// --- Helper Functions ---
const getOperands = (question: Question, count = 2): string[] => {
    if (question.operands && question.operands.length >= count) {
        return question.operands;
    }
    // Regex to find numbers, including decimals, fractions (e.g., "1/2"), and whole numbers.
    const numbers = question.text.match(/(\d+\s+\d+\/\d+)|(\d+\/\d+)|(\d+\.\d+)|(\d+)/g) || [];
    return numbers.slice(0, count);
};

const parseSimpleFraction = (fracStr: string): { n: number; d: number } | null => {
    if (!fracStr || !fracStr.includes('/')) return null;
    const [nStr, dStr] = fracStr.split('/');
    const n = parseInt(nStr, 10);
    const d = parseInt(dStr, 10);
    if (isNaN(n) || isNaN(d)) return null;
    return { n, d };
}

const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;


// --- Explanation Templates per QuestionType ---

const getAdditionExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Set up in columns.** To solve **${num1} + ${num2}**, we write the numbers one above the other, making sure to line up the ones, tens, hundreds, and thousands columns.`,
        `**Add the ones.** Start from the rightmost column. Add the digits in the ones column. If the sum is 10 or more, write the ones digit of the sum and carry the tens digit over to the next column.`,
        `**Add the tens, hundreds, and thousands.** Move to the left, column by column, adding the digits. Remember to add any digit you carried over from the previous column.`,
        `**The final answer.** After adding all the columns, you'll have your answer. **${num1} + ${num2} = ${q.answer}**.`
    ];
};

const getSubtractionExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Set up in columns.** To solve **${num1} - ${num2}**, write the larger number (${num1}) on top and the smaller number (${num2}) below it. Line up the place value columns carefully.`,
        `**Subtract the ones.** Start from the right. If the top digit is smaller than the bottom digit, you need to 'exchange' or 'regroup' from the column to the left. Borrow 1 from the tens column (which is worth 10 ones) to subtract.`,
        `**Continue subtracting.** Move left through the tens, hundreds, and thousands columns, subtracting the bottom digit from the top digit. Remember to account for any exchanging you did.`,
        `**The final answer.** The result at the bottom is your answer. **${num1} - ${num2} = ${q.answer}**.`
    ];
};

const getSubtractionWithRegroupingExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Set up the problem.** We are calculating **${num1} - ${num2}**. Notice that we are subtracting from a number with lots of zeros. This means we'll need to do some careful exchanging.`,
        `**Start exchanging from the left.** Look at the ones column. We can't do 0 minus the ones digit of ${num2}. We can't exchange from the tens or hundreds either, as they are also zero. So we must go all the way to the thousands column.`,
        `**Chain of exchanges.** Exchange 1 thousand for 10 hundreds (leaving the thousands column one less). Then exchange 1 of those new hundreds for 10 tens. Finally, exchange 1 of those new tens for 10 ones. Now you have numbers in each column to subtract from.`,
        `**Subtract.** Now you can subtract column by column, from right to left, to find the answer: **${q.answer}**.`
    ];
};

const getMultiplicationExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Set up in columns.** Write the larger number on top and the single-digit number below it, aligned to the right.`,
        `**Multiply the ones.** Multiply the ones digit of the top number by **${num2}**. Write the ones digit of the result and carry the tens digit.`,
        `**Multiply the tens.** Multiply the tens digit of the top number by **${num2}**. Then, add the digit you carried over. Write down the result.`,
        `**Final Answer.** The number you have written is the final answer. **${num1} × ${num2} = ${q.answer}**.`
    ];
};

const getLongMultiplicationExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    const onesDigit = num2.slice(-1);
    const tensDigit = num2.slice(0, 1);
    return [
        `**Multiply by the ones digit.** First, we multiply the top number (**${num1}**) by the ones digit of the bottom number (**${onesDigit}**). Write the result down.`,
        `**Prepare to multiply by the tens digit.** Now, we multiply the top number (**${num1}**) by the tens digit (**${tensDigit}**). Because **${tensDigit}** is in the tens place, we are really multiplying by **${tensDigit}0**. To show this, we put a **zero** in the ones column of our second line.`,
        `**Multiply and add.** Calculate **${num1} × ${tensDigit}** and write it next to the zero. Now, add the two numbers you calculated using column addition.`,
        `**Final Answer.** The sum of those two numbers is your final answer: **${q.answer}**.`
    ];
};

const getMultiplication3NumbersExplanation = (q: Question): string[] => {
    const [n1Str, n2Str, n3Str] = getOperands(q, 3);
    const n1 = parseInt(n1Str);
    const n2 = parseInt(n2Str);
    const n3 = parseInt(n3Str);

    // Define the 3 possible pairs and their "remaining" number
    const options = [
        { a: n1, b: n2, rem: n3, aStr: n1Str, bStr: n2Str, remStr: n3Str },
        { a: n2, b: n3, rem: n1, aStr: n2Str, bStr: n3Str, remStr: n1Str },
        { a: n1, b: n3, rem: n2, aStr: n1Str, bStr: n3Str, remStr: n2Str }
    ];

    // Strategy 1: Look for multiples of 10
    let bestOption = options.find(opt => (opt.a * opt.b) % 10 === 0);
    let strategyText = "";

    if (bestOption) {
        strategyText = `We chose to multiply **${bestOption.aStr}** and **${bestOption.bStr}** first because they make a multiple of 10, which is easier to work with.`;
    } else {
        // Strategy 2: Minimize the remaining multiplier (easier final step)
        // Sort options by the size of the remaining number (ascending)
        options.sort((x, y) => x.rem - y.rem);
        bestOption = options[0];
        strategyText = `We chose to multiply **${bestOption.aStr}** and **${bestOption.bStr}** first so that we can multiply by the smallest number (**${bestOption.remStr}**) at the end.`;
    }

    const firstStepResult = bestOption.a * bestOption.b;

    return [
        `**The Rule:** When multiplying three numbers, the order doesn't matter! You can multiply them in any order you find easiest.`,
        `**Choose the easiest order.** ${strategyText}`,
        `**Step 1:** Calculate **${bestOption.aStr} × ${bestOption.bStr}**. This gives us **${firstStepResult}**.`,
        `**Step 2:** Now, take that answer (**${firstStepResult}**) and multiply it by the remaining number, **${bestOption.remStr}**.`,
        `**Final Answer.** **${firstStepResult} × ${bestOption.remStr} = ${q.answer}**.`
    ];
};

const getDivisionExplanation = (q: Question): string[] => {
    const [dividend, divisor] = getOperands(q);
    return [
        `**Use the 'Bus Stop' method.** Draw a 'bus stop' shape. Place the number you are dividing (**${dividend}**, the dividend) inside the bus stop. Place the number you are dividing by (**${divisor}**, the divisor) outside.`,
        `**Divide the first digit.** Look at the first digit of the dividend. How many times does **${divisor}** go into it? Write the answer on top of the bus stop. Write any remainder small, next to the next digit of the dividend.`,
        `**Repeat for the next digits.** Move to the next digit inside the bus stop (including the remainder from before). How many times does **${divisor}** go into this new number? Write the answer on top.`,
        `**Final Answer.** Continue until you have used all the digits in the dividend. The number on top of the bus stop is your answer: **${q.answer}**.`
    ];
};

const getLongDivisionExplanation = (q: Question): string[] => {
    const [divisor, dividend] = q.text.split(' │ ');
    return [
        `**Step 1: Set up the problem.** We use the 'bus stop' method. Write the number you are dividing by (**${divisor}**, the divisor) on the outside. Write the number being divided (**${dividend}**, the dividend) on the inside.`,
        `**Step 2: Divide.** Look at the first digit(s) of the dividend. How many times does **${divisor}** go into this number? Write your answer directly above the last digit you used inside the bus stop. If it doesn't fit, write a 0.`,
        `**Step 3: Multiply and Subtract.** Multiply the number you just wrote on top by the divisor (**${divisor}**). Write this result underneath the part of the dividend you just used. Subtract to find the remainder.`,
        `**Step 4: Bring Down and Repeat.** Bring down the next digit from the dividend and write it next to your remainder. This creates your new number to work with. Repeat steps 2, 3, and 4 until you have used all the digits in the dividend. The number on top is your final answer: **${q.answer}**.`
    ];
};

const getDivisionWithKnownFactsExplanation = (q: Question): string[] => {
    const [dividend, divisor] = getOperands(q);

    // Remove trailing zeros from dividend to find the base fact
    // We want to find the largest prefix of the dividend that is divisible by the divisor
    let baseDividend = parseInt(dividend);

    const nonZeroMatch = dividend.match(/^(\d+?)0*$/);
    if (nonZeroMatch) {
        const prefix = parseInt(nonZeroMatch[1]);
        if (prefix % parseInt(divisor) === 0) {
            baseDividend = prefix;
        } else {
            // Try adding zeros back one by one until it works
            let temp = prefix;
            let originalStr = nonZeroMatch[1];
            let zeros = dividend.length - originalStr.length;
            for (let i = 0; i < zeros; i++) {
                temp = temp * 10;
                if (temp % parseInt(divisor) === 0) {
                    baseDividend = temp;
                    break;
                }
            }
        }
    }

    const baseAnswer = baseDividend / parseInt(divisor);
    const powerOf10 = parseInt(dividend) / baseDividend;

    return [
        `**Spot the hidden fact.** This question looks tricky, but it's based on a simple times table fact. Ignore the zeros for a moment. Can you see the simpler problem? It's **${baseDividend} ÷ ${divisor}**.`,
        `**Solve the simple fact.** We know from our times tables that **${baseDividend} ÷ ${divisor} = ${baseAnswer}**.`,
        `**Use place value to adjust.** The original number, **${dividend}**, is **${powerOf10}** times bigger than **${baseDividend}**. This means our answer must also be **${powerOf10}** times bigger.`,
        `**Final Answer.** So, we make **${baseAnswer}** bigger by a factor of **${powerOf10}**. The final answer is **${q.answer}**.`
    ];
};

const removeRedundantParens = (expr: string): string =>
  expr.replace(/\(\s*([-+]?\d+(?:\.\d+)?)\s*\)/g, '$1').replace(/\s+/g, ' ').trim();

const rewriteBIDMASExpression = (
  expression: string,
  target: string | undefined,
  result: string,
  _operation?: string,
  ..._extra: unknown[]
): string => {
  if (!target) return expression.trim();

  const removeRedundantParens = (expr: string): string =>
    expr.replace(/\(\s*([-+]?\d+(?:\.\d+)?)\s*\)/g, '$1').replace(/\s+/g, ' ').trim();

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

const getBIDMASExplanation = (q: Question): string[] => {
  const metadata = q.bidmasMetadata;

  // Fallback for legacy BIDMAS questions without metadata
  if (!metadata || !metadata.executionSteps || metadata.executionSteps.length === 0) {
    const [, num2, num3] = getOperands(q, 3);
    const multResult = parseInt(num2, 10) * parseInt(num3, 10);
    const baseExpression = q.text.replace('=', '').trim();
    const multiplicationPartMatch = baseExpression.match(new RegExp(`${num2}\\s*[^\\d]+\\s*${num3}`));
    const multiplicationPart = multiplicationPartMatch ? multiplicationPartMatch[0] : `${num2} * ${num3}`;
    const rewritten = baseExpression.replace(multiplicationPart, multResult.toString());

    return [
      `**Remember BIDMAS!** The order of operations is crucial: Brackets, Indices, Division, Multiplication, Addition, Subtraction.`,
      `**Spot the first operation.** In **${baseExpression}**, tackle the multiplication first: **${multiplicationPart}**.`,
      `**Rewrite after the first step.** Replace that part with its answer: **${rewritten}**.`,
      `**Finish it off.** Now add the remaining number to get **${q.answer}**.`
    ];
  }

  const steps: string[] = [];
  const questionText = q.text.replace('=', '').trim();
  const uniqueOps = Array.from(new Set(metadata.operations));
  const featureList: string[] = [];

  const isMultiplicationOp = (op: string) => ['×', 'x', '*'].includes(op);
  const isDivisionOp = (op: string) => ['÷', '/'].includes(op);

  if (metadata.hasBrackets) featureList.push('brackets');
  if (metadata.hasIndices) featureList.push('indices');
  uniqueOps.forEach((op) => {
    if (op === '+') featureList.push('addition');
    else if (op === '-') featureList.push('subtraction');
    else if (isMultiplicationOp(op)) featureList.push('multiplication');
    else if (isDivisionOp(op)) featureList.push('division');
  });

  const featuresText =
    featureList.length > 1
      ? featureList.slice(0, -1).join(', ') + ' and ' + featureList.slice(-1)
      : featureList[0] || 'these operations';

  steps.push(`**Remember BIDMAS!** We follow Brackets, Indices, Division/Multiplication, then Addition/Subtraction in that order.`);
  steps.push(`**Scan the question.** ${questionText} includes ${featuresText}.`);

  const isPureNumber = (expr: string) => expr.trim().match(/^-?\d+(\.\d+)?$/);

  let runningExpression = questionText;
  metadata.executionSteps.forEach((step, idx) => {
    const activeExpr = step.activeExpression || `${step.operands[0]} ${step.operation} ${step.operands[1]}`;
    // Skip noisy steps that only contain a single evaluated number
    if (isPureNumber(activeExpr)) {
      runningExpression = rewriteBIDMASExpression(runningExpression, activeExpr, step.result, step.operation);
      return;
    }
    const rewritten = rewriteBIDMASExpression(runningExpression, activeExpr, step.result, step.operation);

    steps.push(`**Step ${idx + 1}:** Calculate **${activeExpr}**.`);
    steps.push(`**Rewrite:** ${rewritten}`);
    runningExpression = rewritten;
  });

  steps.push(`**All done.** After these steps, the equation simplifies to **${runningExpression}**.`);

  return steps;
};
const getPlaceValueExplanation = (q: Question): string[] => {
    const [num] = getOperands(q);
    return [
        `**Understand partitioning.** This question asks us to 'partition' the number **${num}**. This means breaking it down into its place value parts (Millions, Hundred Thousands, Ten Thousands, etc.).`,
        `**Identify the parts.** Let's look at the parts given in the question and compare them to the original number **${num}**.`,
        `**Find the missing value.** By checking each digit of **${num}** against the parts provided, we can see which place value is missing.`,
        `**The Answer.** The missing part of the number is **${q.answer}**.`
    ];
};

const getMultiplyBy10_100_1000Explanation = (q: Question): string[] => {
    const [num, power] = getOperands(q);
    const zeros = (power.match(/0/g) || []).length;

    // Fix floating point precision issues (e.g. 38.26 * 10 -> 382.59999999999997)
    // We round to 10 decimal places and then parse back to remove trailing zeros
    const displayAnswer = parseFloat(Number(q.answer).toFixed(10)).toString();

    return [
        `**Identify the operation.** We are multiplying by **${power}**, so we need to make the number **${num}** bigger. The key is that the digits move, not the decimal point.`,
        `**Count the zeros.** The number **${power}** has **${zeros}** zero(s). This tells us how many places to move the digits.`,
        `**Move the digits to the LEFT.** Every digit in **${num}** shifts **${zeros}** place(s) to the left. The ones digit moves to the tens column, the tenths digit moves to the ones column, and so on.`,
        `**Final Answer.** After shifting the digits, the new, larger number is **${displayAnswer}**.`
    ];
};

const getDivideBy10_100_1000Explanation = (q: Question): string[] => {
    const [num, power] = getOperands(q);
    const zeros = (power.match(/0/g) || []).length;

    // Fix floating point precision issues
    const displayAnswer = parseFloat(Number(q.answer).toFixed(10)).toString();

    return [
        `**Identify the operation.** We are dividing by **${power}**, so we need to make the number **${num}** smaller. The key is that the digits move, not the decimal point.`,
        `**Count the zeros.** The number **${power}** has **${zeros}** zero(s). This tells us how many places to move the digits.`,
        `**Move the digits to the RIGHT.** Every digit in **${num}** shifts **${zeros}** place(s) to the right. The tens digit moves to the ones column, the ones digit moves to the tenths column, and so on. We may need to add placeholder zeros.`,
        `**Final Answer.** After shifting the digits, the new, smaller number is **${displayAnswer}**.`
    ];
};

const getDecimalAdditionExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Line up the decimal points!** This is the most important rule. Write the numbers in a column, ensuring the decimal points are directly underneath each other.`,
        `**Fill in gaps with zeros.** To make it clearer, you can add placeholder zeros to the end of numbers so they have the same number of decimal places.`,
        `**Add like normal.** Start from the right and add each column, carrying over where necessary, just like you would with whole numbers.`,
        `**Bring the decimal point down.** The decimal point in your answer goes directly below the decimal points in the question. The final answer is **${q.answer}**.`
    ];
};

const getDecimalSubtractionExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    return [
        `**Line up the decimal points!** Just like addition, this is the key. Write the larger number on top, with the decimal points perfectly aligned.`,
        `**Fill in gaps with zeros.** You might need to add placeholder zeros to the end of the top number to be able to subtract.`,
        `**Subtract like normal.** Start from the right and subtract each column, exchanging (borrowing) from the left when needed.`,
        `**Bring the decimal point down.** The decimal point in your answer goes directly below the others. The final answer is **${q.answer}**.`
    ];
};

const getDecimalMultiplicationExplanation = (q: Question): string[] => {
    const [num1, num2] = getOperands(q);
    const decimalPlaces = (num1.split('.')[1] || '').length;
    const num1AsInt = num1.replace('.', '');
    return [
        `**Ignore the decimal point.** First, pretend the decimal point in **${num1}** isn't there. This turns the problem into a simpler whole number multiplication: **${num1AsInt} × ${num2}**.`,
        `**Solve the whole number problem.** Calculate **${num1AsInt} × ${num2}**. Let's say you get an answer.`,
        `**Put the decimal point back.** Now, count how many decimal places were in the original numbers. **${num1}** has **${decimalPlaces}** digit(s) after the decimal point. So, your final answer must also have **${decimalPlaces}** digit(s) after its decimal point.`,
        `**Final Answer.** Place the decimal point in the correct spot. The final answer is **${q.answer}**.`
    ];
};

const getFractionsOfAmountsExplanation = (q: Question): string[] => {
    const [fraction, amount] = q.text.replace('=', '').split('of');
    const frac = parseSimpleFraction(fraction.trim());
    if (!frac) return ["Error parsing fraction."];
    const { n, d } = frac;
    const step1Result = parseInt(amount) / d;

    return [
        `**The Rule:** To find a fraction of an amount, we remember this rhyme: *"Divide by the bottom, times by the top."*`,
        `**Divide by the denominator.** First, we take the whole amount (**${amount.trim()}**) and divide it by the denominator (the bottom number), which is **${d}**. This tells us the size of one part.  **${amount.trim()} ÷ ${d} = ${step1Result}**.`,
        `**Multiply by the numerator.** Next, we take the result from the first step (**${step1Result}**) and multiply it by the numerator (the top number), which is **${n}**. This gives us the value of the parts we want. **${step1Result} × ${n} = ${q.answer}**.`,
        `**The final answer.** The result of that multiplication is our final answer: **${q.answer}**.`
    ];
};

const getFractionAdditionExplanation = (q: Question): string[] => {
    const [f1, f2] = getOperands(q);
    const p1 = parseSimpleFraction(f1) || { n: 0, d: 1 };
    const p2 = parseSimpleFraction(f2) || { n: 0, d: 1 };

    if (p1.d === p2.d || (p1.d % p2.d === 0) || (p2.d % p1.d === 0)) {
        const commonDenominator = Math.max(p1.d, p2.d);
        return [
            `**Find a common denominator.** To add **${f1}** and **${f2}**, the bottom numbers must be the same. Notice that **${commonDenominator}** is a multiple of both ${p1.d} and ${p2.d}. So we can use **${commonDenominator}** as our common denominator.`,
            `**Make equivalent fractions.** We need to convert one or both fractions to have the denominator ${commonDenominator}. Whatever you multiply the denominator by, you must also multiply the numerator by.`,
            `**Add the new numerators.** Now that the denominators are the same, we can just add the new top numbers together.`,
            `**Simplify if needed.** The resulting fraction might need to be simplified to get the final answer: **${q.answer}**.`
        ];
    }

    const commonDenominator = (p1.d * p2.d) / gcd(p1.d, p2.d);
    return [
        `**Find a common denominator.** To add **${f1}** and **${f2}**, the bottom numbers (denominators) must be the same. A common multiple of ${p1.d} and ${p2.d} is **${commonDenominator}**. We find this by multiplying them (${p1.d} × ${p2.d}) or finding the Lowest Common Multiple.`,
        `**Make equivalent fractions.** We convert both fractions to have the denominator ${commonDenominator}. For **${f1}**, we multiply top and bottom by ${p2.d}. For **${f2}**, we multiply top and bottom by ${p1.d}.`,
        `**Add the new numerators.** Now that the denominators are the same, we can just add the new top numbers together.`,
        `**Simplify if needed.** The resulting fraction might need to be simplified to get the final answer: **${q.answer}**.`
    ];
};

const getFractionSubtractionExplanation = (q: Question): string[] => {
    const [f1, f2] = getOperands(q);
    const p1 = parseSimpleFraction(f1) || { n: 0, d: 1 };
    const p2 = parseSimpleFraction(f2) || { n: 0, d: 1 };
    const commonDenominator = (p1.d * p2.d) / gcd(p1.d, p2.d);
    return [
        `**Find a common denominator.** Just like addition, to subtract **${f2}** from **${f1}**, we need the denominators to be the same. A common denominator for ${p1.d} and ${p2.d} is **${commonDenominator}**.`,
        `**Create equivalent fractions.** Convert both fractions so they have the new denominator (${commonDenominator}). Remember to multiply the top and bottom of each fraction by the same number.`,
        `**Subtract the numerators.** With matching denominators, we can now subtract the second numerator from the first.`,
        `**Final Answer.** The result is your new fraction. Check if it can be simplified. The final answer is **${q.answer}**.`
    ];
};

const getFractionMultiplicationExplanation = (q: Question): string[] => {
    return [
        `**The Rule:** Multiplying fractions is the most straightforward fraction operation! You simply multiply the numerators together and the denominators together.`,
        `**Multiply the numerators.** Take the two top numbers and multiply them. This will be the numerator of your answer.`,
        `**Multiply the denominators.** Take the two bottom numbers and multiply them. This will be the denominator of your answer.`,
        `**Simplify.** The resulting fraction might need to be simplified. Divide the numerator and denominator by their greatest common factor to get the final answer: **${q.answer}**.`
    ];
};

const getFractionDivisionExplanation = (q: Question): string[] => {
    const [f1, divisor] = getOperands(q);
    return [
        `**The Rule: Keep, Change, Flip!** When you divide a fraction by a whole number, we use a special rule. A whole number like **${divisor}** can be written as a fraction: **${divisor}/1**.`,
        `**KEEP:** Keep the first fraction the same: **${f1}**.`,
        `**CHANGE:** Change the division sign (÷) to a multiplication sign (×).`,
        `**FLIP:** Flip the second fraction. So **${divisor}/1** becomes **1/${divisor}**. This is called finding the 'reciprocal'.`,
        `**Multiply!** Now you have a standard fraction multiplication problem. Multiply the numerators and the denominators to get the answer. Simplify if needed. The final answer is **${q.answer}**.`
    ];
};

const getMixedNumberExplanation = (q: Question): string[] => {
    return [
        `**Convert to improper fractions.** The easiest way to work with mixed numbers (like **1 ½**) is to turn them into 'top-heavy' or improper fractions first. To do this, multiply the whole number by the denominator, then add the numerator. The denominator stays the same.`,
        `**Perform the operation.** Now that you have two improper fractions, you can add, subtract, or multiply them using the normal rules for fractions (e.g., find a common denominator for +/-).`,
        `**Convert back if needed.** If your answer is an improper fraction, divide the numerator by the denominator. The result is the whole number part, and the remainder is the new numerator. The final answer is **${q.answer}**.`
    ]
};

const getPowersIndicesExplanation = (q: Question): string[] => {
    const base = q.text[0];
    const powerChar = q.text[1];
    const power = powerChar === '²' ? 2 : 3;
    const expansion = Array(power).fill(base).join(' × ');
    const name = power === 2 ? 'squared' : 'cubed';
    return [
        `**What are indices?** The small number is an 'index' or 'power'. **${base}${powerChar}** means **${base} ${name}**, or ${base} to the power of ${power}. It tells you how many times to multiply the base number by itself.`,
        `**Expand the power.** We can write this out in full as: **${expansion}**.`,
        `**Calculate the result.** Now, simply calculate the multiplication. ${expansion} = **${q.answer}**.`
    ]
};

const getPercentagesExplanation = (q: Question): string[] => {
    const [percentageStr, amount] = getOperands(q);
    const percentage = parseInt(percentageStr);
    let steps: string[] = [];
    if (percentage === 50) {
        steps = [
            `**Understand the percentage.** 50% means a half. To find 50% of something, you just need to divide it by 2.`,
            `**Calculate.** **${amount} ÷ 2 = ${q.answer}**.`
        ];
    } else if (percentage === 25) {
        steps = [
            `**Understand the percentage.** 25% is the same as a quarter (1/4). To find 25% of something, you need to divide it by 4.`,
            `**Calculate.** You can do this by halving the number, and then halving it again. **${amount} ÷ 2 = ${parseInt(amount) / 2}**. Then **${parseInt(amount) / 2} ÷ 2 = ${q.answer}**.`
        ];
    } else if (percentage === 75) {
        steps = [
            `**Understand the percentage.** 75% is the same as three quarters (3/4). To find this, we first find one quarter (25%) and then multiply that by 3.`,
            `**Find one quarter.** First, divide **${amount}** by 4. This gives you **${parseInt(q.answer) / 3}**.`,
            `**Find three quarters.** Now, multiply the answer from the previous step by 3. **${parseInt(q.answer) / 3} × 3 = ${q.answer}**.`
        ];
    } else { // 10, 20 etc
        steps = [
            `**Find 10% first.** 10% is easy to find. You just divide the amount by 10. For **${amount}**, 10% is **${parseInt(amount) / 10}**.`,
            `**Build up to the target percentage.** Our question asks for **${percentage}%**. We can get this by multiplying our 10% value. Since **${percentage}** is ${percentage / 10} times bigger than 10, we multiply our 10% value by ${percentage / 10}.`,
            `**Calculate.** **${parseInt(amount) / 10} × ${percentage / 10} = ${q.answer}**.`
        ];
    }
    return steps;
};

const getDefaultExplanation = (q: Question): string[] => {
    return [
        `This is a **${q.type}** question.`,
        `To solve this, you need to apply the correct mathematical procedure for this topic.`,
        `Think about the key steps involved in this type of calculation.`,
        `The correct answer is **${q.answer}**. Make sure to double-check your work.`
    ];
};


const explanationTemplates: Record<QuestionType, (q: Question) => string[]> = {
    [QuestionType.Addition]: getAdditionExplanation,
    [QuestionType.Subtraction]: getSubtractionExplanation,
    [QuestionType.SubtractionWithRegrouping]: getSubtractionWithRegroupingExplanation,
    [QuestionType.Multiplication]: getMultiplicationExplanation,
    [QuestionType.LongMultiplication]: getLongMultiplicationExplanation,
    [QuestionType.Multiplication3Numbers]: getMultiplication3NumbersExplanation,
    [QuestionType.Division]: getDivisionExplanation,
    [QuestionType.LongDivision]: getLongDivisionExplanation,
    [QuestionType.DivisionWithKnownFacts]: getDivisionWithKnownFactsExplanation,
    [QuestionType.BIDMAS]: getBIDMASExplanation,
    [QuestionType.PlaceValue]: getPlaceValueExplanation,
    [QuestionType.MultiplyBy10_100_1000]: getMultiplyBy10_100_1000Explanation,
    [QuestionType.DivideBy10_100_1000]: getDivideBy10_100_1000Explanation,
    [QuestionType.PowersIndices]: getPowersIndicesExplanation,
    [QuestionType.DecimalAddition]: getDecimalAdditionExplanation,
    [QuestionType.DecimalSubtraction]: getDecimalSubtractionExplanation,
    [QuestionType.DecimalMultiplication]: getDecimalMultiplicationExplanation,
    [QuestionType.FractionAdditionSimpleDenominators]: getFractionAdditionExplanation,
    [QuestionType.FractionAdditionUnlikeDenominators]: getFractionAdditionExplanation,
    [QuestionType.FractionAdditionMixedNumbers]: getMixedNumberExplanation,
    [QuestionType.FractionSubtractionSimpleDenominators]: getFractionSubtractionExplanation,
    [QuestionType.FractionSubtractionUnlikeDenominators]: getFractionSubtractionExplanation,
    [QuestionType.FractionSubtractionMixedNumbers]: getMixedNumberExplanation,
    [QuestionType.FractionMultiplication]: getFractionMultiplicationExplanation,
    [QuestionType.FractionMultiplicationMixedNumbers]: getMixedNumberExplanation,
    [QuestionType.FractionDivision]: getFractionDivisionExplanation,
    [QuestionType.FractionsOfAmounts]: getFractionsOfAmountsExplanation,
    [QuestionType.Percentages]: getPercentagesExplanation,
};

export const getBakedExplanation = (question: Question): string[] => {
    const generator = explanationTemplates[question.type];
    if (generator) {
        return generator(question);
    }
    // Fallback for any types that might be missed.
    return getDefaultExplanation(question);
};
