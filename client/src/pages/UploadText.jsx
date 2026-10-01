import { useState } from 'react';
import { Link } from 'react-router-dom';
import HierarchyPicker from '../components/HierarchyPicker';
import { parseFilename } from '../utils/filenameParser';
import DuplicateWarning from '../components/DuplicateWarning';
import Spinner from '../components/Spinner';
import { InfinitySquareSnake } from '../components/InfinitySquareSnake';

export default function UploadText() {
  const [warnings, setWarnings] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [rawText, setRawText] = useState('');
  const [filenameInput, setFilenameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsingFilename, setIsParsingFilename] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleFilenameBlur = async () => {
    if (!filenameInput.trim()) return;

    const { guesses, confidence } = parseFilename(filenameInput);

    if (guesses.semester && !semester) setSemester(guesses.semester);
    if (guesses.year && !year) setYear(guesses.year);
    if (guesses.examType && !examType) setExamType(guesses.examType);

    if (confidence < 50) {
      setIsParsingFilename(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/parse-filename`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filename: filenameInput })
        });

        const data = await res.json();

        if (data.hints) {
          if (data.hints.semester && !semester) setSemester(data.hints.semester);
          if (data.hints.year && !year) setYear(data.hints.year);
          if (data.hints.examType && !examType) setExamType(data.hints.examType);
        }
      } catch (error) {
        console.error("Failed to fetch filename hints from AI:", error);
      } finally {
        setIsParsingFilename(false);
      }
    }
  };

  const previewSplits = () => {
    if (!rawText.trim()) return [];

    const markerRegex = /(?=\n\s*Q[a-z]*\.?\s*\d*\s*\(?[a-z]?\)?)/i;

    let rawSplits;
    if (markerRegex.test(rawText)) {
      rawSplits = rawText.split(markerRegex);
    } else {
      rawSplits = rawText.split(/\n\s*/);
    }

    return rawSplits
      .map(q => q.trim())
      .filter(q => q.length > 10);
  };

  const splits = previewSplits();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);
    setWarnings([]);
    setSkipped([]);

    if (!selectedSubject) return setError('Please select a subject from the academic hierarchy.');
    if (!rawText.trim()) return setError('Please paste some question text.');

    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: rawText,
          subject_id: selectedSubject,
          semester,
          year: year ? parseInt(year) : null,
          exam_type: examType
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload questions');

      setSuccessData(data);
      setRawText('');

      // New Inline Data Handling
      setSkipped(data.skipped || []);
      const newWarnings = (data.questions || []).filter(q => q.totalMatches > 0);
      setWarnings(newWarnings);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 border-b dark:border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Upload Raw Text</h1>
          <Link to="/dashboard" className="text-[#FF9FFC] hover:underline font-medium">← Back to Dashboard</Link>
        </div>

        {successData && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded text-green-800 dark:text-green-300">
            <strong>Success!</strong> {successData.message}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300">
            <strong>ℹ️ Skipped {skipped.length} question(s)</strong> that already existed in this exact paper and weren't added again.
          </div>
        )}

        {warnings.map(warning => (
          <DuplicateWarning
            key={warning.id}
            warning={warning}
          />
        ))}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <HierarchyPicker
            selectedUniversity={selectedUniversity} setSelectedUniversity={setSelectedUniversity}
            selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
          />

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Auto-Fill from Filename (Optional)</h3>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Source Document Name
                {isParsingFilename && <InfinitySquareSnake className="text-[#FF9FFC] text-sm [--duration:2s]" />}
              </label>
              <input
                type="text"
                placeholder="e.g. CS201_Sem5_2023_Midterm.pdf"
                value={filenameInput}
                onChange={(e) => setFilenameInput(e.target.value)}
                onBlur={handleFilenameBlur}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC] disabled:opacity-60"
                disabled={isParsingFilename}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Paste your file's name here and click away to automatically fill the details below.</p>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4 mt-6">Paper Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
                <input type="number" placeholder="e.g. 5" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <input type="number" placeholder="e.g. 2023" value={year} onChange={(e) => setYear(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam Type</label>
                <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC]">
                  <option value="">-- Select --</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white border-b dark:border-gray-700 pb-2 mb-4">Paste Questions</h3>
            <textarea
              rows="8"
              placeholder="Paste your exam text here... (e.g. '1. What is React? \n 2. Explain hooks.')"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded p-3 font-mono text-sm focus:ring-[#FF9FFC] focus:border-[#FF9FFC]"
            />
          </div>

          {splits.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800 pb-2 mb-4">
                Live Preview: {splits.length} Question{splits.length !== 1 && 's'} Detected
              </h3>
              <div className="space-y-3">
                {splits.map((q, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border border-blue-100 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 shadow-sm whitespace-pre-wrap">
                    <span className="font-bold text-blue-600 dark:text-[#FF9FFC] mr-2">Q{index + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            {isLoading ? (
              <Spinner text="Processing and vectorizing questions..." />
            ) : (
              <button
                type="submit"
                className="w-full bg-[#FF9FFC] text-gray-900 font-bold py-3 px-4 rounded-lg hover:opacity-90 transition shadow-sm"
              >
                Upload and Process Text
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}