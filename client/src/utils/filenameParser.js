export function parseFilename(filename) {
    if (!filename) return { guesses: {}, confidence: 0 };

    const cleanName = filename.toLowerCase().replace(/[-_]/g, ' ');
    const guesses = {};
    let matchCount = 0;

    const semMatch = cleanName.match(/\b(?:sem(?:ester)?|s)\s*([1-8])\b|\b([1-8])(?:st|nd|rd|th)?\s*sem\b/i);
    if (semMatch) {
        guesses.semester = semMatch[1] || semMatch[2];
        matchCount++;
    }

    const yearMatch = cleanName.match(/(?:20)(\d{2})/);
    if (yearMatch) {
        guesses.year = "20" + yearMatch[1];
        matchCount++;
    }

    if (cleanName.match(/mid\s*term|mid/i)) {
        guesses.examType = 'Midterm';
        matchCount++;
    } else if (cleanName.match(/final|end\s*sem/i)) {
        guesses.examType = 'Final';
        matchCount++;
    } else if (cleanName.match(/quiz/i)) {
        guesses.examType = 'Quiz';
        matchCount++;
    } else if (cleanName.match(/assign/i)) {
        guesses.examType = 'Assignment';
        matchCount++;
    }

    const courseMatch = cleanName.match(/[a-z]{2,3}\s*\d{3}/i);
    if (courseMatch) {
        guesses.courseCode = courseMatch[0].replace(/\s+/g, '').toUpperCase();
        matchCount++;
    }

    const confidence = (matchCount / 4) * 100;

    return { guesses, confidence };
}