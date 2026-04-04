import { useState } from "react";
import type { ReplyData } from "./index";
import type { BlockingMode, ActionMode, Locale } from "@/lib/storage";
import { t, formatStats } from "@/lib/i18n";

interface LiveFeedPanelProps {
  replies: ReplyData[];
  isScanning: boolean;
  onClose: () => void;
  blockingMode: BlockingMode;
  actionMode: ActionMode;
  locale: Locale;
}

export function LiveFeedPanel({ replies, isScanning, onClose, blockingMode, actionMode, locale }: LiveFeedPanelProps) {
  const [statsCopied, setStatsCopied] = useState(false);

  if (replies.length === 0 && !isScanning) {
    return null;
  }

  const stats = {
    total: replies.length,
    analyzed: replies.filter((r) => r.status !== "pending" && r.status !== "analyzing").length,
    flagged: replies.filter((r) => r.status === "flagged" || r.status === "blocked" || r.status === "reported" || r.status === "actioned").length,
    blocked: replies.filter((r) => r.status === "blocked" || r.status === "actioned").length,
    reported: replies.filter((r) => r.status === "reported" || r.status === "actioned").length,
  };

  const flaggedLabel = blockingMode === "hate" ? t("hate") : blockingMode === "cultPraise" ? t("cult") : t("queued");
  const modeTitle = blockingMode === "hate" ? t("hateMode") : blockingMode === "cultPraise" ? t("cultMode") : t("blockAllMode");

  async function handleCopyStats() {
    const text = formatStats(stats.analyzed, stats.blocked, stats.reported, locale);
    await navigator.clipboard.writeText(text);
    setStatsCopied(true);
    setTimeout(() => setStatsCopied(false), 2000);
  }

  return (
    <div className="thb-panel">
      <div className="thb-panel-header">
        <h3>{t("scanResults")} ({modeTitle})</h3>
        <button className="thb-close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="thb-stats">
        <span>{t("analyzed")}: {stats.analyzed}/{stats.total}</span>
        <span className="thb-flagged-count">{flaggedLabel}: {stats.flagged}</span>
        {actionMode !== "report" && (
          <span className="thb-blocked-count">{t("blocked")}: {stats.blocked}</span>
        )}
        {actionMode !== "block" && (
          <span className="thb-reported-count">{t("reported")}: {stats.reported}</span>
        )}
      </div>

      <div className="thb-feed">
        {replies.map((reply, index) => (
          <div key={index} className={`thb-reply thb-reply-${reply.status}`}>
            <div className="thb-reply-header">
              <span className="thb-username">@{reply.username}</span>
              <StatusBadge status={reply.status} confidence={reply.result?.confidence} blockingMode={blockingMode} actionMode={actionMode} />
            </div>
            <div className="thb-reply-text">
              {reply.text.length > 100 ? `${reply.text.slice(0, 100)}...` : reply.text}
            </div>
            {reply.result?.reason && reply.status !== "safe" && (
              <div className="thb-reply-reason">{reply.result.reason}</div>
            )}
          </div>
        ))}
      </div>

      {!isScanning && stats.analyzed > 0 && (
        <button className="thb-copy-stats-btn" onClick={handleCopyStats}>
          {statsCopied ? t("statsCopied") : t("copyStats")}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status, confidence, blockingMode, actionMode }: { status: ReplyData["status"]; confidence?: number; blockingMode: BlockingMode; actionMode: ActionMode }) {
  const isBlockAll = blockingMode === "blockAll";
  const flaggedLabel = blockingMode === "hate" ? t("hate") : blockingMode === "cultPraise" ? t("cult") : t("queued");

  // Don't show confidence for blockAll mode
  const showConfidence = !isBlockAll && confidence;

  const badges: Record<ReplyData["status"], { label: string; className: string }> = {
    pending: { label: t("pending"), className: "thb-badge-pending" },
    analyzing: { label: isBlockAll ? t("processing") : t("analyzing"), className: "thb-badge-analyzing" },
    safe: { label: `${t("safe")}${showConfidence ? ` (${confidence}%)` : ""}`, className: "thb-badge-safe" },
    flagged: { label: `${flaggedLabel}${showConfidence ? ` (${confidence}%)` : ""}`, className: "thb-badge-flagged" },
    blocked: { label: t("blockedBadge"), className: "thb-badge-blocked" },
    reported: { label: t("reportedBadge"), className: "thb-badge-reported" },
    actioned: { label: t("blockedReported"), className: "thb-badge-actioned" },
    error: { label: t("error"), className: "thb-badge-error" },
  };

  const badge = badges[status];

  return <span className={`thb-badge ${badge.className}`}>{badge.label}</span>;
}
