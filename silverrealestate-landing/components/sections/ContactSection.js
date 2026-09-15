import React from "react";
import { Button } from "../ui/Button";

export function ContactSection() {
  return (
    <section id="contact" className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl font-semibold text-primary-dark mb-6">Get in Touch with our Team</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Whether you are exploring fractional ownership for the first time or expanding a sophisticated portfolio, our advisory team is prepared to provide absolute clarity.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 p-8 lg:p-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">Direct Inquiry</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">First Name</label>
                  <input type="text" placeholder="Jane" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">Corporate Email</label>
                <input type="email" placeholder="jane.doe@company.com" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900" />
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">Area of Interest</label>
                <select className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900 appearance-none">
                  <option>Fractional Ownership Opportunities</option>
                  <option>Partnerships</option>
                  <option>Media Inquiry</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase mb-2">Message</label>
                <textarea placeholder="Detail your investment objectives..." rows="4" className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-gray-900 resize-none"></textarea>
              </div>
              <Button type="button" variant="primary" className="flex items-center gap-2">
                Talk to Us 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </Button>
            </form>
          </div>
          <div className="space-y-8">
            <div className="bg-white border border-gray-200">
              <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop" alt="Headquarters" className="w-full aspect-video sm:aspect-auto sm:h-64 object-cover" />
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Global Headquarters</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 text-sm text-gray-600">
                    <svg className="mt-1 flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div>
                      1200 Avenue of the Americas<br/>
                      Suite 4500<br/>
                      New York, NY 10036
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-4"></div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <svg className="flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    advisory@silverreal.com
                  </div>
                  <div className="flex items-center gap-4 font-mono font-medium text-gray-900">
                    <svg className="flex-shrink-0 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    +1 (212) 555-0198
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 border border-gray-200 p-6 flex items-start gap-4">
              <svg className="flex-shrink-0 text-amber-600 mt-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
              <div>
                <h4 className="text-xs font-mono font-semibold tracking-widest text-gray-900 uppercase mb-2">Secure Communications</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  All inquiries are routed through our encrypted internal network. Client data integrity is our foremost priority.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
