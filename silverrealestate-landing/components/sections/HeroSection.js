import React from "react";
import { Button } from "../ui/Button";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden border-b border-gray-200">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern Architecture" 
          className="w-full h-full object-cover object-right"
        />
      </div>
      <div className="max-w-7xl mx-auto px-6 relative z-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl lg:text-7xl font-semibold tracking-tight text-primary-dark leading-tight mb-6">
            Democratizing <br/>Architectural Wealth
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-xl leading-relaxed">
            We believe prime real estate shouldn't be gated. By fractionalizing ownership down to the square foot, we're opening the doors to premium investments for everyone.
          </p>
          <Button variant="primary">Explore Properties</Button>
        </div>
      </div>
    </section>
  );
}
