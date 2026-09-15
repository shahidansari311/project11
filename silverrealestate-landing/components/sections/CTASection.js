import React from "react";
import { Button } from "../ui/Button";

export function CTASection() {
  return (
    <section className="bg-background py-24 border-b border-gray-200">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold text-gray-900 mb-6">Ready to claim your square footage?</h2>
        <p className="text-gray-600 mb-10">
          Join thousands of investors building tangible wealth with Silverreal.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary">Download App</Button>
          <Button variant="outline">Talk to our team</Button>
        </div>
      </div>
    </section>
  );
}
