"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { logout } from "../../lib/api";
import TutorialVideoModal from "../common/TutorialVideoModal";

const navigationSections = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: "lucide:layout-dashboard" },
      { name: "Investments", href: "/investments", icon: "lucide:receipt" },
      { name: "Withdrawals", href: "/withdrawals", icon: "lucide:banknote" },
    ],
  },
  {
    title: "Real Estate",
    items: [
      {
        name: "Properties",
        icon: "lucide:building-2",
        children: [
          { name: "All Properties", href: "/property", icon: "lucide:building" },
          { name: "Add Property", href: "/add-property", icon: "lucide:plus-circle" },
          { name: "Builder Submissions", href: "/property-submissions", icon: "lucide:file-check" },
        ],
      },
      { name: "Builders", href: "/builders", icon: "lucide:hard-hat" },
      { name: "Favorites", href: "/favorites", icon: "lucide:heart" },
    ],
  },
  {
    title: "Compliance",
    items: [
      { name: "Users", href: "/users", icon: "lucide:users" },
      {
        name: "KYC Queue",
        icon: "lucide:shield-check",
        children: [
          { name: "Document Status", href: "/kyc/status", icon: "lucide:file-text" },
          { name: "Pending Verification", href: "/kyc/pending", icon: "lucide:clock" },
          { name: "Verified Documents", href: "/kyc/verified", icon: "lucide:badge-check" },
        ],
      },
    ],
  },
];

