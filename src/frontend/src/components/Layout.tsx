import { Link } from "@tanstack/react-router";
import { Crown } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border/50 px-4 py-3 flex items-center gap-3 shadow-subtle">
        <Link
          to="/"
          className="flex items-center gap-2 transition-smooth hover:opacity-80"
          data-ocid="nav.home_link"
        >
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground tracking-tight">
            Tactical Advantage
          </span>
        </Link>
      </header>

      <main className="flex-1 bg-background">{children}</main>

      <footer className="bg-card border-t border-border/50 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground">
          © {year}.{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-smooth"
          >
            Built with love using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
