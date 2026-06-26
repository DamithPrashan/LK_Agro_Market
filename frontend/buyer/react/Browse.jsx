import React from "react";
import "../../buyer/csss/Browse.css";
import { useNavigate } from "react-router-dom";
import tomatoImg from "../../assests/png/tomato.jpg";
import carrotImg from "../../assests/png/carrot.jpg";
import leeksImg from "../../assests/png/leeks.jpg";
import capsicumImg from "../../assests/png/capsicum.jpg";
import potatoImg from "../../assests/png/potato.jpg";
import greenBeansImg from "../../assests/png/beans.jpg";
import avocadoImg from "../../assests/png/avacado.jpg";
import beetrootImg from "../../assests/png/beatroot.jpg";
import grapesImg from "../../assests/png/grapes.jpg";
import pineappleImg from "../../assests/png/pineapple.jpg";
import pumpkinImg from "../../assests/png/pumpkin.jpg";
import bananaImg from "../../assests/png/banana.jpg";
import cabbageImg from "../../assests/png/cabbage.jpg";
import ladiesFingerImg from "../../assests/png/ladiesfinger.jpg";
import lemonImg from "../../assests/png/lemon.jpg";
import mangoImg from "../../assests/png/mango.jpg";
import onionImg from "../../assests/png/onion.jpg";
import watermelonImg from "../../assests/png/watermelon.jpg";
import brinjalImg from "../../assests/png/brinjal.jpg";
import cornImg from "../../assests/png/corn.jpg";

