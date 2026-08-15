import { useState } from 'react';
import { Link } from 'react-router-dom';
import HierarchyPicker from '../components/HierarchyPicker';

export default function UploadText() {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [rawText, setRawText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const cleanText = (text) => text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const previewSplits = () => {
    if (!rawText.trim()) return [];
    const splitRegex = /(?=(?:^|\n)\s*(?:Q\.?\s*\d+|\d+)[.)]\s)/gi;
    return cleanText(rawText).split(splitRegex).map(q => cleanText(q)).filter(q => q.length > 0);
  };
  const splits = previewSplits();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessData(null);

    if (!selectedSubject) return setError('Please select a subject from the academic hierarchy.');
    if (!rawText.trim()) return setError('Please paste some question text.');

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/questions/text', {
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
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">Upload Raw Text</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline font-medium">← Back to Dashboard</Link>
        </div>

        {successData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            <strong>Success!</strong> {successData.message}
            <div className="mt-2 text-sm text-green-700">
              (In the future, a link to view these saved questions will go right here.)
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <HierarchyPicker 
            selectedUniversity={selectedUniversity} setSelectedUniversity={setSelectedUniversity}
            selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
            selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
          />

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Paper Details (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <input type="number" placeholder="e.g. 5" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" placeholder="e.g. 2023" value={year} onChange={(e) => setYear(e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full border rounded p-2">
                  <option value="">-- Select --</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Paste Questions</h3>
            <textarea 
              rows="8" 
              placeholder="Paste your exam text here... (e.g. '1. What is React? \n 2. Explain hooks.')"
              value={rawText} 
              onChange={(e) => setRawText(e.target.value)} 
              className="w-full border border-gray-300 rounded p-3 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {splits.length > 0 && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-4">
                Live Preview: {splits.length} Question{splits.length !== 1 && 's'} Detected
              </h3>
              <div className="space-y-3">
                {splits.map((q, index) => (
                  <div key={index} className="bg-white p-3 rounded border border-blue-100 text-sm text-gray-800 shadow-sm whitespace-pre-wrap">
                    <span className="font-bold text-blue-600 mr-2">Q{index + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 text-lg transition shadow-md"
          >
            {isLoading ? 'Processing & Saving...' : 'Upload Questions'}
          </button>
        </form>
      </div>
    </div>
  );
}