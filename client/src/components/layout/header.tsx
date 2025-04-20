import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  User, 
  LogOut, 
  Film, 
  Menu, 
  Search, 
  X 
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };

  const closeMenu = () => setIsMenuOpen(false);

  const userInitials = user?.fullName
    ? user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()
    : user?.username.substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl flex items-center mr-4">
            <Film className="w-6 h-6 mr-2" />
            MovieMatcher
          </Link>
          
          {!isMobile && (
            <nav className="flex items-center space-x-4 lg:space-x-6">
              <Link 
                href="/" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location === "/" ? "text-primary" : "text-muted-foreground"
                )}
              >
                Home
              </Link>
            </nav>
          )}
        </div>

        {isMobile ? (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
            
            {isMenuOpen && (
              <div className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <nav className="container flex flex-col py-8 gap-4">
                  <Link 
                    href="/" 
                    className="flex items-center gap-2 text-lg font-medium p-2 rounded-md hover:bg-accent"
                    onClick={closeMenu}
                  >
                    <Home size={20} />
                    Home
                  </Link>
                  
                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 text-lg font-medium p-2 rounded-md hover:bg-accent"
                    onClick={closeMenu}
                  >
                    <User size={20} />
                    Profile
                  </Link>
                  
                  <Button 
                    variant="destructive" 
                    className="mt-4 w-full flex items-center gap-2 justify-center"
                    onClick={() => {
                      closeMenu();
                      handleLogout();
                    }}
                  >
                    <LogOut size={20} />
                    Sign Out
                  </Button>
                </nav>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-9 w-9 rounded-full" 
                  aria-label="User menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.username || "User"} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}