function NavContent({ onClose, isDesktop }) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState({});
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const itemRefs = useRef({});

  // Auto-expand accordion for active routes
  useEffect(() => {
    const newOpenMenus = {};
    navigationSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isChildActive = item.children.some((child) => {
            if (child.href === "/property") {
              return (
                pathname === "/property" ||
                (pathname.startsWith("/property/") && !pathname.startsWith("/property-submissions"))
              );
            }
            return pathname === child.href || pathname.startsWith(child.href);
          });
          if (isChildActive) {
            newOpenMenus[item.name] = true;
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...prev, ...newOpenMenus }));
  }, [pathname]);

  const toggleMenu = (itemName) => {
    setOpenMenus((prev) => {
      const willOpen = !prev[itemName];
      if (willOpen) {
        setTimeout(() => {
          const el = itemRefs.current[itemName];
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 80);
      }
      return { ...prev, [itemName]: willOpen };
    });
  };

  const textContainerClass = isDesktop
    ? "overflow-hidden transition-all duration-300 max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 whitespace-nowrap"
    : "whitespace-nowrap";

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div
        className={`h-16 flex items-center shrink-0 border-b border-gray-100/90 ${
          isDesktop ? "px-5" : "px-6 justify-between"
        }`}
      >
        <Link
          href="/dashboard"
          onClick={onClose || undefined}
          className="flex items-center gap-3 group/brand transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#003845] flex items-center justify-center text-white shadow-md shadow-primary/20 ring-1 ring-primary/30 shrink-0 group-hover/brand:scale-105 transition-all">
            <Icon icon="lucide:building-2" className="w-5 h-5" />
          </div>
          <div className={textContainerClass}>
            <div className="font-bold text-gray-900 text-base tracking-tight leading-none">Silver Real</div>
            <div className="text-[11px] font-medium text-gray-400 leading-tight mt-1">Estate Admin</div>
          </div>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors ml-auto flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
          >
            <Icon icon="lucide:x" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-2">
        {navigationSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="space-y-0.5">
            {section.title && (
              <div
                className={`text-[10px] font-bold uppercase tracking-wider text-gray-400 px-5 pt-1.5 pb-0.5 select-none ${
                  isDesktop ? "hidden group-hover:block transition-all animate-in fade-in duration-200" : "block"
                }`}
              >
                {section.title}
              </div>
            )}

            <ul className="space-y-0.5">
              {section.items.map((item) => {
                // Dropdown Item with Children
                if (item.children) {
                  const isChildActive = item.children.some((child) => {
                    if (child.href === "/property") {
                      return (
                        pathname === "/property" ||
                        (pathname.startsWith("/property/") && !pathname.startsWith("/property-submissions"))
                      );
                    }
                    return pathname === child.href || pathname.startsWith(child.href);
                  });
                  const isOpen = Boolean(openMenus[item.name]);

                  return (
                    <li
                      key={item.name}
                      ref={(el) => {
                        if (el) itemRefs.current[item.name] = el;
                      }}
                      className="flex flex-col"
                    >
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.name)}
                        className={`w-full flex items-center justify-between py-2.5 text-sm font-medium transition-colors border-l-[3px] cursor-pointer ${
                          isDesktop ? "px-[1.125rem]" : "px-6"
                        } ${
                          isChildActive
                            ? "bg-primary/5 text-primary border-primary font-semibold"
                            : "border-transparent text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                        }`}
                        title={isDesktop ? item.name : undefined}
                      >
                        <div className="flex items-center min-w-0">
                          <Icon
                            icon={item.icon}
                            className={`w-5 h-5 shrink-0 transition-colors ${
                              isChildActive ? "text-primary" : "text-gray-400"
                            }`}
                          />
                          <span className={`ml-4 ${textContainerClass}`}>{item.name}</span>
                        </div>
                        <div className={textContainerClass}>
                          <Icon
                            icon="lucide:chevron-down"
                            className={`w-4 h-4 transition-transform duration-200 ${
                              isChildActive ? "text-primary" : "text-gray-400"
                            } ${isOpen ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Submenu Dropdown */}
                      {isOpen && (
                        <ul
                          className={`space-y-0.5 py-1 ${
                            isDesktop
                              ? "pl-6 group-hover:block bg-gray-50/70 border-y border-gray-100/60 animate-in fade-in slide-in-from-top-1 duration-150"
                              : "pl-8 bg-gray-50/70 border-y border-gray-100/60 animate-in fade-in slide-in-from-top-1 duration-150"
                          }`}
                        >
                          {item.children.map((sub) => {
                            let isSubActive = false;
                            if (sub.href === "/property") {
                              isSubActive =
                                pathname === "/property" ||
                                (pathname.startsWith("/property/") &&
                                   !pathname.startsWith("/property-submissions") &&
                                   !pathname.startsWith("/add-property"));
                            } else {
                              isSubActive = pathname === sub.href || pathname.startsWith(sub.href);
                            }

                            return (
                              <li key={sub.name}>
                                <Link
                                  href={sub.href}
                                  onClick={onClose || undefined}
                                  className={`flex items-center py-2 px-3.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                                    isSubActive
                                      ? "text-primary bg-primary/10 font-bold"
                                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                  }`}
                                >
                                  <Icon
                                    icon={sub.icon}
                                    className={`w-4 h-4 shrink-0 mr-3 ${
                                      isSubActive ? "text-primary" : "text-gray-400"
                                    }`}
                                  />
                                  <span className={isDesktop ? textContainerClass : "whitespace-nowrap"}>
                                    {sub.name}
                                  </span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                // Standard Link Item
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onClose || undefined}
                      className={`flex items-center py-2.5 text-sm font-medium transition-colors border-l-[3px] ${
                        isDesktop ? "px-[1.125rem]" : "px-6"
                      } ${
                        isActive
                          ? "bg-primary/5 text-primary border-primary font-semibold"
                          : "border-transparent text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                      }`}
                      title={isDesktop ? item.name : undefined}
                    >
                      <Icon
                        icon={item.icon}
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive ? "text-primary" : "text-gray-400"
                        }`}
                      />
                      <span className={`ml-4 ${textContainerClass}`}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Admin User Profile & Logout Footer */}
      <div className="p-3 border-t border-gray-100/90 bg-gray-50/40 shrink-0">
        <div
          className={`flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-2xs ${
            isDesktop ? "p-2" : "p-2.5"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                A
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>
            <div className={`flex flex-col min-w-0 ${textContainerClass}`}>
              <span className="text-xs font-bold text-gray-800 truncate">Admin User</span>
              <span className="text-[10px] text-gray-400 truncate font-medium">Super Admin</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsTutorialOpen(true)}
              title="Add Tutorial Video"
              aria-label="Add Tutorial Video"
              className={`p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0 ${
                isDesktop ? "group-hover:opacity-100" : ""
              }`}
            >
              <Icon icon="lucide:video" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className={`p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 ${
                isDesktop ? "group-hover:opacity-100" : ""
              }`}
            >
              <Icon icon="lucide:log-out" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <TutorialVideoModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  let pageTitle = "Overview";
  if (pathname.includes("/dashboard")) pageTitle = "Dashboard";
  else if (pathname.includes("/investments")) pageTitle = "Investments";
  else if (pathname.includes("/add-property")) pageTitle = "Add Property";
  else if (pathname.includes("/property/edit")) pageTitle = "Edit Property";
  else if (pathname.includes("/property-submissions")) pageTitle = "Builder Submissions";
  else if (pathname.includes("/property")) pageTitle = "Properties";
  else if (pathname.includes("/builders")) pageTitle = "Builders";
  else if (pathname.includes("/users")) pageTitle = "Users";
  else if (pathname.includes("/favorites")) pageTitle = "Favorites";
  else if (pathname.includes("/kyc/status")) pageTitle = "Document Status";
  else if (pathname.includes("/kyc/pending")) pageTitle = "Pending Verification";
  else if (pathname.includes("/kyc/verified")) pageTitle = "Verified Documents";
  else if (pathname.includes("/kyc")) pageTitle = "KYC Queue";

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Icon icon="lucide:building-2" className="w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-lg">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm shrink-0">
            A
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open sidebar"
            className="text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg flex items-center justify-center w-8 h-8 shrink-0 transition-colors cursor-pointer"
          >
            <Icon icon="lucide:menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent onClose={() => setIsOpen(false)} isDesktop={false} />
      </aside>

      {/* Desktop Hover-Expand Sidebar */}
      <aside className="peer hidden lg:flex flex-col group w-20 hover:w-56 transition-all duration-300 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30 overflow-hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <NavContent onClose={null} isDesktop={true} />
      </aside>
    </>
  );
}
