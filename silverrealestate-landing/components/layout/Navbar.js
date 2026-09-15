"use client";

import React, { useState } from "react";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How it works", href: "#how-it-works" },
    { label: "Why us", href: "#why-us" },
    { label: "About us", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed w-full bg-background/90 backdrop-blur-sm z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="text-xl font-bold tracking-tight">Silverreal</div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex space-x-8 text-sm font-mono tracking-widest text-gray-500 uppercase">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-primary transition-colors">{link.label}</a>
          ))}
        </div>
        
        <div className="flex items-center space-x-4">
          <a href="#contact" className="hidden sm:inline-flex items-center justify-center font-mono text-xs sm:text-sm tracking-widest uppercase transition-colors px-4 py-2 sm:px-6 sm:py-3 bg-primary text-white hover:bg-primary-dark">
            Talk to us
          </a>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-gray-600 hover:text-primary focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-gray-200 shadow-sm absolute w-full">
          <div className="px-6 py-4 flex flex-col space-y-4 text-sm font-mono tracking-widest text-gray-600 uppercase">
            {navLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href} 
                className="block hover:text-primary transition-colors py-2 border-b border-gray-100 last:border-0"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a 
              href="#contact" 
              className="inline-flex sm:hidden items-center justify-center text-center font-mono text-xs tracking-widest uppercase transition-colors px-4 py-3 bg-primary text-white hover:bg-primary-dark w-full mt-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Talk to us
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
