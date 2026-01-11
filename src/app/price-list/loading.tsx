export default function PriceListLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="text-center mb-8">
          <div className="mx-auto h-24 w-24 bg-gray-200 rounded-lg animate-pulse mb-4" />
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
        
        {/* Controls Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* Table Skeletons */}
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-12 bg-amber-300 animate-pulse" />
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}