import { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Film, Github, Heart, Mail } from "lucide-react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">MovieMatch</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/home" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/home#features" className="text-sm font-medium hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="/home#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                How It Works
              </Link>
              <Button asChild variant="default" size="sm">
                <Link href="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Film className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">MovieMatch</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Discover your next favorite movie with personalized recommendations
                and share them with friends.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://github.com" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="mailto:contact@moviematch.com" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/home#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/home#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} MovieMatch. All rights reserved.
              <span className="flex items-center justify-center gap-1 mt-1">
                Made with <Heart className="h-3 w-3 text-red-500" /> by MovieMatch Team
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}