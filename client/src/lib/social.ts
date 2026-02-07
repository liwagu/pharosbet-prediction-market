/**
 * Social Sharing Utilities for PharosBet
 * 
 * Features:
 * - Generate shareable prediction posters (canvas-based)
 * - Share to Twitter/X, Telegram, WhatsApp
 * - Copy shareable links with preview text
 * - Generate referral/invite links
 */

export interface ShareData {
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  participants: number;
  marketId: string;
  userPrediction?: "yes" | "no";
}

/**
 * Generate a shareable poster image using Canvas API
 */
export async function generatePredictionPoster(data: ShareData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630; // OG image dimensions
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#0F172A");
  gradient.addColorStop(0.5, "#1E293B");
  gradient.addColorStop(1, "#0F172A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Decorative elements
  ctx.strokeStyle = "rgba(245, 158, 11, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(600, 315, 50 + i * 40, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Logo
  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 28px 'DM Sans', system-ui, sans-serif";
  ctx.fillText("⚡ PharosBet", 60, 60);

  // Question
  ctx.fillStyle = "#F1F5F9";
  ctx.font = "bold 36px 'DM Sans', system-ui, sans-serif";
  
  // Word wrap
  const words = data.question.split(" ");
  let line = "";
  let y = 160;
  const maxWidth = 800;
  
  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line, 60, y);
      line = word + " ";
      y += 48;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 60, y);

  // Probability bar
  const barY = y + 60;
  const barWidth = 500;
  const barHeight = 40;
  
  // Background
  ctx.fillStyle = "#1E293B";
  ctx.beginPath();
  ctx.roundRect(60, barY, barWidth, barHeight, 20);
  ctx.fill();
  
  // YES portion
  const yesWidth = (data.yesPrice / 100) * barWidth;
  ctx.fillStyle = "#14B8A6";
  ctx.beginPath();
  ctx.roundRect(60, barY, yesWidth, barHeight, [20, 0, 0, 20]);
  ctx.fill();
  
  // NO portion
  ctx.fillStyle = "#F43F5E";
  ctx.beginPath();
  ctx.roundRect(60 + yesWidth, barY, barWidth - yesWidth, barHeight, [0, 20, 20, 0]);
  ctx.fill();

  // Probability labels
  ctx.font = "bold 24px 'DM Sans', system-ui, sans-serif";
  ctx.fillStyle = "#14B8A6";
  ctx.fillText(`${data.yesPrice}% YES`, 60, barY + barHeight + 40);
  
  ctx.fillStyle = "#F43F5E";
  ctx.textAlign = "right";
  ctx.fillText(`${data.noPrice}% NO`, 60 + barWidth, barY + barHeight + 40);
  ctx.textAlign = "left";

  // Stats
  const statsY = barY + barHeight + 80;
  ctx.fillStyle = "#94A3B8";
  ctx.font = "16px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(`📊 ${data.volume} PHAR Volume  ·  👥 ${data.participants} Participants`, 60, statsY);

  // User prediction badge
  if (data.userPrediction) {
    const badgeColor = data.userPrediction === "yes" ? "#14B8A6" : "#F43F5E";
    ctx.fillStyle = badgeColor;
    ctx.font = "bold 20px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(`I predicted ${data.userPrediction.toUpperCase()}!`, 60, statsY + 40);
  }

  // Right side illustration
  ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
  ctx.beginPath();
  ctx.arc(1000, 315, 200, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 120px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🔮", 1000, 340);
  ctx.textAlign = "left";

  // Footer
  ctx.fillStyle = "#475569";
  ctx.font = "14px 'DM Sans', system-ui, sans-serif";
  ctx.fillText("Predict the future on Pharos Network  ·  pharosbet.xyz", 60, 590);

  // CTA
  ctx.fillStyle = "#F59E0B";
  ctx.font = "bold 16px 'DM Sans', system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Make your prediction →", 1140, 590);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(data: ShareData): void {
  const url = `${window.location.origin}/market/${data.marketId}`;
  const text = `🔮 "${data.question}"\n\nCurrently ${data.yesPrice}% YES / ${data.noPrice}% NO\n${data.volume} PHAR in volume\n\nWhat do you think? Predict now on @PharosBet 👇`;
  
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    "_blank",
    "width=600,height=400"
  );
}

/**
 * Share to Telegram
 */
export function shareToTelegram(data: ShareData): void {
  const url = `${window.location.origin}/market/${data.marketId}`;
  const text = `🔮 "${data.question}"\n\n✅ YES: ${data.yesPrice}% | ❌ NO: ${data.noPrice}%\n📊 Volume: ${data.volume} PHAR\n\nPredict now on PharosBet!`;
  
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    "_blank"
  );
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(data: ShareData): void {
  const url = `${window.location.origin}/market/${data.marketId}`;
  const text = `🔮 *${data.question}*\n\n✅ YES: ${data.yesPrice}% | ❌ NO: ${data.noPrice}%\n📊 Volume: ${data.volume} PHAR | 👥 ${data.participants} participants\n\nPredict now: ${url}`;
  
  window.open(
    `https://wa.me/?text=${encodeURIComponent(text)}`,
    "_blank"
  );
}

/**
 * Copy shareable link to clipboard
 */
export async function copyShareLink(data: ShareData): Promise<void> {
  const url = `${window.location.origin}/market/${data.marketId}`;
  const text = `🔮 "${data.question}" — ${data.yesPrice}% YES. Predict now on PharosBet!\n${url}`;
  
  await navigator.clipboard.writeText(text);
}

/**
 * Generate referral link with user's address
 */
export function generateReferralLink(marketId: string, referrerAddress: string): string {
  return `${window.location.origin}/market/${marketId}?ref=${referrerAddress}`;
}

/**
 * Download poster as image
 */
export async function downloadPoster(data: ShareData): Promise<void> {
  const blob = await generatePredictionPoster(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pharosbet-prediction-${data.marketId}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Use Web Share API if available (mobile)
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (!navigator.share) return false;
  
  const url = `${window.location.origin}/market/${data.marketId}`;
  
  try {
    const sharePayload: ShareData & { url: string; title: string; text: string } = {
      ...data,
      title: `PharosBet: ${data.question}`,
      text: `🔮 ${data.question} — Currently ${data.yesPrice}% YES. What's your prediction?`,
      url,
    };

    // Try sharing with poster image
    try {
      const blob = await generatePredictionPoster(data);
      const file = new File([blob], "prediction.png", { type: "image/png" });
      await navigator.share({
        title: sharePayload.title,
        text: sharePayload.text,
        url: sharePayload.url,
        files: [file],
      });
    } catch {
      // Fallback without image
      await navigator.share({
        title: sharePayload.title,
        text: sharePayload.text,
        url: sharePayload.url,
      });
    }
    return true;
  } catch {
    return false;
  }
}
