import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import HierarchyPicker from '../components/HierarchyPicker';

export default function Dashboard() {
  const { logout } = useContext(AuthContext);

  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

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
          Welcome to the VIP area! Let's test the hierarchy picker below.
        </p>

        {/* The Reusable Hierarchy Picker */}
        <HierarchyPicker
          selectedUniversity={selectedUniversity}
          setSelectedUniversity={setSelectedUniversity}
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      </div>
    </div>
  );
}