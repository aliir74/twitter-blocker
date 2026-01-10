interface FloatingButtonProps {
  onClick: () => void;
  isScanning: boolean;
}

export function FloatingButton({ onClick, isScanning }: FloatingButtonProps) {
  return (
    <button
      className="thb-floating-button"
      onClick={onClick}
      disabled={isScanning}
    >
      {isScanning ? (
        <>
          <span className="thb-spinner"></span>
          Scanning...
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.59l-3.29-3.3 1.42-1.42L11 13.76l4.88-4.88 1.42 1.42L11 16.59z" />
          </svg>
          Scan Replies
        </>
      )}
    </button>
  );
}
