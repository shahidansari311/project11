import React from "react";

export function PillarsOfPractice() {
  const pillars = [
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>,
      title: "Manual Verification",
      desc: "Technology enables us, but human expertise anchors us. Every asset is rigorously vetted by real estate professionals."
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      title: "Transparent Math",
      desc: "No hidden fees, no opaque yields. Our financial models are open-book, grounded in clear, verifiable data."
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
      title: "Security First",
      desc: "Bank-level encryption paired with immutable legal frameworks ensures your fractional ownership is unassailable."
    },
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
      title: "Human-Led",
      desc: "We build digital tools, but we operate a physical business. Our team is always accessible when you need guidance."
    }
  ];

  return (
    <section id="why-us" className="bg-white py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-16">Pillars of Practice</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {pillars.map((pillar, i) => (
            <div key={i} className="border border-gray-200 p-8 flex flex-col items-start bg-white hover:border-primary transition-colors">
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-primary mb-6">
                {pillar.icon}
              </div>
              <h3 className="text-sm font-mono font-semibold tracking-widest text-primary-dark mb-4 uppercase">{pillar.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
