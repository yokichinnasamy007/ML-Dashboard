import { NavLink } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/",            label: "Home"          },
  { to: "/supervised",  label: "House Price"   },
  { to: "/unsupervised",label: "Customer Segs" },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">&#9650;</span>
        <span className="brand-text">ML Dashboard</span>
      </div>
      <ul className="navbar-links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
