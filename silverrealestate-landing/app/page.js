import React from "react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { HeroSection } from "../components/sections/HeroSection";
import { MissionVision } from "../components/sections/MissionVision";
import { BlueprintSection } from "../components/sections/BlueprintSection";
import { PillarsOfPractice } from "../components/sections/PillarsOfPractice";
import { ProcessSection } from "../components/sections/ProcessSection";
import { PortfolioSection } from "../components/sections/PortfolioSection";
import { TrackRecordSection } from "../components/sections/TrackRecordSection";
import { ContactSection } from "../components/sections/ContactSection";
import { FAQSection } from "../components/sections/FAQSection";
import { StatsBanner } from "../components/sections/StatsBanner";
import { CTASection } from "../components/sections/CTASection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <MissionVision />
      <BlueprintSection />
      <PillarsOfPractice />
      <ProcessSection />
      <PortfolioSection />
      <TrackRecordSection />
      <ContactSection />
      <FAQSection />
      <StatsBanner />
      <CTASection />
      <Footer />
    </main>
  );
}