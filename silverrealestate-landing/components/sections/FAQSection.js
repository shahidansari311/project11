"use client";

import React, { useState } from "react";

export function FAQSection() {
  const faqs = [
    { question: "What is the minimum investment threshold?", answer: "The minimum investment is 1 square foot, which varies in price depending on the property but typically ranges from $500 to $1,500." },
    { question: "How is liquidity handled?", answer: "You can trade your fractional shares on our secondary market after an initial 6-month hold period, subject to market demand." },
    { question: "Are there management fees?", answer: "Yes, we charge a transparent 1% annual management fee on the asset value to cover property maintenance, insurance, and administrative costs." },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold text-primary-dark mb-4">Investor FAQ</h2>
          <p className="text-gray-600">Common inquiries regarding our fractional ownership model.</p>
        </div>
        
        <div className="space-y-4 mb-10">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="bg-white border border-gray-200 p-6 cursor-pointer hover:border-primary transition-colors"
              onClick={() => toggleFaq(i)}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <svg className={`text-gray-400 transition-transform ${openIndex === i ? 'rotate-45' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              {openIndex === i && (
                <div className="mt-4 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <a href="#" className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest text-amber-600 uppercase hover:text-amber-700 transition-colors">
            View Comprehensive FAQ
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </a>
        </div>
      </div>
    </section>
  );
}
