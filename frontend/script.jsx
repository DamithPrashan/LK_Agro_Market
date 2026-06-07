// src/App.js
import React from "react";
import "./style.css";

function App() {
  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="title">
          <h2>LK Agro Market — Platform Overview</h2>
          <p>Sri Lanka's direct farm-to-buyer marketplace</p>
        </div>
        <div className="auth-buttons">
          <button className="btn-outline">Sign In</button>
          <button className="btn-primary">Register Free</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1>Fresh Crops.<br />Direct from Sri Lankan Farms.</h1>
        <p>
          Connect with verified farmers. Pre-order crops before harvest. No
          middlemen. All payments secured through the platform.
        </p>
        <div className="hero-buttons">
          <button className="btn-primary">I'm a Farmer</button>
          <button className="btn-outline">Buy Crops</button>
        </div>
        <div className="hero-links">
          <span>Verified Farmers</span>
          <span>Secure Payments</span>
          <span>Sinhala / Tamil</span>
        </div>
        <div className="stats">
          <div className="stat-box">
            <h3>148</h3>
            <p>Farmers</p>
          </div>
          <div className="stat-box">
            <h3>62</h3>
            <p>Listings</p>
          </div>
          <div className="stat-box">
            <h3>1.2K</h3>
            <p>Orders</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2>HOW IT WORKS</h2>
        <div className="steps">
          <div className="step">
            <h4>1. Farmer Lists Crop</h4>
            <p>During cultivation with expected harvest date</p>
          </div>
          <div className="step">
            <h4>2. Buyer Pre-Orders</h4>
            <p>Places reservation and pays 1/3 deposit</p>
          </div>
          <div className="step">
            <h4>3. Collect & Pay</h4>
            <p>Collect produce and pay balance on platform</p>
          </div>
          <div className="step">
            <h4>4. Rate Each Other</h4>
            <p>Build trust for future transactions</p>
          </div>
        </div>
      </section>

      {/* Info Boxes */}
      <section className="info-boxes">
        <div className="info-box">
          <h4>Verified Farmers</h4>
          <p>NIC-checked, location-verified farmers earn a trusted badge before listing</p>
        </div>
        <div className="info-box">
          <h4>Platform Payments</h4>
          <p>Secure 1/3 pre-payment + balance on collection via Bank / Lanka QR</p>
        </div>
        <div className="info-box">
          <h4>Dispute Resolution</h4>
          <p>Admin-mediated complaint process — fair resolution for every order</p>
        </div>
      </section>
    </div>
  );
}

export default App;
