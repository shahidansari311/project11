"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { formatLocation } from "../../lib/locationUtils";

function UserAvatar({ user }) {
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = user?.profileImage || user?.profileUrl || user?.image || user?.avatar;

  if (imgUrl && !imgFailed) {
    return (
      <img
        src={imgUrl}
        alt={user?.fullName || "User"}
        onError={() => setImgFailed(true)}
        className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
    </div>
  );
}

export default function FavoritedUsersDrawer({
  isOpen,
  onClose,
  property,
  onFavoriteCountChange,
}) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMoreFavoritedUsers, setIsLoadingMoreFavoritedUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersHasNext, setUsersHasNext] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(null);

  // Add User State with Scroll-based Pagination (20 items per page)
  const [showAddUser, setShowAddUser] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchHasNext, setSearchHasNext] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  const searchInputRef = useRef(null);

  // Fetch Favorited Users with 20 items per page & scroll pagination
  const fetchFavoritedUsers = useCallback(async (propertyId, pageNum = 1, append = false) => {
    if (append) {
      setIsLoadingMoreFavoritedUsers(true);
    } else {
      setIsLoading(true);
    }
    try {
      const res = await api.get(`/admin/favorites/property/${propertyId}?page=${pageNum}&limit=20`);
      if (res?.success && res.data) {
        const userList = Array.isArray(res.data.users)
          ? res.data.users
          : Array.isArray(res.data)
          ? res.data
          : [];
        setUsers((prev) => (append ? [...prev, ...userList] : userList));
        const pagination = res.data.pagination;
        const hasMore = pagination ? Boolean(pagination.hasNext || pagination.page < pagination.totalPages) : false;
        setUsersHasNext(hasMore);
        setUsersPage(pageNum);
      } else {
        if (!append) setUsers([]);
        setUsersHasNext(false);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch users who favorited this property");
      if (!append) setUsers([]);
      setUsersHasNext(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMoreFavoritedUsers(false);
    }
  }, []);

  const propId = property?.propertyId || property?.id;

  useEffect(() => {
    if (isOpen && propId) {
      setIsLoading(true);
      setUsersPage(1);
      setUsersHasNext(false);
      fetchFavoritedUsers(propId, 1, false);
      setShowAddUser(false);
      setUserSearch("");
      setSearchResults([]);
      setSearchPage(1);
      setSearchHasNext(false);
    } else {
      setUsers([]);
      setIsLoading(false);
      setShowAddUser(false);
    }
  }, [isOpen, propId, fetchFavoritedUsers]);

  // Handle scroll on main drawer body for infinite pagination
  const handleDrawerBodyScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (usersHasNext && !isLoading && !isLoadingMoreFavoritedUsers && propId) {
        fetchFavoritedUsers(propId, usersPage + 1, true);
      }
    }
  };

  // Search users API with 20 items per page & pagination support
  const fetchUsersPage = async (query, pageNum, append = false) => {
    if (append) {
      setIsLoadingMoreUsers(true);
    } else {
      setIsSearchingUsers(true);
    }

    try {
      let url = `/admin/users?page=${pageNum}&limit=20`;
      if (query && query.trim()) {
        url += `&search=${encodeURIComponent(query.trim())}`;
      }
      const res = await api.get(url);
      if (res?.success && res.data?.users) {
        const fetchedUsers = res.data.users;
        setSearchResults((prev) => (append ? [...prev, ...fetchedUsers] : fetchedUsers));
        const pagination = res.data.pagination;
        const hasMore = pagination ? Boolean(pagination.hasNext || pagination.page < pagination.totalPages) : false;
        setSearchHasNext(hasMore);
        setSearchPage(pageNum);
      } else {
        if (!append) setSearchResults([]);
        setSearchHasNext(false);
      }
    } catch (error) {
      if (!append) setSearchResults([]);
      setSearchHasNext(false);
    } finally {
      setIsSearchingUsers(false);
      setIsLoadingMoreUsers(false);
    }
  };

  // Focus input when Add User is opened & load page 1
  useEffect(() => {
    if (showAddUser) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      setSearchPage(1);
      fetchUsersPage("", 1, false);
    }
  }, [showAddUser]);

  // Debounced search reset to page 1
  useEffect(() => {
    if (!showAddUser) return;
    const timer = setTimeout(() => {
      setSearchPage(1);
      fetchUsersPage(userSearch, 1, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, showAddUser]);

  // Scroll handler for search results infinite scroll
  const handleScrollResults = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      if (searchHasNext && !isSearchingUsers && !isLoadingMoreUsers) {
        fetchUsersPage(userSearch, searchPage + 1, true);
      }
    }
  };

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleAddFavorite = async (user) => {
    if (!property?.propertyId || !user?.id) return;
    setAddingUserId(user.id);
    try {
      const res = await api.post(
        `/admin/favorites/user/${user.id}/property/${property.propertyId}`
      );
      if (res?.success) {
        toast.success(res.message || "Property added to user's favorites");
        // Add to local users list if not present
        setUsers((prev) => {
          if (prev.some((u) => u.id === user.id)) return prev;
          return [user, ...prev];
        });
        if (onFavoriteCountChange) {
          onFavoriteCountChange(property.propertyId, 1);
        }
        setShowAddUser(false);
        setUserSearch("");
      } else {
        toast.error(res?.message || "Failed to add favorite");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveFavorite = async (user) => {
    if (!property?.propertyId || !user?.id) return;
    setRemovingUserId(user.id);
    try {
      const res = await api.post(
        `/admin/favorites/user/${user.id}/property/${property.propertyId}`
      );
      if (res?.success) {
        toast.success(res.message || "Favorite removed for user");
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        if (onFavoriteCountChange) {
          onFavoriteCountChange(property.propertyId, -1);
        }
      } else {
        toast.error(res?.message || "Failed to update favorite");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setRemovingUserId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 bg-gray-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                <Icon icon="lucide:heart" width="12" height="12" className="fill-rose-500 text-rose-500" />
                <span>{users.length} {users.length === 1 ? "Favorite" : "Favorites"}</span>
              </span>
            </div>
            <h2 className="type-h4 font-bold text-gray-900 truncate" title={property?.title}>
              {property?.title || "Property Favorites"}
            </h2>
            {property?.location && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                <Icon icon="lucide:map-pin" className="shrink-0 text-gray-400" width="12" height="12" />
                <span className="truncate">{formatLocation(property.location)}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddUser((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showAddUser
                  ? "bg-primary text-white"
                  : "bg-primary/10 hover:bg-primary/20 text-primary"
              }`}
              title="Add user to favorites"
            >
              <Icon icon={showAddUser ? "lucide:minus" : "lucide:user-plus"} width="16" height="16" />
              <span className="hidden sm:inline">{showAddUser ? "Cancel" : "Add User"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="Close drawer"
            >
              <Icon icon="lucide:x" width="20" height="20" />
            </button>
          </div>
        </div>

        {/* Add User Panel with Scroll-based Infinite Pagination */}
        {showAddUser && (
          <div className="p-4 bg-primary/5 border-b border-primary/10 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Icon icon="lucide:user-plus" width="14" height="14" className="text-primary" />
                Add User to Favorites (20 per page)
              </span>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icon icon="lucide:search" width="15" height="15" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by name, phone or email..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => setUserSearch("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="lucide:x" width="14" height="14" />
                </button>
              )}
            </div>

            {/* Search Results List with Scroll Pagination */}
            <div
              onScroll={handleScrollResults}
              className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 bg-white rounded-xl border border-gray-200 p-2 shadow-sm"
            >
              {isSearchingUsers ? (
                <div className="p-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading users...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No users found matching &quot;{userSearch}&quot;
                </div>
              ) : (
                <>
                  {searchResults.map((u) => {
                    const isAlreadyFavorited = users.some((favUser) => favUser.id === u.id);
                    const isAdding = addingUserId === u.id;

                    return (
                      <div
                        key={u.id}
                        className="p-2 rounded-lg hover:bg-gray-50 flex items-center justify-between gap-2 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <UserAvatar user={u} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {u.fullName || "User"}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {u.phone || u.email || "No phone"}
                            </p>
                          </div>
                        </div>

                        {isAlreadyFavorited ? (
                          <span className="text-[11px] font-semibold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-md shrink-0">
                            Favorited
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddFavorite(u)}
                            disabled={isAdding}
                            className="px-2.5 py-1 bg-primary text-white hover:bg-primary/90 rounded-lg font-medium text-[11px] flex items-center gap-1 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isAdding ? (
                              <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Icon icon="lucide:plus" width="12" height="12" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Infinite Scroll Loader Indicator */}
                  {isLoadingMoreUsers && (
                    <div className="py-2.5 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5 border-t border-gray-100">
                      <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Loading more users...</span>
                    </div>
                  )}

                  {!searchHasNext && searchResults.length > 20 && (
                    <div className="py-1.5 text-center text-[10px] text-gray-400 border-t border-gray-50">
                      All {searchResults.length} users loaded
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Drawer Body / Favorited Users List with Infinite Scroll */}
        <div
          onScroll={handleDrawerBodyScroll}
          className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 flex flex-col gap-3"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-100 flex items-center gap-3 animate-pulse bg-gray-50/50">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="h-4 w-28 bg-gray-200 rounded" />
                    <div className="h-3 w-40 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mb-3 text-rose-400">
                <Icon icon="lucide:heart-off" width="26" height="26" />
              </div>
              <h4 className="type-h5 text-gray-900 font-semibold mb-1">No Favorites Found</h4>
              <p className="text-xs text-gray-500 max-w-xs mb-4">
                No users have added this property to their favorites list yet.
              </p>
              <button
                type="button"
                onClick={() => setShowAddUser(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Icon icon="lucide:user-plus" width="15" height="15" />
                <span>Add User to Favorites</span>
              </button>
            </div>
          ) : (
            <>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/users/${user.id}`}
                        className="font-semibold text-sm text-gray-900 hover:text-primary transition-colors truncate block"
                      >
                        {user.fullName || "Unnamed User"}
                      </Link>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {user.phone && <span>{user.phone}</span>}
                        {user.email && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="truncate">{user.email}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded ${
                          user.hasPurchasedProperty
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {user.hasPurchasedProperty ? "Purchased Property" : "Prospective"}
                        </span>
                        {user.createdAt && (
                          <span className="text-[11px] text-gray-400">
                            Joined {formatDate(user.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Remove Favorite Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFavorite(user)}
                    disabled={removingUserId === user.id}
                    title="Remove from user's favorites"
                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                  >
                    {removingUserId === user.id ? (
                      <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Icon icon="lucide:heart-crack" className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}

              {/* Infinite Scroll Loader for Main User List */}
              {isLoadingMoreFavoritedUsers && (
                <div className="py-3 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading more favorited users...</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <Link
            href={`/property/${property?.propertyId}`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
          >
            <span>View Property Details</span>
            <Icon icon="lucide:external-link" width="13" height="13" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-700 rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
