import type { ReplyData } from "./index";
import type { BlockingMode } from "@/lib/storage";

interface LiveFeedPanelProps {
  replies: ReplyData[];
  isScanning: boolean;
  onClose: () => void;
  blockingMode: BlockingMode;
}

export function LiveFeedPanel({ replies, isScanning, onClose, blockingMode }: LiveFeedPanelProps) {
  if (replies.length === 0 && !isScanning) {
    return null;
  }

  const stats = {
    total: replies.length,
    analyzed: replies.filter((r) => r.status !== "pending" && r.status !== "analyzing").length,
    flagged: replies.filter((r) => r.status === "flagged" || r.status === "blocked").length,
    blocked: replies.filter((r) => r.status === "blocked").length,
  };

  const flaggedLabel = blockingMode === "hate" ? "Hate" : "Cult";
  const modeTitle = blockingMode === "hate" ? "Hate Speech" : "Cult Praise";

  return (
    <div className="thb-panel">
      <div className="thb-panel-header">
        <h3>Scan Results ({modeTitle})</h3>
        <button className="thb-close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="thb-stats">
        <span>Analyzed: {stats.analyzed}/{stats.total}</span>
        <span className="thb-flagged-count">{flaggedLabel}: {stats.flagged}</span>
        <span className="thb-blocked-count">Blocked: {stats.blocked}</span>
      </div>

      <div className="thb-feed">
        {replies.map((reply, index) => (
          <div key={index} className={`thb-reply thb-reply-${reply.status}`}>
            <div className="thb-reply-header">
              <span className="thb-username">@{reply.username}</span>
              <StatusBadge status={reply.status} confidence={reply.result?.confidence} blockingMode={blockingMode} />
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
    </div>
  );
}

function StatusBadge({ status, confidence, blockingMode }: { status: ReplyData["status"]; confidence?: number; blockingMode: BlockingMode }) {
  const flaggedLabel = blockingMode === "hate" ? "Hate" : "Cult";

  const badges: Record<ReplyData["status"], { label: string; className: string }> = {
    pending: { label: "Pending", className: "thb-badge-pending" },
    analyzing: { label: "Analyzing...", className: "thb-badge-analyzing" },
    safe: { label: `Safe${confidence ? ` (${confidence}%)` : ""}`, className: "thb-badge-safe" },
    flagged: { label: `${flaggedLabel} (${confidence}%)`, className: "thb-badge-flagged" },
    blocked: { label: "Blocked", className: "thb-badge-blocked" },
    error: { label: "Error", className: "thb-badge-error" },
  };

  const badge = badges[status];

  return <span className={`thb-badge ${badge.className}`}>{badge.label}</span>;
}
