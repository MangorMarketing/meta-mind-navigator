
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-lg px-4">
        <div className="mx-auto w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center">
          <span className="text-5xl font-bold text-brand">404</span>
        </div>
        <h1 className="text-3xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">
          We couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </p>
        <Button asChild className="bg-brand hover:bg-brand-dark">
          <Link to="/" className="flex items-center gap-2">
            <Home size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
