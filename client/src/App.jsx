import { useQuery } from '@tanstack/react-query'

function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['healthCheck'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/health')
      if (!res.ok) throw new Error('Network response was not ok')
      return res.json()
    },
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="mb-4 text-4xl font-bold text-blue-600">BIT'O PYQs</h1>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-2">Backend Connection Status:</h2>
        {isLoading && <p className="text-yellow-600">Connecting to server...</p>}
        {error && <p className="text-red-600">Error: {error.message}</p>}
        {data && (
          <p className="text-green-600 font-medium">
            ✅ {data.message}
          </p>
        )}
      </div>
    </div>
  )
}

export default App