export default function Browse() {
  const navigate = useNavigate();

  const stats = {
    pending: 2,
    active: 3,
    completed: 8,
  };

  const crops = [
    {
      id: 1,
      name: "Tomato",
      farm: "Randeniya Farm",
      verified: true,
      price: 85,
      qty: "250 kg",
      harvest: "Jun 20",
      rating: 5,
      img: tomatoImg,
      bgClass: "bg-orange",
    },
    {
      id: 2,
      name: "Carrot",
      farm: "Jayarathna Agro",
      verified: true,
      price: 65,
      qty: "180 kg",
      harvest: "Jun 28",
      rating: 4.5,
      img: carrotImg,
      bgClass: "bg-yellow",
    },
    {
      id: 3,
      name: "Leeks",
      farm: "Jayaweera Estate",
      verified: false,
      price: 90,
      qty: "120 kg",
      harvest: "Jul 5",
      rating: 4.5,
      img: leeksImg,
      bgClass: "bg-green",
    },
    {
      id: 4,
      name: "Capsicum",
      farm: "Dasanayaka Farm",
      verified: true,
      price: 220,
      qty: "80 kg",
      harvest: "Jul 12",
      rating: 5,
      img: capsicumImg,
      bgClass: "bg-pink",
    },
    {
      id: 5,
      name: "Potato",
      farm: "Randeniya Farm",
      verified: true,
      price: 55,
      qty: "300 kg",
      harvest: "Jul 8",
      rating: 5,
      img: potatoImg,
      bgClass: "bg-purple",
    },
    {
      id: 6,
      name: "Green Beans",
      farm: "Jayaweera Estate",
      verified: false,
      price: 110,
      qty: "60 kg",
      harvest: "Jul 15",
      rating: 4,
      img: greenBeansImg,
      bgClass: "bg-blue",
    },
    {
      id: 7,
      name: "Avocado",
      farm: "Green Valley Farm",
      verified: true,
      price: 180,
      qty: "150 kg",
      harvest: "Jul 18",
      rating: 4.8,
      img: avocadoImg,
      bgClass: "bg-green",
    },
    {
      id: 8,
      name: "Beetroot",
      farm: "Jayarathna Agro",
      verified: true,
      price: 95,
      qty: "200 kg",
      harvest: "Jul 10",
      rating: 4.5,
      img: beetrootImg,
      bgClass: "bg-pink",
    },
    {
      id: 9,
      name: "Grapes",
      farm: "Jaffna Vineyards",
      verified: true,
      price: 450,
      qty: "90 kg",
      harvest: "Jul 22",
      rating: 5,
      img: grapesImg,
      bgClass: "bg-purple",
    },
    {
      id: 10,
      name: "Pineapple",
      farm: "Gampaha Agro",
      verified: false,
      price: 150,
      qty: "110 kg",
      harvest: "Jul 25",
      rating: 4.2,
      img: pineappleImg,
      bgClass: "bg-yellow",
    },
    {
      id: 11,
      name: "Pumpkin",
      farm: "Dasanayaka Farm",
      verified: true,
      price: 70,
      qty: "400 kg",
      harvest: "Jul 14",
      rating: 4.7,
      img: pumpkinImg,
      bgClass: "bg-orange",
    },
    {
      id: 12,
      name: "Banana",
      farm: "Kandy Farms",
      verified: true,
      price: 120,
      qty: "500 kg",
      harvest: "Jul 16",
      rating: 4.6,
      img: bananaImg,
      bgClass: "bg-yellow",
    },
    {
      id: 13,
      name: "Cabbage",
      farm: "Nuwara Eliya Gardens",
      verified: true,
      price: 80,
      qty: "350 kg",
      harvest: "Jul 11",
      rating: 4.8,
      img: cabbageImg,
      bgClass: "bg-green",
    },
    {
      id: 14,
      name: "Ladies Finger",
      farm: "Jayarathna Agro",
      verified: false,
      price: 75,
      qty: "150 kg",
      harvest: "Jul 13",
      rating: 4.3,
      img: ladiesFingerImg,
      bgClass: "bg-green",
    },
    {
      id: 15,
      name: "Lemon",
      farm: "Dasanayaka Farm",
      verified: true,
      price: 240,
      qty: "90 kg",
      harvest: "Jul 20",
      rating: 4.9,
      img: lemonImg,
      bgClass: "bg-yellow",
    },
    {
      id: 16,
      name: "Mango",
      farm: "Kurunegala Orchards",
      verified: true,
      price: 160,
      qty: "250 kg",
      harvest: "Jul 28",
      rating: 5,
      img: mangoImg,
      bgClass: "bg-orange",
    },
    {
      id: 17,
      name: "Onion",
      farm: "Anuradhapura Fields",
      verified: true,
      price: 130,
      qty: "600 kg",
      harvest: "Jul 9",
      rating: 4.5,
      img: onionImg,
      bgClass: "bg-purple",
    },
    {
      id: 18,
      name: "Watermelon",
      farm: "Hambantota Farms",
      verified: false,
      price: 90,
      qty: "800 kg",
      harvest: "Jul 21",
      rating: 4.7,
      img: watermelonImg,
      bgClass: "bg-green",
    },
    {
      id: 19,
      name: "Brinjal",
      farm: "Jayaweera Estate",
      verified: true,
      price: 85,
      qty: "140 kg",
      harvest: "Jul 17",
      rating: 4.4,
      img: brinjalImg,
      bgClass: "bg-purple",
    },
    {
      id: 20,
      name: "Corn",
      farm: "Wellawaya Farms",
      verified: true,
      price: 110,
      qty: "350 kg",
      harvest: "Jul 19",
      rating: 4.6,
      img: cornImg,
      bgClass: "bg-yellow",
    },
  ];

  return (
    <div className="layout-wrapper">
      {/* TOP NAVBAR */}
      {/* <header className="top-navbar">
        <div className="logo">LK AGRO MARKET</div>
        <nav className="top-nav-links">
          <span onClick={() => navigate("/")}>Home</span>
          <span onClick={() => navigate("/farmer")}>Farmer</span>
          <span className="active" onClick={() => navigate("/browse")}>Browse</span>
          <span onClick={() => navigate("/pre-order")}>Pre-Order</span>
          <span onClick={() => navigate("/payment")}>Payment</span>
          <span onClick={() => navigate("/map-search")}>Map Search</span>
          <span onClick={() => navigate("/complaints")}>Complaints</span>
          <span onClick={() => navigate("/ratings")}>Ratings</span>
          <span onClick={() => navigate("/admin")}>Admin</span>
          <span onClick={() => navigate("/register")}>Register</span>
        </nav>
        <div className="top-nav-actions">
          <button className="lang-btn">EN</button>
          <button className="icon-btn">👤</button>
          <button className="lang-btn tamil">தமிழ் <span className="badge">3</span></button>
          <span className="user-name">Randeniya</span>
        </div>
      </header> */}

      <div className="main-layout">
        {/* SIDEBAR */}
        {/* <aside className="sidebar">
          <div className="nav-group">
            <p className="nav-title">NAVIGATION</p>
            <ul>
              <li onClick={() => navigate("/dashboard")}>Dashboard</li>
              <li onClick={() => navigate("/farmer-home")}>Farmer Home</li>
              <li className="active" onClick={() => navigate("/browse")}>Browse Crops</li>
              <li onClick={() => navigate("/pre-order")}>Pre-Order</li>
              <li onClick={() => navigate("/payment")}>Payment</li>
              <li onClick={() => navigate("/map")}>Map Search</li>
              <li onClick={() => navigate("/complaints")}>Complaints</li>
              <li onClick={() => navigate("/ratings")}>Ratings</li>
              <li onClick={() => navigate("/admin-panel")}>Admin Panel</li>
              <li onClick={() => navigate("/login")}>Register / Login</li>
            </ul>
          </div>

          <div className="sidebar-profile">
            <div className="avatar">RR</div>
            <div className="profile-info">
              <strong>R.M.S.T. Randeniya</strong>
              <span>Farmer <span className="verified-badge">✓ Verified</span></span>
            </div>
          </div>
        </aside> */}

        {/* MAIN CONTENT */}
        <main className="content-area">
          <div className="page-header">
            <h1>Browse Crops</h1>
            <p>Fresh produce from verified Sri Lankan farmers</p>
          </div>

          {/* SEARCH BAR */}
          <div className="search-section">
            <input
              type="text"
              placeholder="Search crops, farmers, districts..."
              className="search-input"
            />
            <select className="dropdown">
              <option>Badulla</option>
              <option>Colombo</option>
              <option>Kandy</option>
              <option>Galle</option>
              <option>Matara</option>
              <option>Jaffna</option>
              <option>Anuradhapura</option>
              <option>Kurunegala</option>
              <option>Trincomalee</option>
              <option>Batticaloa</option>
              <option>Ratnapura</option>
              <option>Kegalle</option>
              <option>Nuwara Eliya</option>
              <option>Polonnaruwa</option>
              <option>Monaragala</option>
              <option>Hambantota</option>
              <option>Kalutara</option>
              <option>Puttalam</option>
              <option>Vavuniya</option>
              <option>Ampara</option>
            </select>
            <select className="dropdown">
              <option>All Crops</option>
              <option>Tomato</option>
              <option>Carrot</option>
              <option>Leeks</option>
              <option>Capsicum</option>
              <option>Potato</option>
              <option>Green Beans</option>
              <option>Cucumber</option>
              <option>Beetroot</option>
              <option>Radish</option>
              <option>Cabbage</option>
              <option>Beans</option>
              <option>Brinjal</option>
              <option>Avocado</option>
              <option>Grapes</option>
              <option>Pineapple</option>
              <option>Pumpkin</option>
              <option>Banana</option>
              <option>Ladies Finger</option>
              <option>Lemon</option>
              <option>Mango</option>
              <option>Onion</option>
              <option>Watermelon</option>
              <option>Corn</option>
            </select>
            <button className="filters-btn">Filters</button>
          </div>

          {/* INFO BANNER */}
          <div className="info-banner">
            Showing crops near <strong>Badulla</strong>. <a href="#">Use Map Search</a> to find farms on a map.
          </div>

          {/* STATS */}
          <div className="stats-row">
            <div className="stat-box">
              <h2>{stats.pending}</h2>
              <p>Pending Orders</p>
            </div>
            <div className="stat-box">
              <h2>{stats.active}</h2>
              <p>Active Reservations</p>
            </div>
            <div className="stat-box">
              <h2>{stats.completed}</h2>
              <p>Completed Orders</p>
            </div>
          </div>

          {/* CROP GRID */}
          <div className="crop-grid">
            {crops.map((crop) => (
              <div className="crop-card" key={crop.id}>
                <div className={`crop-image-area ${crop.bgClass}`}>
                  {crop.img ? (
                    <img src={crop.img} alt={crop.name} className="crop-image" />
                  ) : (
                    <span className="crop-icon">{crop.icon}</span>
                  )}
                </div>
                <div className="crop-details">
                  <h3>{crop.name}</h3>
                  <p className="farm-name">
                    {crop.farm} {crop.verified && <span className="verified-tick">✓</span>}
                  </p>
                  <p className="price">
                    <strong>Rs {crop.price}</strong>/kg
                  </p>
                  <p className="meta-info">
                    {crop.qty} • Harvest {crop.harvest}
                  </p>
                  <div className="rating">
                    ★★★★★
                  </div>
                  <button className="pre-order-btn">Pre-Order</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}