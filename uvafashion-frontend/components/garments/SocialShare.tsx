"use client";

import { Share2, Twitter, Facebook, Linkedin, Link2, Copy, QrCode, X, Download } from "lucide-react";
import { useState } from "react";
import { getAnalytics } from "@/lib/analytics";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

export default function SocialShare({ url, title, description, image }: SocialShareProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const shareData = {
    title,
    text: description || title,
    url: fullUrl,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShowMenu(false);
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      setShowMenu(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        getAnalytics().trackShare("copy", fullUrl);
        setTimeout(() => setCopied(false), 2000);
      } else {
        setShowMenu(true);
      }
    } catch {
      setShowMenu(true);
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(title);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
    getAnalytics().trackShare("twitter", fullUrl);
    setShowMenu(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
    getAnalytics().trackShare("facebook", fullUrl);
    setShowMenu(false);
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    window.open(linkedInUrl, "_blank", "width=550,height=420");
    getAnalytics().trackShare("linkedin", fullUrl);
    setShowMenu(false);
  };

  const shareToPinterest = () => {
    const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(fullUrl)}&description=${encodeURIComponent(title)}${image ? `&media=${encodeURIComponent(image)}` : ""}`;
    window.open(pinterestUrl, "_blank", "width=550,height=420");
    getAnalytics().trackShare("pinterest", fullUrl);
    setShowMenu(false);
  };

  const [showQRCode, setShowQRCode] = useState(false);

  const generateQRCode = () => {
    setShowQRCode(true);
    setShowMenu(false);
    getAnalytics().trackShare("qr", fullUrl);
  };

  const downloadQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(fullUrl)}`;
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `qr-code-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700 px-4 py-2 hover:border-zinc-500 flex items-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 min-w-[200px]">
            <div className="p-2 space-y-1">
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </button>
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={shareToLinkedIn}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </button>
              <button
                onClick={shareToPinterest}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                <Share2 className="w-4 h-4" />
                Pinterest
              </button>
              <div className="border-t border-zinc-700 my-1" />
              <button
                onClick={generateQRCode}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              <div className="border-t border-zinc-700 my-1" />
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors rounded"
              >
                {copied ? (
                  <>
                    <Copy className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* QR Code Modal */}
      {showQRCode && (
        <>
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRCode(false)}
          >
            <div
              className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-zinc-200">QR Code</h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fullUrl)}`}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  Scan to view this garment
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={downloadQRCode}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors rounded text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setShowQRCode(false)}
                    className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors rounded text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

