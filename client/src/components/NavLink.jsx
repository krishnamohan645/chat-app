import { NavLink as RouterNavLink } from "react-router-dom";

const NavLink = ({
  to,
  className = "",
  activeClassName = "",
  pendingClassName = "",
  children,
  ...props
}) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive, isPending }) => {
        let classes = className;
        if (isActive) classes += ` ${activeClassName}`;
        if (isPending) classes += ` ${pendingClassName}`;
        return classes.trim();
      }}
      {...props}
    >
      {children}
    </RouterNavLink>
  );
};

export { NavLink };
