"use client";

import Sidebar from "../../components/layout/Sidebar";
import TopBar from "../../components/layout/TopBar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-50 w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 transition-all duration-300 lg:ml-20 peer-hover:lg:ml-56 pt-16 lg:pt-0 flex flex-col min-h-screen">
        <TopBar />
        <div className="p-4 md:p-6 lg:p-8 overflow-y-auto flex-1 min-w-0 w-full">
          <div className="max-w-7xl mx-auto w-full h-full min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
