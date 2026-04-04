import { t } from "@/lib/i18n";

interface OnboardingOverlayProps {
  onContinue: () => void;
}

export function OnboardingOverlay({ onContinue }: OnboardingOverlayProps) {
  return (
    <div className="thb-onboarding-overlay">
      <div className="thb-onboarding-card">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="thb-onboarding-icon">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14.59l-3.29-3.3 1.42-1.42L11 13.76l4.88-4.88 1.42 1.42L11 16.59z" />
        </svg>
        <p className="thb-onboarding-text">{t("onboardingText")}</p>
        <button className="thb-onboarding-btn" onClick={onContinue}>
          {t("continue")}
        </button>
      </div>
    </div>
  );
}
