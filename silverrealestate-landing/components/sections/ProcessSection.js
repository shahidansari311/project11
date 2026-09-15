import React from "react";

export function ProcessSection() {
  return (
    <section id="how-it-works" className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <div className="text-xl font-mono text-gray-900 border-b border-gray-900 pb-2 mb-8 inline-block">01</div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-6">Discover Vetted Properties</h2>
            <p className="text-gray-600 mb-10 leading-relaxed max-w-md">
              Our acquisitions team evaluates hundreds of commercial and premium residential assets, applying strict institutional underwriting criteria. Only properties passing our rigorous 50-point inspection reach our platform.
            </p>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <h4 className="font-mono text-sm tracking-widest font-semibold uppercase text-gray-900 mb-2">Financial Audit</h4>
                  <p className="text-gray-600 text-sm">Deep-dive into historical cash flows and pro-forma projections.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1 text-primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <h4 className="font-mono text-sm tracking-widest font-semibold uppercase text-gray-900 mb-2">Physical Inspection</h4>
                  <p className="text-gray-600 text-sm">Comprehensive architectural and structural engineering reviews.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gray-200 h-64 relative w-full overflow-hidden flex items-end p-4 border border-gray-200">
               <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" alt="Office space outline" className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale" />
               <span className="relative z-10 bg-primary-dark text-white text-xs font-mono tracking-widest px-3 py-1 uppercase">Underwriting</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-200 p-6 bg-white">
                <svg className="mb-4 text-gray-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                <div className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">Properties Reviewed</div>
                <div className="text-3xl font-semibold text-gray-900">450+</div>
              </div>
              <div className="bg-primary text-white p-6">
                <svg className="mb-4 text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <div className="text-[10px] font-mono tracking-widest text-white/70 uppercase mb-2">Properties Listed</div>
                <div className="text-3xl font-semibold text-white">12</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
