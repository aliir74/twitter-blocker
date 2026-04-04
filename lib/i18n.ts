import type { Locale } from "./storage";

const strings = {
  en: {
    // Floating button
    scanReplies: "Scan Replies",
    scanning: "Scanning",
    blockAll: "Block All",
    reportAll: "Report All",
    blockReportAll: "Block & Report All",
    blockingAll: "Blocking All",
    reportingAll: "Reporting All",
    blockingReportingAll: "Blocking & Reporting All",
    dryRun: "Dry Run",

    // Panel
    scanResults: "Scan Results",
    hateMode: "Hate Speech",
    cultMode: "Cult Praise",
    blockAllMode: "Block All",
    analyzed: "Analyzed",
    hate: "Hate",
    cult: "Cult",
    queued: "Queued",
    blocked: "Blocked",
    reported: "Reported",
    copyStats: "Copy Stats",
    statsCopied: "Copied!",

    // Status badges
    pending: "Pending",
    analyzing: "Analyzing...",
    processing: "Processing...",
    safe: "Safe",
    flagged: "Flagged",
    blockedBadge: "Blocked",
    reportedBadge: "Reported",
    blockedReported: "Blocked & Reported",
    error: "Error",

    // Popup settings
    title: "Twitter Hate Blocker",
    blockingMode: "Blocking Mode",
    hateSpeech: "Hate Speech",
    hateSpeechHint: "Block offensive language and harassment",
    cultPraise: "Cult Praise",
    cultPraiseHint: "Block sycophantic, cult-like devotion",
    blockAllHint: "Blocks EVERY account on the page - use with caution!",
    actionMode: "Action Mode",
    blockOnly: "Block Only",
    blockOnlyHint: "Block flagged accounts",
    reportOnly: "Report Only",
    reportOnlyHint: "Report flagged accounts for hateful content",
    blockAndReport: "Block & Report",
    blockAndReportHint: "Report first, then block flagged accounts",
    maxReplies: "Max Replies to Scan",
    replies: "replies",
    autoScroll: "Enable auto-scroll to find more replies",
    dryRunMode: "Dry-run mode (analyze only, don't",
    report: "report",
    blockOrReport: "block or report",
    block: "block",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved!",
    language: "Language",
    scansUsedToday: "scans used today",

    // Onboarding
    onboardingText: "This will scan replies and block hateful accounts for you.",
    continue: "Continue",

    // Block All confirmation
    blockAllWarning: "WARNING: Block All mode is enabled",
    blockAllConfirm: "This will",
    identify: "identify",
    everyAccount: "EVERY account found on this page",
    upTo: "up to",
    accounts: "accounts",
    areYouSure: "Are you sure you want to continue?",

    // Stats sharing
    statsScanned: "replies scanned",
    statsBlocked: "accounts blocked",
    statsReported: "accounts reported",
  },
  fa: {
    // Floating button
    scanReplies: "اسکن ریپلای‌ها",
    scanning: "در حال اسکن",
    blockAll: "بلاک همه",
    reportAll: "ریپورت همه",
    blockReportAll: "بلاک و ریپورت همه",
    blockingAll: "در حال بلاک همه",
    reportingAll: "در حال ریپورت همه",
    blockingReportingAll: "در حال بلاک و ریپورت همه",
    dryRun: "حالت آزمایشی",

    // Panel
    scanResults: "نتایج اسکن",
    hateMode: "نفرت‌پراکنی",
    cultMode: "تملق فرقه‌ای",
    blockAllMode: "بلاک همه",
    analyzed: "بررسی شده",
    hate: "نفرت",
    cult: "تملق",
    queued: "در صف",
    blocked: "بلاک شده",
    reported: "ریپورت شده",
    copyStats: "کپی آمار",
    statsCopied: "!کپی شد",

    // Status badges
    pending: "در انتظار",
    analyzing: "...در حال بررسی",
    processing: "...در حال پردازش",
    safe: "سالم",
    flagged: "پرچم‌گذاری",
    blockedBadge: "بلاک شده",
    reportedBadge: "ریپورت شده",
    blockedReported: "بلاک و ریپورت شده",
    error: "خطا",

    // Popup settings
    title: "پاک‌کن توییتر",
    blockingMode: "حالت بلاک",
    hateSpeech: "نفرت‌پراکنی",
    hateSpeechHint: "بلاک زبان توهین‌آمیز و آزاردهنده",
    cultPraise: "تملق فرقه‌ای",
    cultPraiseHint: "بلاک تعریف و تمجید افراطی",
    blockAllHint: "!همه اکانت‌های صفحه را بلاک می‌کند - با احتیاط استفاده کنید",
    actionMode: "نوع اقدام",
    blockOnly: "فقط بلاک",
    blockOnlyHint: "بلاک اکانت‌های پرچم‌گذاری شده",
    reportOnly: "فقط ریپورت",
    reportOnlyHint: "ریپورت اکانت‌های پرچم‌گذاری شده",
    blockAndReport: "بلاک و ریپورت",
    blockAndReportHint: "اول ریپورت، بعد بلاک اکانت‌ها",
    maxReplies: "حداکثر ریپلای برای اسکن",
    replies: "ریپلای",
    autoScroll: "اسکرول خودکار برای پیدا کردن ریپلای‌های بیشتر",
    dryRunMode: "حالت آزمایشی (فقط بررسی، بدون",
    report: "ریپورت",
    blockOrReport: "بلاک یا ریپورت",
    block: "بلاک",
    saveSettings: "ذخیره تنظیمات",
    settingsSaved: "!تنظیمات ذخیره شد",
    language: "زبان",
    scansUsedToday: "اسکن استفاده شده امروز",

    // Onboarding
    onboardingText: "این ابزار ریپلای‌ها را اسکن کرده و اکانت‌های نفرت‌پراکن را برای شما بلاک می‌کند.",
    continue: "ادامه",

    // Block All confirmation
    blockAllWarning: "هشدار: حالت بلاک همه فعال است",
    blockAllConfirm: "این عمل",
    identify: "شناسایی می‌کند",
    everyAccount: "همه اکانت‌های موجود در این صفحه را",
    upTo: "تا",
    accounts: "اکانت",
    areYouSure: "آیا مطمئن هستید که می‌خواهید ادامه دهید؟",

    // Stats sharing
    statsScanned: "ریپلای اسکن شد",
    statsBlocked: "اکانت بلاک شد",
    statsReported: "اکانت ریپورت شد",
  },
} as const;

export type I18nStrings = typeof strings.en;

let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: keyof I18nStrings): string {
  return strings[currentLocale][key] || strings.en[key];
}

export function detectLocale(): Locale {
  return navigator.language.startsWith("fa") ? "fa" : "en";
}

export function formatStats(scanned: number, blocked: number, reported: number, locale: Locale): string {
  if (locale === "fa") {
    let text = `${scanned} ${strings.fa.statsScanned}`;
    if (blocked > 0) text += `، ${blocked} ${strings.fa.statsBlocked}`;
    if (reported > 0) text += `، ${reported} ${strings.fa.statsReported}`;
    return text + " \u{1F6E1}\uFE0F\n#\u067E\u0627\u06A9\u200C\u06A9\u0646_\u062A\u0648\u06CC\u06CC\u062A\u0631";
  }
  let text = `${scanned} ${strings.en.statsScanned}`;
  if (blocked > 0) text += `, ${blocked} ${strings.en.statsBlocked}`;
  if (reported > 0) text += `, ${reported} ${strings.en.statsReported}`;
  return text + " \u{1F6E1}\uFE0F\n#TwitterHateBlocker";
}
