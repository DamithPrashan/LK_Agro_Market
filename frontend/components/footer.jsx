import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-section">
          <h3>LK Agro Market</h3>
          <p>
            Sri Lanka's direct farm-to-buyer marketplace connecting
            farmers and buyers through a trusted digital platform.
          </p>
        </div>

        <div className="footer-section">
          <h3>Quick Links</h3>

          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/browse">Browse Crops</a></li>
            <li><a href="/preorder">Pre-Order</a></li>
            <li><a href="/payment">Payments</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Support</h3>

          <ul>
            <li><a href="/complaints">Complaints</a></li>
            <li><a href="/ratings">Ratings</a></li>
            <li><a href="/admin">Admin</a></li>
            <li><a href="/register">Register</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact Us</h3>

          <p>Email: info@lkagromarket.com</p>
          <p>Phone: +94 77 123 4567</p>
          <p>Colombo, Sri Lanka</p>
        </div>

      </div>

      <div className="footer-bottom">
        © 2026 LK Agro Market. All Rights Reserved.
      </div>

    </footer>
  );
};

export default Footer;