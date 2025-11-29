import { Link } from "react-router-dom";

export const LegalFooter = () => {
  return (
    <footer className="w-full py-6 px-4 mt-auto border-t border-border/40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Aura Health. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link 
            to="/terms" 
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <span>•</span>
          <Link 
            to="/privacy" 
            className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};
