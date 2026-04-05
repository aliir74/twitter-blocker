import type { BlockingMode, ActionMode } from "@/lib/storage";
import { t } from "@/lib/i18n";

interface FloatingButtonProps {
  onClick: () => void;
  isScanning: boolean;
  dryRun?: boolean;
  blockingMode?: BlockingMode;
  actionMode?: ActionMode;
}

export function FloatingButton({ onClick, isScanning, dryRun, blockingMode, actionMode }: FloatingButtonProps) {
  const isBlockAll = blockingMode === "blockAll";

  function getBlockAllLabel() {
    if (actionMode === "report") return t("reportAll");
    if (actionMode === "both") return t("blockReportAll");
    return t("blockAll");
  }

  function getScanningLabel() {
    if (isBlockAll) {
      if (actionMode === "report") return t("reportingAll");
      if (actionMode === "both") return t("blockingReportingAll");
      return t("blockingAll");
    }
    return t("scanning");
  }

  return (
    <button
      className={`thb-floating-button${dryRun ? " thb-dry-run" : ""}${isBlockAll ? " thb-block-all" : ""}`}
      onClick={onClick}
      disabled={isScanning}
    >
      {isScanning ? (
        <>
          <span className="thb-spinner"></span>
          {getScanningLabel()}{dryRun ? ` (${t("dryRun")})` : ""}...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {isBlockAll ? (
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
            ) : (
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.59l-3.29-3.3 1.42-1.42L11 13.76l4.88-4.88 1.42 1.42L11 16.59z" />
            )}
          </svg>
          {isBlockAll ? getBlockAllLabel() : t("scanReplies")}{dryRun ? ` (${t("dryRun")})` : ""}
        </>
      )}
    </button>
  );
}
