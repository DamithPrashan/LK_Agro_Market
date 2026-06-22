import React, { useState } from "react";
import "../../buyer/csss/PreOrder.css";

export default function CropDetail() {
  const [mainImage, setMainImage] = useState(
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc"
  );

  const crop = {
    name: "Organic Fresh Tomatoes",
    price: "Rs. 450 per kg",
    description:
      "Freshly harvested organic tomatoes grown without chemicals. High quality, rich in taste and nutrients. Directly from farm to your table.",
    location: "Gampaha, Sri Lanka",
    availableQty: "120 kg",
  };

  const images = [
    "https://images.unsplash.com/photo-1606787366850-de6330128bfc",
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce",
    "https://images.unsplash.com/photo-1592924357228-91a4daadcfea",
    "https://images.unsplash.com/photo-1582281298055-e25b84a5a2f4",
  ];

  const farmer = {
    name: "Sunil Perera",
    rating: 4.8,
    farms: "Green Valley Farms",
    experience: "12 years farming",
    contact: "077 123 4567",
  };

  return (
    <div className="crop-container">

      {/* LEFT SIDE */}
      <div className="left-section">

        {/* Main Image */}
        <div className="main-image-box">
          <img src={mainImage} alt="crop" />
        </div>

        {/* Thumbnails */}
        <div className="thumb-row">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt="thumb"
              className={mainImage === img ? "thumb active" : "thumb"}
              onClick={() => setMainImage(img)}
            />
          ))}
        </div>

        {/* Crop Info */}
        <div className="crop-info">
          <h1>{crop.name}</h1>
          <h3>{crop.price}</h3>
          <p>{crop.description}</p>

          <div className="meta">
            <span>📍 {crop.location}</span>
            <span>📦 Available: {crop.availableQty}</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="right-section">

        {/* Farmer Card */}
        <div className="farmer-card">
          <h2>👨‍🌾 Farmer Profile</h2>

          <div className="farmer-info">
            <h3>{farmer.name}</h3>
            <p>⭐ {farmer.rating} Rating</p>
            <p>🏡 {farmer.farms}</p>
            <p>⏳ {farmer.experience}</p>
            <p>📞 {farmer.contact}</p>
          </div>

          <button className="contact-btn">Contact Farmer</button>
        </div>

        {/* Pre Order Box */}
        <div className="order-box">
          <h2>Pre-Order Now</h2>

          <label>Quantity (kg)</label>
          <input type="number" placeholder="Enter quantity" />

          <label>Delivery Date</label>
          <input type="date" />

          <button className="order-btn">Place Pre Order</button>

          <p className="note">
            Secure your harvest before stock runs out 🌱
          </p>
        </div>

      </div>
    </div>
  );
}