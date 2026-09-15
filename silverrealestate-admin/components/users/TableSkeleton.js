"use client";

export default function TableSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left min-w-[800px]">
        <thead className="border-b border-gray-100 bg-gray-50/50">
          <tr>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            </th>
            <th className="px-4 md:px-6 py-3.5">
              <div className="h-3 w-12 bg-gray-200 rounded animate-pulse ml-auto" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-gray-50">
              <td className="px-4 md:px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-6 w-10 bg-gray-200 rounded-md animate-pulse mx-auto" />
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-6 w-10 bg-gray-200 rounded-md animate-pulse mx-auto" />
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </td>
              <td className="px-4 md:px-6 py-4">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
