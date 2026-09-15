import React from "react";
import { Button } from "../ui/Button";

export function PortfolioSection() {
  return (
    <section className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl lg:text-5xl font-semibold text-primary-dark tracking-tight leading-tight mb-6">
              Own prime real estate.<br/>Square foot by square foot.
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Professional property investment without the complexity. Every property is manually verified for your security.
            </p>
            <div className="flex gap-4">
              <Button variant="primary" className="flex items-center gap-2">
                Download the app
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              </Button>
              <Button variant="outline">See how it works</Button>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 shadow-sm p-6 relative">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Live Portfolio</h3>
                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Chelsea Square</p>
              </div>
              <div className="text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22"></line><line x1="15" y1="22" x2="15" y2="22"></line><line x1="9" y1="6" x2="9" y2="6"></line><line x1="15" y1="6" x2="15" y2="6"></line><line x1="9" y1="10" x2="9" y2="10"></line><line x1="15" y1="10" x2="15" y2="10"></line><line x1="9" y1="14" x2="9" y2="14"></line><line x1="15" y1="14" x2="15" y2="14"></line><line x1="9" y1="18" x2="9" y2="18"></line><line x1="15" y1="18" x2="15" y2="18"></line></svg>
              </div>
            </div>
            <div className="relative mb-6">
              <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop" alt="Property" className="w-full aspect-video sm:aspect-auto sm:h-64 object-cover" />
              <div className="absolute top-4 right-4 bg-white text-xs font-mono tracking-widest uppercase px-3 py-1 text-primary-dark">Verified</div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-mono text-gray-900 uppercase tracking-widest mb-2">
                  <span>Funded</span>
                  <span className="font-semibold">74%</span>
                </div>
                <div className="h-1 bg-gray-200 w-full">
                  <div className="h-1 bg-primary-dark w-[74%]"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-1">Price / Sq Ft</div>
                  <div className="text-lg font-mono font-medium text-gray-900">£1,250</div>
                </div>
                <div>
                  <div className="text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-1">Est. Yield</div>
                  <div className="text-lg font-mono font-medium text-amber-600">5.2%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
