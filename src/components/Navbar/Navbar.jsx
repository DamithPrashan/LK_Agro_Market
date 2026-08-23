import { useLocation } from "react-router-dom";
import HomepageNavbar from "../../../frontend/components/HomepageNavbar.jsx";
import ApplicationNavbar from "../../../frontend/components/navbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Navbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const authKey = user ? `${user.id ?? user.user_id}-${user.role}` : "guest";
  return pathname === "/" ? <HomepageNavbar key={authKey} /> : <ApplicationNavbar key={authKey} />;
}
