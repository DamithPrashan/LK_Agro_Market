import Hero from "../../components/HomePage/Hero";
import FutureCultivation from "../../components/HomePage/FutureCultivation";
import MarketInsights from "../../components/HomePage/MarketInsights";
import FeaturedCrops from "../../components/HomePage/FeaturedCrops";
import HowItWorks from "../../components/HomePage/HowItWorks";
import WhyChooseUs from "../../components/HomePage/WhyChooseUs";
import Testimonials from "../../components/HomePage/Testimonials";

import "../csss/Home.css";

export default function Home() {
  return (
    <main className="home-page">
      <div id="home" className="home-anchor"><Hero /></div>
      <FutureCultivation />
      <FeaturedCrops />
      <div id="market" className="home-anchor"><MarketInsights /></div>
      <div id="about" className="home-anchor home-about">
        <HowItWorks />
        <WhyChooseUs />
        <Testimonials />
      </div>
    </main>
  );
}
