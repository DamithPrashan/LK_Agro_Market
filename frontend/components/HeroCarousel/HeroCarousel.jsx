import React, { useState, useEffect } from "react";
import buyer1 from "../../assets/png/buyer1.jpg";
import buyer2 from "../../assets/png/buyer2.jpg";
import buyer3 from "../../assets/png/buyer3.jpg";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./HeroCarousel.css";

export default function HeroCarousel({ children, images }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const defaultSlides = [
    { image: buyer1, alt: "Fresh Vegetables in LK Agro Market" },
    { image: buyer2, alt: "Fresh Fruits and Direct Sourcing" },
    { image: buyer3, alt: "Direct Connection with Farmers" }
  ];

  const slides = images && images.length > 0
    ? images.map((img, idx) => ({
        image: img,
        alt: `Agri Image ${idx + 1}`
      }))
    : defaultSlides;

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 4500); // Cycle every 4.5 seconds

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  return (
    <div 
      className="hero-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides (Background Layer) */}
      <div className="carousel-inner">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${index === currentIndex ? "active" : ""}`}
            style={{ backgroundImage: `url(${slide.image})` }}
            role="img"
            aria-label={slide.alt}
          />
        ))}
      </div>

      {/* Dark Readability Overlay */}
      <div className="carousel-overlay" />

      {/* Foreground Content Layer */}
      <div className="carousel-content">
        {children}
      </div>

      {/* Navigation Arrows */}
      <button 
        className="carousel-control prev" 
        onClick={handlePrev}
        aria-label="Previous Slide"
      >
        <FaChevronLeft />
      </button>
      <button 
        className="carousel-control next" 
        onClick={handleNext}
        aria-label="Next Slide"
      >
        <FaChevronRight />
      </button>

      {/* Dots Indicators */}
      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
