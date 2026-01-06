import { Github, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo & Description */}
          <div className="flex flex-col items-center gap-2 md:items-start">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="font-semibold">krdn Development Hub</span>
            </div>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              AI & Automation Services Platform
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:contact@example.com"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>&copy; {new Date().getFullYear()} krdn. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1 hover:text-foreground"
            >
              Admin Panel
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
