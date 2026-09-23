export default function DuplicateWarning({ warning }) {
  if (!warning || !warning.totalMatches || warning.totalMatches === 0) return null;

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-2 rounded shadow-sm">
      <div className="flex items-center mb-2">
        <span className="text-xl mr-2">ℹ️</span>
        <h3 className="text-blue-800 font-bold text-sm">
          Found {warning.totalMatches} similar question{warning.totalMatches > 1 ? 's' : ''} in other papers
        </h3>
      </div>
      <div className="mt-2 space-y-2">
        {warning.topMatches?.map((match, idx) => (
          <div key={idx} className="bg-blue-100 p-2 rounded text-xs text-blue-800">
            <span className="font-bold text-blue-600 mr-2">
              {Math.round(match.similarity * 100)}% Match:
            </span> 
            {match.text}
          </div>
        ))}
      </div>
    </div>
  );
}