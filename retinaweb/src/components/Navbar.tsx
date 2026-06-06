import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import logo from "../assets/favicon.png";

interface NavbarProps {
  user: any;
}

const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <header className="relative z-20 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-lg blur-md"></div>
              <img
                src={logo}
                alt="RETINAWEB Logo"
                className="w-10 h-10 object-contain rounded-lg relative z-10"
              />
            </div>
            <span
              className="text-xl font-bold tracking-tight select-none text-white drop-shadow-sm"
              style={{
                fontFamily: "'Inter', 'Roboto', 'Segoe UI', sans-serif",
              }}
            >
              RETINAWEB
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-white/90 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
