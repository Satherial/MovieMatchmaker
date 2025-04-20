import { FC } from "react";
import { Link } from "wouter";

const Footer: FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2">
              <i className="fas fa-film text-primary-400 text-2xl"></i>
              <h2 className="text-xl font-bold">MovieMatch</h2>
            </div>
            <p className="mt-2 text-gray-400 text-sm">Find your next favorite movie with ease.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Explore</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-400 hover:text-white">Categories</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">Top Rated</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">New Releases</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-400 hover:text-white">Profile</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">Watch History</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">Settings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Help</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="text-gray-400 hover:text-white">FAQ</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">Contact Us</Link></li>
                <li><Link href="/" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} MovieMatch. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
