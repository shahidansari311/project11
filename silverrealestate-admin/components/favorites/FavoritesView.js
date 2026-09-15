"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import FavoritedUsersDrawer from "./FavoritedUsersDrawer";
import Pagination from "../users/Pagination";
import { formatLocation } from "../../lib/locationUtils";

function FavoritesSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs animate-pulse flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <div className="h-3.5 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>
            <div className="w-11 h-11 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Main Table Card Skeleton */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="h-10 w-full max-w-sm bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FavoritesView() {
  const router = useRouter();
  const [stats, setStats] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Drawer state
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Load showStats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("favorites_show_stats");
    if (saved !== null) {
      setShowStats(saved === "true");
    }
  }, []);

  const handleToggleStats = () => {
    setShowStats((prev) => {
      const next = !prev;
      localStorage.setItem("favorites_show_stats", String(next));
      return next;
    });
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/favorites/stats?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success && res.data) {
        const statsList = Array.isArray(res.data.stats)
          ? res.data.stats
          : Array.isArray(res.data)
          ? res.data
          : [];
        setStats(statsList);
        setPagination(res.data.pagination || null);
      } else {
        setStats([]);
        setPagination(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch favorite stats");
      setStats([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Compute summary metrics
  const totalFavoritedProperties = pagination?.total ?? stats.length;
  const totalFavoritesCount = useMemo(() => {
    return stats.reduce((acc, curr) => acc + (Number(curr.favoritesCount) || 0), 0);
  }, [stats]);

  const topProperty = stats[0] || null;
  const filteredStats = stats;

  const handleOpenDrawer = (property) => {
    setSelectedProperty(property);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProperty(null);
  };

  const handleFavoriteCountChange = (propertyId, delta) => {
    setStats((prev) =>
      prev
        .map((p) => {
          if (p.propertyId === propertyId) {
            const newCount = Math.max(0, (p.favoritesCount || 0) + delta);
            return { ...p, favoritesCount: newCount };
          }
          return p;
        })
        .filter((p) => p.favoritesCount > 0)
    );
  };

  const getRankBadge = (index) => {
    const rank = (page - 1) * limit + index + 1;
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200 shrink-0 shadow-2xs">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-300 shrink-0 shadow-2xs">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-amber-700/10 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-700/20 shrink-0 shadow-2xs">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-gray-50 text-gray-500 font-medium text-xs flex items-center justify-center border border-gray-200 shrink-0">
        {rank}
      </span>
    );
  };

  if (isLoading && stats.length === 0) {
    return <FavoritesSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
      {/* Metric Highlights Cards */}
      {showStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Bookmarks */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Total Favorites</span>
              <div className="text-2xl font-bold text-gray-900">{totalFavoritesCount}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Across listed properties</span>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 border border-rose-100 shrink-0">
              <Icon icon="lucide:heart" width="22" height="22" className="fill-rose-500" />
            </div>
          </div>

          {/* Total Favorited Properties */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 block mb-1">Favorited Properties</span>
              <div className="text-2xl font-bold text-gray-900">{totalFavoritedProperties}</div>
              <span className="text-[11px] text-gray-400 mt-0.5 block">Total ranked properties</span>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <Icon icon="lucide:building-2" width="22" height="22" />
            </div>
          </div>

          {/* Most Popular */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <span className="text-xs font-semibold text-gray-500 block mb-1">Most Popular</span>
              <div className="text-base font-bold text-gray-900 truncate" title={topProperty?.title || "None"}>
                {topProperty?.title || "N/A"}
              </div>
              <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block truncate">
                {topProperty ? `${topProperty.favoritesCount} Favorites (${formatLocation(topProperty.location) || "Top Rank"})` : "No favorites yet"}
              </span>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shrink-0">
              <Icon icon="lucide:flame" width="22" height="22" />
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        {/* Toolbar */}
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0 lg:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon icon="lucide:search" className="text-gray-400" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search by title or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs sm:text-sm bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="lucide:x" width="16" height="16" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStats}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                showStats
                  ? "bg-gray-50 text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 shadow-2xs"
                  : "bg-primary text-white hover:bg-primary/90 shadow-2xs"
              }`}
              title={showStats ? "Hide summary stats cards to maximize table space" : "Show summary stats cards"}
            >
              <Icon
                icon={showStats ? "lucide:eye-off" : "lucide:bar-chart-2"}
                width="14"
                height="14"
                className={showStats ? "text-gray-500" : "text-white"}
              />
              <span className="whitespace-nowrap">{showStats ? "Hide Stats" : "Show Stats"}</span>
            </button>

            <button
              type="button"
              onClick={fetchStats}
              title="Refresh list"
              className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Icon icon="lucide:refresh-cw" width="16" height="16" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-auto h-full flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shadow-2xs">
              <tr className="bg-gray-50">
                <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 w-16 text-center">Rank</th>
                <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50">Property</th>
                <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-center">Total Favorites</th>
                <th className="px-4 md:px-6 py-3.5 type-label text-gray-600 font-semibold bg-gray-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: limit > 10 ? 8 : 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="w-7 h-7 bg-gray-200 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="space-y-1.5 max-w-md">
                        <div className="h-4 w-48 bg-gray-200 rounded" />
                        <div className="h-3 w-32 bg-gray-100 rounded" />
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="h-6 w-16 bg-gray-200 rounded-full mx-auto" />
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-7 w-24 bg-gray-200 rounded-lg" />
                        <div className="h-7 w-7 bg-gray-100 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 px-4 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-400">
                        <Icon icon="lucide:heart-off" width="32" height="32" />
                      </div>
                      <h3 className="type-h5 text-gray-900 font-semibold mb-1">No Favorited Properties</h3>
                      <p className="type-body-sm text-gray-500 max-w-sm mx-auto">
                        {debouncedSearch
                          ? `No properties matched "${debouncedSearch}". Try a different search term.`
                          : "Properties added to user favorites will appear here automatically."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStats.map((item, index) => (
                  <tr
                    key={item.propertyId || index}
                    onClick={() => handleOpenDrawer(item)}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    {/* Rank Badge */}
                    <td className="px-4 md:px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(index)}
                      </div>
                    </td>

                    {/* Property Details */}
                    <td className="px-4 md:px-6 py-4">
                      <div className="min-w-0">
                        <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors type-body-sm block truncate max-w-md">
                          {item.title || "Untitled Property"}
                        </span>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate max-w-md">
                          <Icon icon="lucide:map-pin" className="shrink-0 text-gray-400" width="13" height="13" />
                          <span className="truncate">{formatLocation(item.location)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Favorites Count Pill */}
                    <td className="px-4 md:px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs">
                        <Icon icon="lucide:heart" width="13" height="13" className="fill-rose-500 text-rose-500" />
                        <span>{item.favoritesCount || 0}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 md:px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDrawer(item)}
                          className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Icon icon="lucide:users" width="14" height="14" />
                          <span>View Users</span>
                        </button>
                        <Link
                          href={`/property/${item.propertyId}`}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                          title="View property details"
                        >
                          <Icon icon="lucide:external-link" width="16" height="16" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
          />
        )}
      </div>

      {/* Slide-over Drawer for Viewing Favorited Users */}
      <FavoritedUsersDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        property={selectedProperty}
        onFavoriteCountChange={handleFavoriteCountChange}
      />
    </div>
  );
}
