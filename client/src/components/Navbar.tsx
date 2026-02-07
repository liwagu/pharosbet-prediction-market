/*
 * Design: Social Betting Lounge
 * Navbar: Sticky top nav with logo, navigation links, wallet connection
 * Colors: Deep navy bg, gold accent, light foreground text
 */
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWeb3 } from "@/contexts/Web3Context";
import { Wallet, Plus, TrendingUp, Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet, shortenAddress, balance } = useWeb3();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Markets", icon: TrendingUp },
    { href: "/create", label: "Create", icon: Plus },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-background" />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Pharos<span className="text-gold">Bet</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.href} href={link.href}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gold/10 text-gold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </button>
              </Link>
            );
          })}
        </div>

        {/* Wallet + Mobile Menu */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="hidden sm:flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium text-muted-foreground">
                {parseFloat(balance).toFixed(3)} PHAR
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnectWallet}
                className="border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
              >
                <Wallet className="w-4 h-4 mr-2" />
                {shortenAddress(account!)}
              </Button>
            </div>
          ) : (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              size="sm"
              className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold"
            >
              <Wallet className="w-4 h-4 mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/50 overflow-hidden"
          >
            <div className="container py-4 flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gold/10 text-gold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </button>
                  </Link>
                );
              })}
              {isConnected && (
                <div className="sm:hidden pt-2 border-t border-border/50 mt-2">
                  <div className="px-4 py-2 text-xs text-muted-foreground">
                    {shortenAddress(account!)} · {parseFloat(balance).toFixed(3)} PHAR
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
