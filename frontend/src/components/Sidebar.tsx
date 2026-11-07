import { useState } from "react";
import { isUxDemo } from "../lib/experience";
import { Modal } from "./Modal";
import {
  MoreHorizontal,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Link2,
  LogOut,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMediaQuery } from "../lib/useMediaQuery";
import StaffNotificationBell from "./StaffNotificationBell";
import "./Sidebar.css";
import "./StaffNotificationBell.css";

const LOGO = "/brand/maria-alice-logo.webp";

type AppRole = "ADMIN" | "SECRETARY" | "DENTIST";

const allNavItems: Array<{
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof CalendarDays;
  roles: AppRole[];
}> = [
  {
    to: "/agenda",
    label: "Agenda",
    shortLabel: "Agenda",
    icon: CalendarDays,
    roles: ["ADMIN", "SECRETARY", "DENTIST"],
  },
  {
    to: "/patients",
    label: "Pacientes",
    shortLabel: "Pacientes",
    icon: UsersRound,
    roles: ["ADMIN", "SECRETARY"],
  },
  {
    to: "/dentists",
    label: "Dentistas",
    shortLabel: "Dentistas",
    icon: Stethoscope,
    roles: ["ADMIN", "SECRETARY"],
  },
  {
    to: "/financial",
    label: "Financeiro",
    shortLabel: "Finanças",
    icon: CircleDollarSign,
    roles: ["ADMIN", "SECRETARY", "DENTIST"],
  },
  {
    to: "/procedures",
    label: "Procedimentos",
    shortLabel: "Proced.",
    icon: ClipboardList,
    roles: ["ADMIN", "SECRETARY"],
  },
  {
    to: "/booking-link",
    label: "Link de agendamento",
    shortLabel: "Link de agendamento",
    icon: Link2,
    roles: ["ADMIN", "SECRETARY"],
  },
];

export default function Sidebar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout, role } = useAuth();
  const isMobile = useMediaQuery("(max-width: 800px)");
  const navItems = allNavItems.filter(
    (item) =>
      (role ? item.roles.includes(role) : true) &&
      (!isUxDemo || item.to === "/agenda"),
  );
  const displayedItems = isMobile ? navItems.slice(0, 2) : navItems;
  const canManageBookings = role === "ADMIN" || role === "SECRETARY";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={LOGO} alt="Maria Alice Odontologia Especializada" />
        <small>
          {role === "DENTIST"
            ? "Área do dentista"
            : role === "SECRETARY"
              ? "Área da recepção"
              : "Área de gestão"}
        </small>
      </div>

      {canManageBookings && !isUxDemo ? (
        <div className="sidebar-notifications">
          <StaffNotificationBell enabled={!isMobile} />
          <span>Solicitações online</span>
        </div>
      ) : null}

      <nav className="sidebar-nav" aria-label="Navegação principal">
        {displayedItems.map(({ to, label, shortLabel, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="sidebar-link-label-full">{label}</span>
            <span className="sidebar-link-label-short">{shortLabel}</span>
          </NavLink>
        ))}
        {isMobile && navItems.length > 2 ? (
          <button
            type="button"
            className="sidebar-link sidebar-more"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <MoreHorizontal size={20} />
            <span>Mais</span>
          </button>
        ) : null}
      </nav>
      {moreOpen ? (
        <Modal
          title="Mais acessos da equipe"
          onClose={() => setMoreOpen(false)}
        >
          <nav className="sidebar-more-links" aria-label="Mais acessos">
            {navItems.slice(2).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </Modal>
      ) : null}

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout-btn" onClick={logout}>
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </aside>
  );
}
