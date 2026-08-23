export default function DuplicateWarning({ warning, onKeep, onDelete }) {
  const match = warning.matches[0]; 
  const percentage = (match.similarity * 100).toFixed(1);

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-sm mb-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-yellow-800">⚠️ Possible Duplicate Detected!</h3>
        <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
          {percentage}% Match
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 border border-gray-200 rounded">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">You Just Uploaded:</span>
          <p className="mt-2 text-sm text-gray-800">{warning.uploaded.clean_text}</p>
        </div>
        <div className="bg-white p-4 border border-yellow-300 rounded shadow-inner">
          <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Already in Database:</span>
          <p className="mt-2 text-sm text-gray-800">{match.clean_text}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button 
          onClick={() => onDelete(warning.uploaded.id)} 
          className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 font-bold rounded transition"
        >
          Delete Mine (Keep DB Clean)
        </button>
        <button 
          onClick={() => onKeep(warning.uploaded.id)} 
          className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 font-bold rounded transition"
        >
          Keep Both (False Alarm)
        </button>
      </div>
    </div>
  );
}