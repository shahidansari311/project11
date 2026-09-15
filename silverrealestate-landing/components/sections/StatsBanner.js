import React from "react";

export function StatsBanner() {
  const stats = [
    { value: "2022", label: "Founded" },
    { value: "100k+", label: "Sq ft funded" },
    { value: "5k+", label: "Active Investors" }
  ];

  return (
    <section className="bg-primary text-white py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="py-6 md:py-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-semibold tracking-tight mb-2">{stat.value}</div>
              <div className="text-xs font-mono tracking-widest text-white/70 uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
