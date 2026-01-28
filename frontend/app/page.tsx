export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Skills Store
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Discover and Purchase AI Skills
          </p>
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search skills..."
              className="w-full px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </main>
  )
}
