export type PercentageComponent = {
    value: number;
    count: number; // e.g., 3 x 1%
};

export type PercentageStrategy = {
    method: 'addition' | 'subtraction' | 'subtractionFrom50';
    components: PercentageComponent[];
    base: number; // 0 for addition, 100 for subtraction, 50 for subtractionFrom50
    target: number;
};

const STANDARD_PARTS = [50, 25, 10, 5, 1];

const decompose = (target: number): PercentageComponent[] => {
    let remaining = target;
    const components: PercentageComponent[] = [];

    for (const part of STANDARD_PARTS) {
        if (remaining >= part) {
            const count = Math.floor(remaining / part);
            components.push({ value: part, count });
            remaining -= count * part;
        }
    }
    return components;
};

const countChunks = (components: PercentageComponent[]) => components.reduce((sum, c) => sum + c.count, 0);

export const getPercentageStrategy = (percentage: number): PercentageStrategy => {
    // 1. Direct Addition
    const addComponents = decompose(percentage);
    const addCost = countChunks(addComponents);

    // 2. Subtraction from 100
    const rem100 = 100 - percentage;
    const sub100Components = decompose(rem100);
    const sub100Cost = countChunks(sub100Components) + 1; // +1 for the subtraction step

    // 3. Subtraction from 50 (only if < 50)
    let sub50Cost = Infinity;
    let sub50Components: PercentageComponent[] = [];
    if (percentage < 50) {
        const rem50 = 50 - percentage;
        sub50Components = decompose(rem50);
        sub50Cost = countChunks(sub50Components) + 1;
    }

    // Compare
    let bestMethod: 'addition' | 'subtraction' | 'subtractionFrom50' = 'addition';
    let minCost = addCost;
    let bestComponents = addComponents;
    let base = 0;

    if (sub100Cost < minCost) {
        minCost = sub100Cost;
        bestMethod = 'subtraction';
        bestComponents = sub100Components;
        base = 100;
    }

    if (sub50Cost < minCost) {
        // Prefer subtraction from 50 over addition if strictly simpler? 
        // User example 45% -> 50 - 5.
        // Add breakdown of 45: 25 + 10 + 10 (3 chunks).
        // Sub50 breakdown of 5: 5 (1 chunk). Cost = 2.
        // So yes, this catches 45%.
        bestMethod = 'subtractionFrom50';
        bestComponents = sub50Components;
        base = 50;
    }

    return {
        method: bestMethod,
        components: bestComponents,
        base,
        target: percentage
    };
};
