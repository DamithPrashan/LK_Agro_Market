import Hero from "../../components/HomePage/Hero";
import MarketInsights from "../../components/HomePage/MarketInsights";
import FeaturedCrops from "../../components/HomePage/FeaturedCrops";
import HowItWorks from "../../components/HomePage/HowItWorks";
import WhyChooseUs from "../../components/HomePage/WhyChooseUs";
import Testimonials from "../../components/HomePage/Testimonials";
import CTA from "../../components/HomePage/CTA";

import "../csss/Home.css";

export default function Home() {
  return (
    <main className="home-page">
      <Hero />

      <MarketInsights />

      <FeaturedCrops />

      <HowItWorks />

      <WhyChooseUs />

      <Testimonials />

      <CTA />

    </main>
  );
}
