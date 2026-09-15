import React from "react";

export function Footer() {
  const links = [
    { name: "Terms of Service", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Risk Disclosure", href: "#" },
    { name: "Investor FAQ", href: "#" },
    { name: "LinkedIn", href: "#" },
    { name: "Twitter", href: "#" }
  ];

  return (
    <footer className="bg-primary text-white pt-24 pb-12 border-t-8 border-primary-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="text-xl font-bold tracking-tight mb-2">Silverreal</div>
            <p className="text-xs text-white/60 mb-6 uppercase tracking-widest font-mono mt-6">
              Architectural Wealth Management
            </p>
          </div>
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">Terms of Service</a>
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">Privacy Policy</a>
            </div>
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">Risk Disclosure</a>
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">Investor FAQ</a>
            </div>
            <div className="flex flex-col space-y-4">
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">LinkedIn</a>
              <a href="#" className="text-sm text-white/80 hover:text-white font-mono tracking-widest uppercase">Twitter</a>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-white/20 text-xs text-white/50 leading-relaxed max-w-3xl">
          <p className="mb-2">© 2024 Silverreal Estate. All rights reserved.</p>
          <p>Fractional real estate investing involves risks, capital is not guaranteed.</p>
        </div>
      </div>
    </footer>
  );
}
