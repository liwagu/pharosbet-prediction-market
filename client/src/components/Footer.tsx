/*
 * Design: Social Betting Lounge
 * Footer: Minimal footer with links and branding
 */
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 mt-16">
      <div className="container py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-background" />
              </div>
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Pharos<span className="text-gold">Bet</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The decentralized prediction market built on Pharos Network. Predict the future,
              trade outcomes, and earn rewards with sub-second finality.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Protocol</h4>
            <div className="space-y-2">
              {["Markets", "Create Market", "How It Works", "Documentation"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Community</h4>
            <div className="space-y-2">
              {[
                { name: "Twitter / X", url: "https://twitter.com" },
                { name: "Discord", url: "https://discord.com" },
                { name: "Telegram", url: "https://t.me" },
                { name: "GitHub", url: "https://github.com" },
              ].map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 PharosBet. Built on Pharos Network. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Pharos Testnet</span>
            <span>·</span>
            <span>Chain ID: 688888</span>
            <span>·</span>
            <a
              href="https://testnet.pharosscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gold transition-colors"
            >
              Explorer
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
