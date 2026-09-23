import { useState } from 'react';
import { Link } from 'react-router-dom';
import HierarchyPicker from '../components/HierarchyPicker';
import { parseFilename } from '../utils/filenameParser';
import DuplicateWarning from '../components/DuplicateWarning';
import Spinner from '../components/Spinner';

export default function UploadImage() {
  const [warnings, setWarnings] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [examType, setExamType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setOcrText(''); setConfidence(null); setError(''); setSuccessData(null);
    setWarnings([]); setSkipped([]);

    const { guesses, confidence } = parseFilename(selectedFile.name);

    if (confidence >= 50) {
      if (guesses.semester) setSemester(guesses.semester);
      if (guesses.year) setYear(guesses.year);
      if (guesses.examType) setExamType(guesses.examType);
    } else {
      try {
        const token = sessionStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/parse-filename`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filename: selectedFile.name })
        });

        const data = await res.json();
        if (data.hints) {
          if (data.hints.semester && !semester) setSemester(data.hints.semester);
          if (data.hints.year && !year) setYear(data.hints.year);
          if (data.hints.examType && !examType) setExamType(data.hints.examType);
        }
      } catch (err) {
        console.warn('LLM Fallback skipped:', err.message);
      }
    }
  };

  const handleExtractText = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract text');

      setOcrText(data.extractedText);
      setConfidence(data.confidence);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return setError('Please select a subject.');
    if (!ocrText.trim()) return setError('OCR text cannot be empty.');

    setIsUploading(true);
    setError('');
    setWarnings([]);
    setSkipped([]);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('text', ocrText);
    formData.append('subject_id', selectedSubject);
    if (semester) formData.append('semester', semester);
    if (year) formData.append('year', year);
    if (examType) formData.append('exam_type', examType);

    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/image/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      setSuccessData(data);
      setOcrText('');

      // New Inline Data Handling
      setSkipped(data.skipped || []);
      const newWarnings = (data.questions || []).filter(q => q.totalMatches > 0);
      setWarnings(newWarnings);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">Upload Image</h1>
          <Link to="/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}
        
        {successData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
            <strong>Success!</strong> {successData.message}
            {successData.image_url && (
              <div className="mt-2">
                <a href={successData.image_url} target="_blank" rel="noreferrer" className="underline font-bold text-green-900">
                  View uploaded image on Cloudinary
                </a>
              </div>
            )}
          </div>
        )}

        {skipped.length > 0 && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded text-gray-700">
            <strong>ℹ️ Skipped {skipped.length} question(s)</strong> that already existed in this exact paper and weren't added again.
          </div>
        )}

        {warnings.map(warning => (
          <DuplicateWarning
            key={warning.id}
            warning={warning}
          />
        ))}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded border border-gray-200 border-dashed text-center">
              <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {previewUrl && <img src={previewUrl} alt="Preview" className="mt-4 max-h-64 mx-auto rounded shadow-sm" />}
              {file && !ocrText && (
                <button onClick={handleExtractText} disabled={isExtracting} className="mt-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:bg-gray-400">
                  {isExtracting ? 'Scanning Image...' : 'Extract Text (OCR)'}
                </button>
              )}
            </div>

            {ocrText && (
              <HierarchyPicker
                selectedUniversity={selectedUniversity} setSelectedUniversity={setSelectedUniversity}
                selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
              />
            )}
          </div>

          {ocrText && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-blue-900">Review & Edit OCR Text</h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded ${confidence > 80 ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {confidence}% Match
                  </span>
                </div>
                <textarea rows="10" value={ocrText} onChange={(e) => setOcrText(e.target.value)} className="w-full border p-3 rounded font-mono text-sm focus:ring-blue-500" />
                <p className="text-xs text-blue-600 mt-2">Fix any typos from the scan. Ensure multi-part questions are numbered correctly (e.g. 1., 2.) so the auto-splitter works.</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input type="number" placeholder="Sem" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Type</option><option value="Midterm">Midterm</option><option value="Final">Final</option>
                </select>
              </div>
              <div className="mt-8">
                {isUploading ? (
                  <Spinner text="Vectorizing and verifying questions..." />
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition shadow-sm"
                  >
                    Confirm and Upload
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}