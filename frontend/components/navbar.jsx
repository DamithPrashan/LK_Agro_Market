import { NavLink } from "react-router-dom";
import "./navbar.css";

const Navbar = () => {
  return (
    <header className="app-header">
      <div className="app-brand">
        LK AGRO MARKET
      </div>

      <nav className="app-nav">
        <NavLink to="/" end>
          Home
        </NavLink>

        <NavLink to="/farmer">
          Farmer
        </NavLink>

        <NavLink to="/browse">
          Browse
        </NavLink>

        <NavLink to="/preorder">
          Pre-Order
        </NavLink>

        <NavLink to="/payment">
          Payment
        </NavLink>

        <NavLink to="/mapsearch">
          Map Search
        </NavLink>

        <NavLink to="/complaints">
          Complaints
        </NavLink>

        <NavLink to="/ratings">
          Ratings
        </NavLink>

        <NavLink to="/admin">
          Admin
        </NavLink>

        <NavLink to="/register">
          Register
        </NavLink>
        <NavLink to="/login">
            Login
        </NavLink>
        <NavLink to="/profile">
            Profile
        </NavLink>
        <div className="multiLang">
          <button className="lang-btn">EN</button>
          <button className="lang-btn">සිං</button>
          <button className="lang-btn">தமிழ்</button>
        </div>
        <div className="logPerson">
          <button className="log-btn">
            Randeniya
          </button>
        </div>
      </nav>

    
    </header>
  );
};

export default Navbar;
