"use client";

import { Icon } from "@iconify/react";

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  entityName = "items",
}) {
  if (!pagination) return null;

  const page = Number(pagination.page) || 1;
  const totalPages = Math.max(1, Number(pagination.totalPages) || 1);
  const total = pagination.total !== undefined ? Number(pagination.total) : 0;
  const limit = Number(pagination.limit) || 20;
  const hasNext = pagination.hasNext !== undefined ? Boolean(pagination.hasNext) : page < totalPages;
  const hasPrev = pagination.hasPrev !== undefined ? Boolean(pagination.hasPrev) : page > 1;

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  const getFormattedLabel = () => {
    if (total === 1) {
      if (entityName === "properties") return "Total: 1 property";
      if (entityName === "users") return "Total: 1 user";
      if (entityName === "investments") return "Total: 1 investment";
      return `Total: 1 ${entityName}`;
    }
    return `Total: ${total} ${entityName}`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-3 sm:px-6 border-t border-gray-100 gap-2.5 sm:gap-4 shrink-0 bg-white">
      <div className="flex items-center justify-between sm:justify-start gap-3 text-xs sm:text-sm text-gray-500 w-full sm:w-auto">
        <span className="font-medium">{getFormattedLabel()}</span>
        <div className="flex items-center gap-1.5">
          <label htmlFor="limit" className="text-gray-500 whitespace-nowrap">Rows per page:</label>
          <select
            id="limit"
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="border-gray-200 border rounded-lg px-2 py-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs sm:text-sm bg-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1 justify-center sm:justify-end w-full sm:w-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
          aria-label="Previous page"
        >
          <Icon icon="lucide:chevron-left" width="16" height="16" />
        </button>

        {getPageNumbers().map((num, idx) => (
          <button
            key={idx}
            onClick={() => num !== "..." && onPageChange(num)}
            disabled={num === "..."}
            className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              num === page
                ? "bg-primary text-white shadow-2xs"
                : num === "..."
                ? "text-gray-400 cursor-default"
                : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext}
          className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600"
          aria-label="Next page"
        >
          <Icon icon="lucide:chevron-right" width="16" height="16" />
        </button>
      </div>
    </div>
  );
}
