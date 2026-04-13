import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="py-12 px-6 bg-gray-950 text-gray-500">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Gictor" className="h-7 brightness-200" />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="hover:text-gray-300 transition-colors">Log In</Link>
            <Link to="/signup" className="hover:text-gray-300 transition-colors">Sign Up</Link>
            <a href="mailto:support@gictor.com" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Gictor. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
