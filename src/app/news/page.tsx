'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import TickerTape from '@/components/TickerTape';

interface NewsArticle {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getPaginationPages(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | '...')[] = [];
  // Always show first 5
  for (let i = 1; i <= 5; i++) pages.push(i);
  // Ellipsis if needed
  if (currentPage > 6 && currentPage < totalPages - 1) {
    pages.push('...');
    pages.push(currentPage - 1);
    pages.push(currentPage);
    pages.push(currentPage + 1);
    pages.push('...');
  } else if (totalPages > 7) {
    pages.push('...');
  }
  // Always show last page
  if (!pages.includes(totalPages)) pages.push(totalPages);
  return pages;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'crypto' | 'bitcoin' | 'ethereum' | 'defi'>('crypto');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  const categories = [
    { key: 'crypto', label: 'All Crypto' },
    { key: 'bitcoin', label: 'Bitcoin' },
    { key: 'ethereum', label: 'Ethereum' },
    { key: 'defi', label: 'DeFi' },
  ] as const;

  const fetchNews = useCallback(async (cat: string, page: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/news?q=${cat}&page=${page}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setArticles(data.articles || []);
      setTotalPages(data.totalPages || 1);
      setTotalArticles(data.totalArticles || 0);
      setCurrentPage(data.currentPage || page);
    } catch (e: any) {
      setError(e.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchNews(category, 1);
  }, [category, fetchNews]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    fetchNews(category, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginationPages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <TickerTape />

      <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Crypto News</h1>
          <p className="text-slate-400 text-sm">Latest cryptocurrency and blockchain news, updated automatically</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                category === cat.key
                  ? 'bg-blue-600 text-white' :'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/10" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {!loading && !error && articles.length > 0 && (
          <>
            {/* Article count info */}
            <div className="mb-4 text-slate-400 text-sm">
              Showing page {currentPage} of {totalPages} &mdash; {totalArticles} unique articles
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, idx) => (
                <a
                  key={`${article.url}-${idx}`}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/40 hover:bg-white/8 transition-all duration-200 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-white/5 overflow-hidden flex-shrink-0">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {/* Source badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-black/70 backdrop-blur-sm text-xs text-slate-300 px-2 py-1 rounded-full">
                        {article.source.name}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-3 group-hover:text-blue-300 transition-colors">
                      {article.title}
                    </h3>
                    {article.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 flex-1">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/10">
                      <span className="text-xs text-slate-500">{timeAgo(article.publishedAt)}</span>
                      <span className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                        Read more
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1 flex-wrap">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ‹ Prev
                </button>

                {/* Page numbers */}
                {paginationPages.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-2 text-slate-500 text-sm select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p as number)}
                      className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        currentPage === p
                          ? 'bg-blue-600 border-blue-500 text-white' :'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty */}
        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-400">No articles found for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
