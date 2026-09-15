import React from "react";
import { Button } from "../ui/Button";

export function TrackRecordSection() {
  const records = [
    { metric: "Assets Under Management", value: "$142.5M", context: "Across 24 prime architectural properties." },
    { metric: "Historical Default Rate", value: "0.00%", context: "Since inception in 2019." },
    { metric: "Average Annualized Yield", value: "7.1%", context: "Net of all operational costs." },
  ];

  return (
    <section className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-24">
          <div className="text-xs font-mono text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full border border-amber-600"></span>
            The Architecture of Trust
          </div>
          <h2 className="text-4xl font-semibold text-gray-900 mb-6">Certainty in an uncertain market.</h2>
          <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
            We merge the rigorous, mathematically sound underwriting of institutional private banking with the tangible stability of architectural assets. No opaque models, no hidden fees.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-32">
          <div className="col-span-2 border border-gray-200 bg-white p-8 grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6 text-primary">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><circle cx="12" cy="11" r="3"></circle></svg>
                <h3 className="text-lg font-semibold text-gray-900">Human-in-the-Loop Verification</h3>
              </div>
              <p className="text-sm text-gray-600 mb-8 leading-relaxed">
                Algorithms filter, but experts verify. Every property in our portfolio undergoes a rigorous, manual 47-point physical and legal inspection by our in-house architectural wealth managers.
              </p>
              <ul className="space-y-3 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-500 rounded-full"></span> Physical Structural Audit</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-500 rounded-full"></span> Hyper-local Zoning Review</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-500 rounded-full"></span> Title and Deed Forensic Check</li>
              </ul>
            </div>
            <div className="bg-gray-100 flex items-center justify-center -mx-8 -my-8 md:ml-0 md:mr-0 md:my-0 h-full min-h-[200px]">
               <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop" alt="Plans" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
          <div className="col-span-1 bg-primary text-white p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-4">Transparent Math</h3>
              <p className="text-sm text-white/80 leading-relaxed mb-8">
                Open-book financial models. See exactly where every cent goes, from acquisition costs to management yields.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
              <div>
                <div className="text-[10px] font-mono tracking-widest text-white/60 uppercase mb-2">Yield</div>
                <div className="text-xl font-mono text-white">6.42%</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-widest text-white/60 uppercase mb-2">Sq.ft Cost</div>
                <div className="text-xl font-mono text-white">$842.50</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-8 pb-4 border-b border-gray-300">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">Track Record</h2>
              <p className="text-gray-600">The numbers behind our architectural wealth thesis.</p>
            </div>
            <div className="text-[10px] font-mono tracking-widest text-amber-600 uppercase">
              Audited Q4 2023
            </div>
          </div>
          
          <div className="w-full text-sm">
            <div className="grid grid-cols-12 text-[10px] font-mono tracking-widest text-gray-500 uppercase pb-4">
              <div className="col-span-4">Metric</div>
              <div className="col-span-3">Value</div>
              <div className="col-span-5">Context</div>
            </div>
            <div className="divide-y divide-gray-200 border-t border-gray-200 border-b">
              {records.map((record, i) => (
                <div key={i} className="grid grid-cols-12 py-6 items-center">
                  <div className="col-span-4 text-gray-600">{record.metric}</div>
                  <div className={`col-span-3 font-mono font-medium ${i === 1 ? 'text-amber-500' : 'text-gray-900'} text-lg`}>
                    {record.value}
                  </div>
                  <div className="col-span-5 text-gray-500">{record.context}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
