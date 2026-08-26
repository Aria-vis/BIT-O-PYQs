export default function EmptyState({ title, message }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
      <div className="text-6xl mb-4 opacity-50">📭</div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm">{message}</p>
    </div>
  );
}