import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import "../styles/experience.css";

export function ExperienceTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("maria-alice-theme") === "dark";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    document.documentElement.dataset.clinicTheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("maria-alice-theme", dark ? "dark" : "light");
    } catch {
      /* Storage is optional. */
    }
    return () => {
      delete document.documentElement.dataset.clinicTheme;
    };
  }, [dark]);
  return (
    <button
      type="button"
      className="experience-theme"
      onClick={() => setDark(!dark)}
      aria-label="Tema escuro"
      aria-pressed={dark}
      title={dark ? "Usar tema claro" : "Usar tema escuro"}
    >
      {dark ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
