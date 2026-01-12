// Loading skeleton for Report Sale Page
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 h-24"
            >
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-28" />
            </div>
          ))}
        </div>

        {/* Search Skeleton */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 max-w-md h-11 bg-gray-200 rounded-lg" />
          <div className="w-32 h-11 bg-gray-200 rounded-lg" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="h-12 bg-gray-100 border-b border-gray-200" />

          {/* Rows */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-14 border-b border-gray-100 flex items-center px-4 gap-4"
            >
              <div className="w-8 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="flex-1 h-4 bg-gray-200 rounded max-w-[200px]" />
              <div className="w-24 h-4 bg-gray-200 rounded hidden lg:block" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded hidden md:block" />
              <div className="w-20 h-4 bg-gray-200 rounded hidden md:block" />
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="mt-4 bg-white rounded-lg border border-gray-200 h-14" />
      </div>
    </div>
  );
}