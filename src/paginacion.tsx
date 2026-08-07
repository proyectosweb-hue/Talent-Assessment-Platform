import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar páginas visibles (máx 5)
  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };
  return <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-gray-500">
        Mostrando <span className="font-semibold text-gray-700">{from}–{to}</span> de <span className="font-semibold text-gray-700">{totalItems}</span> registros
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {getPages().map((page, i) => page === '...' ? <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span> : <button key={page} onClick={() => onPageChange(page as number)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              {page}
            </button>)}

        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>;
}