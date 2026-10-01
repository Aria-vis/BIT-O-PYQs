import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
          Welcome back, <span className="font-semibold text-gray-800 dark:text-white">{user?.name || user?.email || 'User'}</span>!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/upload-text" className="block bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition text-center hover:border-[#FF9FFC]">
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Upload Text</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Paste raw exam text and let our parser auto-split it.</p>
          </Link>

          <Link to="/upload-image" className="block bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition text-center hover:border-[#FF9FFC]">
            <div className="text-4xl mb-3">📸</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Upload Documents</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Snap a photo and let our AI read the text.</p>
          </Link>

          <Link to="/browse" className="block bg-white dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition text-center hover:border-[#FF9FFC]">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Search PYQs</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Browse and filter the question bank.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}