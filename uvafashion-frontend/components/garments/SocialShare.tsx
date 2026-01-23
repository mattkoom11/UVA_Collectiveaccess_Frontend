"use client";

import { Share2, Twitter, Facebook, Linkedin, Link2, Copy } from "lucide-react";
import { useState } from "react";

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(title);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
    setShowMenu(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
    setShowMenu(false);
  };

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`;
    window.open(linkedInUrl, "_blank", "width=550,height=420");
    setShowMenu(false);
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
    </div>
  );
}

