/*
 * Design: Social Betting Lounge
 * Home page: Hero section + category filter + market feed + trending sidebar
 * Layout: Single-column feed (like Twitter) with right sidebar on desktop
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarketCard from "@/components/MarketCard";
import { useMarkets, type MarketCategory } from "@/contexts/MarketsContext";
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Plus,
  Flame,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
} from "lucide-react";

const HERO_BG = "https://private-us-east-1.manuscdn.com/sessionFile/gRhE0enDQ2V3GNpsIEX6Gs/sandbox/SCh5VMI4LlcN9WwMXPqT8S-img-1_1770474301000_na1fn_aGVyby1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1JoRTBlbkRRMlYzR05wc0lFWDZHcy9zYW5kYm94L1NDaDVWTUk0TGxjTjlXd01YUHFUOFMtaW1nLTFfMTc3MDQ3NDMwMTAwMF9uYTFmbl9hR1Z5YnkxaVp3LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=bTV1IQjP0yr-e84BTQRC6DfYlGz~WDUNOb0BEKrOoiS8fDr3u23Ezfechnn5lZjQ~fhLiOh12o7wH9V0u9Zwxoi4hGqBcFl2UiTuSV9b2MVf9g42uepF4KbwDU9jmeaMrDjfWGQImskUfY-0Afxi-zbvqNxt2mfD9rAx5vgPqBhgysY8FHsg0l4fak5TUPhfxc-TT9bNth4vEiyExU~W6QtZncac4zZGUP66Amfjk5Ya0L~Tow--DMU04bkl9u0aQrdDs3sSnJ5~9NsJD6Oos2taJZ3H4RV7jKATx0JViIuW68ulBqB6fwQQyvDoTta9HdYVyDK7hMQ1k7GUVMsMFg__";

const PREDICTION_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/gRhE0enDQ2V3GNpsIEX6Gs/sandbox/SCh5VMI4LlcN9WwMXPqT8S-img-3_1770474298000_na1fn_cHJlZGljdGlvbi1pbGx1c3RyYXRpb24.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZ1JoRTBlbkRRMlYzR05wc0lFWDZHcy9zYW5kYm94L1NDaDVWTUk0TGxjTjlXd01YUHFUOFMtaW1nLTNfMTc3MDQ3NDI5ODAwMF9uYTFmbl9jSEpsWkdsamRHbHZiaTFwYkd4MWMzUnlZWFJwYjI0LnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=l2qZEfD8SuGjbZ3xCfrkrVIrw1R-8uTSixmvR7bjrYvaZo2GHLJWb-YlZ96ReH18ToIEXBZOfBIruNFU~jbY5XymaAYOVvL12NTHjDgunYXQlW9gdIDzy7E6-w8NjxTTcUQgf1O~qL6bIBN6~09tIXA83Op4NUpweT~1Io09vtdKApO50bzFiBRlX0pb2OVOIzLzqeAhzQP5ZdXAb26hG~JAe7imVC8waXiayb~oi80a4fZlEMaBxo8S-WfzhZMMUILiMBTJyHlVsfop2Yx7-dx0I4UdVWXtOWpc1a1LDVVkOAtZWadJ5HEo8SuCWnbDxdEJTVAwDXKkJmutCuiQvw__";

const categoryFilters: { value: MarketCategory | "all"; label: string; icon: any }[] = [
  { value: "all", label: "All", icon: Flame },
  { value: "crypto", label: "Crypto", icon: BarChart3 },
  { value: "politics", label: "Politics", icon: Users },
  { value: "sports", label: "Sports", icon: TrendingUp },
  { value: "tech", label: "Tech", icon: Zap },
  { value: "entertainment", label: "Entertainment", icon: Flame },
];

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

export default function Home() {
  const { markets, featuredMarkets, trendingMarkets, filterByCategory } = useMarkets();
  const [activeCategory, setActiveCategory] = useState<MarketCategory | "all">("all");

  const filteredMarkets = filterByCategory(activeCategory);
  const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
  const totalParticipants = markets.reduce((sum, m) => sum + m.participants, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative container py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Powered by Pharos Network
              </div>
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Predict the Future.
                <br />
                <span className="text-gold">Earn Rewards.</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                The decentralized prediction market built on Pharos. Create markets, trade outcomes,
                and profit from your knowledge — with sub-second finality and zero gas headaches.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/create">
                  <Button
                    size="lg"
                    className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold text-base px-8"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Market
                  </Button>
                </Link>
                <a href="#markets">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-border hover:bg-secondary font-semibold text-base px-8"
                  >
                    Explore Markets
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-10">
                <div>
                  <div className="text-2xl font-bold text-gold" style={{ fontFamily: "var(--font-display)" }}>
                    {formatVolume(totalVolume)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Total Volume</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {markets.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Active Markets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {formatVolume(totalParticipants)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Participants</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:block"
            >
              <img
                src={PREDICTION_IMG}
                alt="Prediction Market Illustration"
                className="w-full max-w-md mx-auto drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section id="markets" className="container py-12">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Feed Column */}
          <div>
            {/* Category Filters */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeCategory === cat.value
                      ? "bg-gold/15 text-gold border border-gold/30"
                      : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Market Feed */}
            <div className="flex flex-col gap-4">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((market, i) => (
                  <MarketCard key={market.id} market={market} index={i} />
                ))
              ) : (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg">No markets found in this category.</p>
                  <Link href="/create">
                    <Button className="mt-4 bg-gold text-gold-foreground hover:bg-gold/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create the first one
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden lg:block space-y-6">
            {/* Trending Markets */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3
                className="text-base font-bold mb-4 flex items-center gap-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                <Flame className="w-5 h-5 text-gold" />
                Trending
              </h3>
              <div className="space-y-4">
                {trendingMarkets.map((market, i) => (
                  <Link key={market.id} href={`/market/${market.id}`}>
                    <div className="group flex gap-3 py-2 cursor-pointer">
                      <span className="text-xs font-bold text-muted-foreground mt-0.5 w-5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug group-hover:text-gold transition-colors line-clamp-2">
                          {market.question}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="text-yes font-semibold">{market.yesPrice}% Yes</span>
                          <span>{formatVolume(market.volume)} Vol</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3
                className="text-base font-bold mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How It Works
              </h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Pick a Market", desc: "Browse predictions on crypto, politics, sports & more" },
                  { step: "2", title: "Buy Shares", desc: "Buy YES or NO shares based on your prediction" },
                  { step: "3", title: "Earn Rewards", desc: "If you're right, redeem shares for the prize pool" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gold/15 text-gold flex items-center justify-center text-xs font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pharos Info */}
            <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-gold" />
                <h3 className="text-sm font-bold text-gold" style={{ fontFamily: "var(--font-display)" }}>
                  Built on Pharos
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pharos Network delivers sub-second finality and high throughput, making prediction
                trading feel instant. No more waiting for block confirmations.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}
