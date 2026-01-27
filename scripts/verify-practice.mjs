import { analyzeErrors, generateWeeklyPractice } from '../services/practiceGeneratorService.js';
import { QuestionType } from '../types.js';

// Mock TestSession
const mockSession = {
    sessionId: 'test-session-123',
    questions: [
        { questionId: 'q1', slotNumber: 1, type: QuestionType.Addition, markValue: 1, text: '1+1=', answer: '2', constraintFlags: [] },
        { questionId: 'q2', slotNumber: 2, type: QuestionType.Subtraction, markValue: 1, text: '2-1=', answer: '1', constraintFlags: [] },
        { questionId: 'q3', slotNumber: 15, type: QuestionType.Percentages, markValue: 1, text: '10% of 100', answer: '10', constraintFlags: ['percentage:standard'] },
        { questionId: 'q4', slotNumber: 36, type: QuestionType.LongDivision, markValue: 2, text: '100 / 10', answer: '10', constraintFlags: ['4digitBy2digitDivision'] },
    ],
    responses: {
        'q1': { latest: { rawInput: '3' } }, // Incorrect
        'q2': { latest: { rawInput: '1' } }, // Correct
        'q3': { latest: { rawInput: '5' } }, // Incorrect
        'q4': { latest: { rawInput: '10' } }, // Correct
    },
    marks: [
        { questionId: 'q1', slotNumber: 1, marksAwarded: 0 },
        { questionId: 'q2', slotNumber: 2, marksAwarded: 1 },
        { questionId: 'q3', slotNumber: 15, marksAwarded: 0 },
        { questionId: 'q4', slotNumber: 36, marksAwarded: 2 },
    ],
    completedAt: new Date().toISOString()
};

console.log('--- Analyzing Errors ---');
const errors = analyzeErrors(mockSession);
console.log('Errors found:', errors.length);
errors.forEach(e => console.log(`Slot ${e.slotNumber}: ${e.type}`));

console.log('\n--- Generating Weekly Practice ---');
const practice = generateWeeklyPractice(mockSession);
console.log('Total days:', practice.days.length);
practice.days.forEach(day => {
    console.log(`\n${day.day}:`);
    day.questions.forEach((q, i) => {
        console.log(`  Q${i + 1}: ${q.type} - ${q.text}`);
    });
});
