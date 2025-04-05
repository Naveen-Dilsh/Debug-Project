import { useSelector } from "react-redux"; 
import { NavLink, Link } from "react-router-dom"; 

import Logo from "../../assets/img/sidebar-logo.png";

import routes from "../../helper/routes"; 

export default function Sidebar() {
  let details = useSelector((state) => state.auth.userDetails);

  return (
    <div className={`sidebar`}>
      <div>
        <div className="sidebar-logo">
          <img src={Logo} alt="North Lark" />
          <p>NorthLark Wren</p>
        </div>
        <ul className="sidebar-list">
          {routes
            .filter((r) => r?.showInMenu)
            .map((route, i) => {
              if (route.permissions.find((r) => r === details?.role)) {
                return (
                  <li key={i}>
                    <NavLink to={route.path}>
                      <i className={route.icon}></i>
                      {route.name}
                    </NavLink>
                  </li>
                );
              }
            })}
        </ul> 
      </div>
      <Link to="/" className="help-link">
        <i className="ri-chat-4-line"></i> Help and Support
      </Link>
    </div>
  );
}
