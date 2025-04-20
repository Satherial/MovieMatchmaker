import { FC } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  toggleHistory: () => void;
}

const Header: FC<HeaderProps> = ({ toggleHistory }) => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <i className="fas fa-film text-primary-600 text-2xl"></i>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">MovieMatch</h1>
          </div>
        </Link>
        <div>
          <Button 
            variant="outline" 
            size="sm"
            className="md:hidden"
            onClick={toggleHistory}
          >
            <i className="fas fa-history mr-1"></i> History
          </Button>
          <Button 
            size="sm"
            className="ml-2"
          >
            <i className="fas fa-user mr-1"></i> <span className="hidden sm:inline">Profile</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
