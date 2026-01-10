import type { ReplyData } from "./index";

interface LiveFeedPanelProps {
  replies: ReplyData[];
  isScanning: boolean;
  onClose: () => void;
}

export function LiveFeedPanel({ replies, isScanning, onClose }: LiveFeedPanelProps) {
  if (replies.length === 0 && !isScanning) {
    return null;
  }

  const stats = {
    total: replies.length,
    analyzed: replies.filter((r) => r.status !== "pending" && r.status !== "analyzing").length,
    hate: replies.filter((r) => r.status === "hate" || r.status === "blocked").length,
    blocked: replies.filter((r) => r.status === "blocked").length,
  };

  return (
    <div className="thb-panel">
      <div className="thb-panel-header">
        <h3>Scan Results</h3>
        <button className="thb-close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      <div className="thb-stats">
        <span>Analyzed: {stats.analyzed}/{stats.total}</span>
        <span className="thb-hate-count">Hate: {stats.hate}</span>
        <span className="thb-blocked-count">Blocked: {stats.blocked}</span>
      </div>

      <div className="thb-feed">
        {replies.map((reply, index) => (
          <div key={index} className={`thb-reply thb-reply-${reply.status}`}>
            <div className="thb-reply-header">
              <span className="thb-username">@{reply.username}</span>
              <StatusBadge status={reply.status} confidence={reply.result?.confidence} />
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

function StatusBadge({ status, confidence }: { status: ReplyData["status"]; confidence?: number }) {
  const badges: Record<ReplyData["status"], { label: string; className: string }> = {
    pending: { label: "Pending", className: "thb-badge-pending" },
    analyzing: { label: "Analyzing...", className: "thb-badge-analyzing" },
    safe: { label: `Safe${confidence ? ` (${confidence}%)` : ""}`, className: "thb-badge-safe" },
    hate: { label: `Hate (${confidence}%)`, className: "thb-badge-hate" },
    blocked: { label: "Blocked", className: "thb-badge-blocked" },
    error: { label: "Error", className: "thb-badge-error" },
  };

  const badge = badges[status];

  return <span className={`thb-badge ${badge.className}`}>{badge.label}</span>;
}
