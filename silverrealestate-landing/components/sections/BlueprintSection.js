import React from "react";

export function BlueprintSection() {
  return (
    <section className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-32 h-32 md:w-48 md:h-48 bg-primary/20" />
            <img 
              src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop" 
              alt="Founders" 
              className="relative z-10 w-full aspect-[4/5] md:aspect-auto md:h-[500px] object-cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-8">The Blueprint of Silverreal</h2>
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                The traditional real estate market was designed for the few. High capital requirements, complex legal structures, and illiquidity have historically locked out the majority of individuals from participating in one of the most stable wealth-generating asset classes.
              </p>
              <p>
                We saw a structural flaw. The solution wasn't just to digitize the process, but to fundamentally alter the unit of ownership. By breaking properties down into manageable, tradeable square feet, we created a model rooted in tangible reality, yet flexible enough for the modern investor.
              </p>
              <p>
                We pair this technological liquidity with rigorous, manual verification. Every property, every legal structure, and every transaction is scrutinized by human experts to ensure that digital fractional ownership retains the robust security of a traditional deed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
