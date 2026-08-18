import test from 'node:test';
import assert from 'node:assert';
import { parseFilename } from './filenameParser.js';

test('Filename Parser - Extracts metadata from clean and messy formats', () => {
    const sampleFiles = [
        {
            file: 'CS201_Sem5_2023_Midterm.pdf',
            expected: { courseCode: 'CS201', semester: '5', year: '2023', examType: 'Midterm' }
        },
        {
            file: 'math-final-2024-s2.jpg',
            expected: { semester: '2', year: '2024', examType: 'Final' }
        },
        {
            file: 'messy_file_name_6th_sem_mid_2022.png',
            expected: { semester: '6', year: '2022', examType: 'Midterm' }
        }
    ];

    for (const sample of sampleFiles) {
        const { guesses } = parseFilename(sample.file);
        if (sample.expected.courseCode) assert.strictEqual(guesses.courseCode, sample.expected.courseCode);
        if (sample.expected.semester) assert.strictEqual(guesses.semester, sample.expected.semester);
        if (sample.expected.year) assert.strictEqual(guesses.year, sample.expected.year);
        if (sample.expected.examType) assert.strictEqual(guesses.examType, sample.expected.examType);
    }
});