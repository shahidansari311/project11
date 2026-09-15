"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import UserTable from "./UserTable";
import TableSkeleton from "./TableSkeleton";
import Pagination from "./Pagination";
import UserModal from "./UserModal";
import DeleteModal from "./DeleteModal";

function PaginationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-4 md:px-6 border-t border-gray-100 gap-4">
      <div className="flex items-center gap-4">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-7 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-9 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <div>
        <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse mt-2" />
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-3 md:p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="h-[42px] flex-1 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-[42px] w-[110px] bg-gray-200 rounded-xl animate-pulse shrink-0" />
        </div>
        <TableSkeleton rows={5} />
        <PaginationSkeleton />
      </div>
    </div>
  );
}

function UsersViewContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read initial values from URL
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [limit, setLimit] = useState(Number(searchParams.get("limit")) || 10);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("search") || "");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Sync URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch.trim()) {
      params.set("search", debouncedSearch.trim());
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [page, limit, debouncedSearch, pathname, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/admin/users?page=${page}&limit=${limit}`;
      if (debouncedSearch.trim()) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else {
        toast.error(res?.message || "Failed to fetch users");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while fetching users");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const openAddModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleView = (user) => {
    router.push(`/users/${user.id}`);
  };

  return (
    <div className="flex flex-col gap-5 w-full h-[calc(100vh-120px)] min-h-[500px]">
     
      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-0 flex-1">
        <div className="p-3 md:p-5 border-b border-gray-100 flex justify-between items-center gap-3">
          <div className="relative flex-1 min-w-0 lg:max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon icon="lucide:search" className="text-gray-400" width="18" height="18" />
            </div>
            <input
              type="text"
              placeholder="Search by name and email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-white"
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
          <button
            onClick={openAddModal}
            className="bg-primary text-white hover:bg-primary/90 h-[42px] px-4 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Icon icon="lucide:plus" width="18" height="18" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={limit > 10 ? 8 : 5} />
          ) : (
            <UserTable
              users={users}
              onView={handleView}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          )}
        </div>

        {/* Pagination */}
        {isLoading ? (
          <PaginationSkeleton />
        ) : (
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            onLimitChange={handleLimitChange}
            entityName="users"
          />
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={selectedUser}
        onSuccess={fetchUsers}
      />
    </div>
  );
}

export default function UsersView() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsersViewContent />
    </Suspense>
  );
}
