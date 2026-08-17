import { useState } from 'react';
import { Link } from 'react-router-dom';
import HierarchyPicker from '../components/HierarchyPicker';

export default function UploadImage() {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setOcrText('');
    setConfidence(null);
    setError('');
    setSuccessData(null);
  };

  const handleExtractText = async () => {
    if (!file) return;
    setIsExtracting(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/questions/image', {
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

    const formData = new FormData();
    formData.append('image', file);
    formData.append('text', ocrText);
    formData.append('subject_id', selectedSubject);
    if (semester) formData.append('semester', semester);
    if (year) formData.append('year', year);
    if (examType) formData.append('exam_type', examType);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/questions/image/confirm', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      setSuccessData(data);
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
          <Link to="/dashboard" className="text-blue-600 hover:underline">← Dashboard</Link>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}
        {successData && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
            <strong>Success!</strong> {successData.message}
            <div className="mt-2"><a href={successData.image_url} target="_blank" rel="noreferrer" className="underline font-bold text-green-900">View uploaded image on Cloudinary</a></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded border border-gray-200 border-dashed text-center">
              <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
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
            <div className="space-y-6">
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
                <input type="number" placeholder="Sem" value={semester} onChange={(e)=>setSemester(e.target.value)} className="border p-2 rounded text-sm"/>
                <input type="number" placeholder="Year" value={year} onChange={(e)=>setYear(e.target.value)} className="border p-2 rounded text-sm"/>
                <select value={examType} onChange={(e)=>setExamType(e.target.value)} className="border p-2 rounded text-sm">
                  <option value="">Type</option><option value="Midterm">Midterm</option><option value="Final">Final</option>
                </select>
              </div>

              <button onClick={handleSubmit} disabled={isUploading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400">
                {isUploading ? 'Uploading to Cloudinary...' : 'Confirm & Save'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}