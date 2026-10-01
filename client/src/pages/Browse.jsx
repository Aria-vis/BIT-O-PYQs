import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import HierarchyPicker from '../components/HierarchyPicker';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { AuthContext } from '../context/AuthContext';

export default function Browse() {
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');

  const [questions, setQuestions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useContext(AuthContext);
  const [expandedId, setExpandedId] = useState(null);
  const [historyById, setHistoryById] = useState({});

  const toggleHistory = async (questionId) => {
    if (expandedId === questionId) { setExpandedId(null); return; }
    setExpandedId(questionId);
    if (!historyById[questionId]) {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/${questionId}/duplicates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setHistoryById(prev => ({ ...prev, [questionId]: data.matches || [] }));
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Delete this question permanently?')) return;
    const token = sessionStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 10 });
        if (selectedUniversity) params.append('university_id', selectedUniversity);
        if (selectedCourse) params.append('course_id', selectedCourse);
        if (selectedSubject) params.append('subject_id', selectedSubject);
        if (year) params.append('year', year);
        if (search) params.append('search', search);

        const token = sessionStorage.getItem('token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/questions?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();
        setQuestions(data.questions || []);
        setTotalPages(data.totalPages || 1);
        setTotalQuestions(data.totalQuestions || 0);
      } catch (err) {
        console.error('Failed to fetch questions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => fetchQuestions(), 300);
    return () => clearTimeout(timeoutId);
  }, [selectedUniversity, selectedCourse, selectedSubject, year, search, page]);

  useEffect(() => {
    setPage(1);
  }, [selectedUniversity, selectedCourse, selectedSubject, year, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm transition-colors duration-300">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Browse Questions</h1>
          <Link to="/dashboard" className="text-[#FF9FFC] hover:underline font-medium">← Dashboard</Link>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by keyword (e.g., 'Linked Lists')..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-3">
              <HierarchyPicker
                selectedUniversity={selectedUniversity} setSelectedUniversity={setSelectedUniversity}
                selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input
                type="number"
                placeholder="e.g. 2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF9FFC]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 border-b dark:border-gray-700 pb-2">
            Results ({totalQuestions} found)
          </h2>

          {isLoading ? (
            <Spinner text="Searching question bank..." />
          ) : questions.length === 0 ? (
            <EmptyState
              title="No questions found"
              message="Try adjusting your filters or search for a different keyword."
            />
          ) : (
            <div className="space-y-6">
              {questions.map((q) => (
                <div key={q.id} className="border border-gray-100 dark:border-gray-700 p-5 rounded-lg shadow-sm hover:shadow-md transition bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-blue-100 dark:bg-[#FF9FFC]/20 text-blue-800 dark:text-[#FF9FFC] text-xs font-bold px-2 py-1 rounded">
                      {q.subject_name}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {q.exam_type || 'Exam'} • {q.semester ? `Sem ${q.semester}` : ''} {q.year}
                    </span>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium">{q.clean_text}</p>

                  {q.image_url && (
                    <div className="mt-4">
                      <a href={q.image_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 dark:text-[#FF9FFC] hover:underline flex items-center">
                        📷 View Original Source Image
                      </a>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <button onClick={() => toggleHistory(q.id)} className="text-blue-600 dark:text-[#FF9FFC] hover:underline font-medium">
                      {expandedId === q.id ? 'Hide match history' : 'View match history'}
                    </button>
                    {user?.id === q.uploader_id && (
                      <button onClick={() => handleDelete(q.id)} className="text-red-600 dark:text-red-400 hover:underline font-medium">
                        Delete
                      </button>
                    )}
                  </div>

                  {expandedId === q.id && (
                    <div className="mt-2 space-y-2">
                      {(historyById[q.id] || []).length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No other matching questions found.</p>
                      ) : (
                        historyById[q.id].map(match => (
                          <div key={match.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2 text-xs">
                            <span className="font-bold text-gray-600 dark:text-gray-400">{(match.similarity * 100).toFixed(1)}% match:</span> <span className="dark:text-gray-300">{match.clean_text}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 pt-4 border-t dark:border-gray-700">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}