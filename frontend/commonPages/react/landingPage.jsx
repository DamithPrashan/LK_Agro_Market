import "../csss/landingPage.css";

const Home = () => {
  return (
    <div className="home">
      <section className="overview">
        <div className="overview-content">
          <div className="over-discription">
           <h2>LK Agro Market - Platform Overview</h2>
           <p>Sri lanka's direct farm-to-buyer marcketpalce</p>
        </div>
        <div className="nav-actions">
        <button className="login-btn">
          Sign In
        </button>

        <button className="register-btn">
          Register Free
        </button>
      </div>
        </div>
       
      </section>

      <section className="hero">

        <div className="hero-left">
          <h1>
            Fresh Crops.
            <br /><br />
            Direct from Sri Lankan<br/><br/> Farms.
          </h1>

          <p>
            Connect with verified farmers.
            Pre-order crops before harvest.
            No middlemen. Secure payments.
          </p>

          <div className="hero-buttons">
            <button>I'm a Farmer</button>
            <button className="outline">
              Buy Crops
            </button>
          </div>

          <div className="features">
            <span>Verified Farmers</span>
            <span>Secure Payments</span>
            <span>Sinhala / Tamil</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="stat-card">
            <h2>148</h2>
            <p>Farmers</p>
          </div>

          <div className="stat-card">
            <h2>62</h2>
            <p>Listings</p>
          </div>

          <div className="stat-card">
            <h2>1.2K</h2>
            <p>Orders</p>
          </div>
        </div>

      </section>

      <section className="how-it-works">
        <h3>HOW IT WORKS</h3>

        <div className="steps">

          <div className="step">
            <h4>1. Farmer Lists Crop</h4>
            <p>Expected harvest date included</p>
          </div>

          <div className="step">
            <h4>2. Buyer Pre-Orders</h4>
            <p>Reserve crop with deposit</p>
          </div>

          <div className="step">
            <h4>3. Collect & Pay</h4>
            <p>Pay remaining balance</p>
          </div>

          <div className="step">
            <h4>4. Rate Each Other</h4>
            <p>Build trust</p>
          </div>

        </div>
      </section>

      <section className="cards">

        <div className="info-card">
          <h3>Verified Farmers</h3>
          <p>
            NIC checked and verified
            farmer profiles.
          </p>
        </div>

        <div className="info-card">
          <h3>Platform Payments</h3>
          <p>
            Safe deposits and secure
            transactions.
          </p>
        </div>

        <div className="info-card">
          <h3>Dispute Resolution</h3>
          <p>
            Admin-managed complaint
            handling process.
          </p>
        </div>

      </section>

    </div>
  );
};

export default Home;