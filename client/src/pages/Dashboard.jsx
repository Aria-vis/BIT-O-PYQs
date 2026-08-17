import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-600 transition"
          >
            Log Out
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Welcome to the VIP area! Choose an action below to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link to="/upload-text" className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition text-center hover:border-blue-300">
            <div className="text-4xl mb-3">📄</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Text</h2>
            <p className="text-sm text-gray-600">Paste raw exam text and let our parser auto-split it.</p>
          </Link>

          <Link to="/upload-image" className="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition text-center hover:border-blue-300">
            <div className="text-4xl mb-3">📸</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Image</h2>
            <p className="text-sm text-gray-600">Snap a photo and let our AI read the text.</p>
          </Link>

          <div className="block bg-gray-50 p-6 rounded-xl border border-gray-200 text-center opacity-60">
            <div className="text-4xl mb-3">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Search PYQs</h2>
            <p className="text-sm text-gray-600">Coming later in the roadmap.</p>
          </div>
        </div>
      </div>
    </div>
  );
}