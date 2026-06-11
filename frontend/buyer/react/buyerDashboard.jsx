import React from "react";
import "../../buyer/csss/dashBoard.css"; 

const crops = [
  {
    emoji: "🍅",
    name: "Tomato",
    farm: "Randeniya Farm",
    price: 85,
    harvest: "250 kg • Harvest Jun 20",
    color: "#f7e3c2"
  },
  {
    emoji: "🥕",
    name: "Carrot",
    farm: "Jayarathna Agro",
    price: 65,
    harvest: "180 kg • Harvest Jun 28",
    color: "#f8efd4"
  },
  {
    emoji: "🥬",
    name: "Leeks",
    farm: "Jayaweera Estate",
    price: 90,
    harvest: "120 kg • Harvest Jul 5",
    color: "#dfe9d5"
  },
  {
    emoji: "🌶️",
    name: "Capsicum",
    farm: "Dasanayaka Farm",
    price: 220,
    harvest: "80 kg • Harvest Jul 12",
    color: "#f8dbe5"
  },
  {
    emoji: "🥔",
    name: "Potato",
    farm: "Randeniya Farm",
    price: 55,
    harvest: "300 kg • Harvest Jul 8",
    color: "#e7def7"
  },
  {
    emoji: "🫘",
    name: "Green Beans",
    farm: "Jayaweera Estate",
    price: 110,
    harvest: "60 kg • Harvest Jul 15",
    color: "#d7f1f7"
  }
];

export default function BuyerDashboard() {
  return (
    <div>


      <div className="layout">
        <main className="content">

          <h2>Browse Crops</h2>

          <p>Fresh produce from verified Sri Lankan farmers</p>

          <div className="search">

            <input placeholder="Search crops, farmers, districts..." />

            <select>
              <option>Badulla</option>
            </select>

            <select>
              <option>All Crops</option>
            </select>

            <button>Filters</button>

          </div>

          <div className="message">
            Showing crops near <b>Badulla.</b> Use Map Search to find farms on a map.
          </div>

          <div className="stats">

            <div className="box">
              <h1>2</h1>
              Pending Orders
            </div>

            <div className="box">
              <h1>3</h1>
              Active Reservations
            </div>

            <div className="box">
              <h1>8</h1>
              Completed Orders
            </div>

          </div>

          <div className="cards">

            {crops.map((item, index) => (

              <div className="card" key={index}>

                <div
                  className="top"
                  style={{ background: item.color }}
                >
                  {item.emoji}
                </div>

                <div className="body">

                  <h3>{item.name}</h3>

                  <small>{item.farm} ✓</small>

                  <h2>
                    Rs {item.price}
                    <span>/kg</span>
                  </h2>

                  <p>{item.harvest}</p>

                  <div className="star">
                    ★★★★★
                  </div>

                  <button>
                    Pre-Order
                  </button>

                </div>

              </div>

            ))}

          </div>

        </main>

      </div>

    </div>
  );
}
