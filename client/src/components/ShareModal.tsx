/*
 * Design: Social Betting Lounge
 * ShareModal: Full-featured social sharing dialog with poster preview
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Twitter,
  MessageCircle,
  Copy,
  Download,
  Share2,
  Phone,
} from "lucide-react";
import {
  type ShareData,
  shareToTwitter,
  shareToTelegram,
  shareToWhatsApp,
  copyShareLink,
  downloadPoster,
  nativeShare,
} from "@/lib/social";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleNativeShare = async () => {
    const shared = await nativeShare(data);
    if (!shared) {
      // Fallback to copy
      await copyShareLink(data);
      toast.success("Link copied to clipboard!");
    }
    onClose();
  };

  const handleCopy = async () => {
    await copyShareLink(data);
    toast.success("Shareable link copied!");
    onClose();
  };

  const handleDownloadPoster = async () => {
    setIsGenerating(true);
    try {
      await downloadPoster(data);
      toast.success("Poster downloaded!");
    } catch {
      toast.error("Failed to generate poster");
    }
    setIsGenerating(false);
  };

  const shareOptions = [
    {
      name: "X / Twitter",
      icon: Twitter,
      color: "hover:bg-sky-500/10 hover:text-sky-400",
      action: () => { shareToTwitter(data); onClose(); },
    },
    {
      name: "Telegram",
      icon: MessageCircle,
      color: "hover:bg-blue-500/10 hover:text-blue-400",
      action: () => { shareToTelegram(data); onClose(); },
    },
    {
      name: "WhatsApp",
      icon: Phone,
      color: "hover:bg-green-500/10 hover:text-green-400",
      action: () => { shareToWhatsApp(data); onClose(); },
    },
    {
      name: "Copy Link",
      icon: Copy,
      color: "hover:bg-gold/10 hover:text-gold",
      action: handleCopy,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[440px] bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-gold" />
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Share Prediction
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Card */}
            <div className="p-5">
              <div className="rounded-xl bg-secondary/50 p-4 mb-5">
                <p className="text-sm font-semibold leading-snug mb-3">{data.question}</p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-yes font-bold">{data.yesPrice}% Yes</span>
                  <span className="text-no font-bold">{data.noPrice}% No</span>
                  <span className="text-muted-foreground">{data.volume} PHAR</span>
                </div>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {shareOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-border/50 text-sm font-medium transition-all ${option.color}`}
                  >
                    <option.icon className="w-5 h-5" />
                    {option.name}
                  </button>
                ))}
              </div>

              {/* Poster Download */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleDownloadPoster}
                disabled={isGenerating}
              >
                <Download className="w-4 h-4 mr-2" />
                {isGenerating ? "Generating Poster..." : "Download Prediction Poster"}
              </Button>

              {/* Native Share (mobile) */}
              {"share" in navigator && (
                <Button
                  className="w-full mt-3 bg-gold text-gold-foreground hover:bg-gold/90"
                  onClick={handleNativeShare}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share via...
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
