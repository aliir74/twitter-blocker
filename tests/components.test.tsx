import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FloatingButton } from "../entrypoints/twitter.content/FloatingButton";
import { LiveFeedPanel } from "../entrypoints/twitter.content/LiveFeedPanel";
import type { ReplyData } from "../entrypoints/twitter.content/index";

describe("FloatingButton", () => {
  it("should render scan button when not scanning", () => {
    render(<FloatingButton onClick={() => {}} isScanning={false} />);

    expect(screen.getByText("Scan Replies")).toBeInTheDocument();
  });

  it("should render scanning state when scanning", () => {
    render(<FloatingButton onClick={() => {}} isScanning={true} />);

    expect(screen.getByText("Scanning...")).toBeInTheDocument();
  });

  it("should be disabled when scanning", () => {
    render(<FloatingButton onClick={() => {}} isScanning={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should call onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<FloatingButton onClick={handleClick} isScanning={false} />);

    fireEvent.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe("LiveFeedPanel", () => {
  const mockReplies: ReplyData[] = [
    {
      element: document.createElement("div"),
      username: "user1",
      text: "This is a safe reply",
      status: "safe",
      result: { isMatch: false, confidence: 10, reason: "Normal content" },
    },
    {
      element: document.createElement("div"),
      username: "user2",
      text: "This is hate speech",
      status: "flagged",
      result: { isMatch: true, confidence: 95, reason: "Contains slur" },
    },
    {
      element: document.createElement("div"),
      username: "user3",
      text: "Blocked user",
      status: "blocked",
      result: { isMatch: true, confidence: 88, reason: "Threat detected" },
    },
  ];

  it("should not render when no replies and not scanning", () => {
    const { container } = render(
      <LiveFeedPanel replies={[]} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render panel with replies", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    expect(screen.getByText("Scan Results (Hate Speech)")).toBeInTheDocument();
    expect(screen.getByText("@user1")).toBeInTheDocument();
    expect(screen.getByText("@user2")).toBeInTheDocument();
    expect(screen.getByText("@user3")).toBeInTheDocument();
  });

  it("should display correct stats", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    expect(screen.getByText("Analyzed: 3/3")).toBeInTheDocument();
    expect(screen.getByText("Hate: 2")).toBeInTheDocument();
    expect(screen.getByText("Blocked: 1")).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={handleClose} blockingMode="hate" actionMode="block" />
    );

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("should show status badges correctly", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    expect(screen.getByText(/Safe/)).toBeInTheDocument();
    expect(screen.getByText(/Hate \(95%\)/)).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });

  it("should show reason for hate content", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    expect(screen.getByText("Contains slur")).toBeInTheDocument();
    expect(screen.getByText("Threat detected")).toBeInTheDocument();
  });

  it("should truncate long reply text", () => {
    const longReply: ReplyData = {
      element: document.createElement("div"),
      username: "longuser",
      text: "A".repeat(150),
      status: "safe",
      result: { isMatch: false, confidence: 5, reason: "Safe" },
    };

    render(
      <LiveFeedPanel replies={[longReply]} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="block" />
    );

    const truncatedText = screen.getByText(/A{100}\.\.\./);
    expect(truncatedText).toBeInTheDocument();
  });

  it("should show cult praise labels when in cultPraise mode", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} blockingMode="cultPraise" actionMode="block" />
    );

    expect(screen.getByText("Scan Results (Cult Praise)")).toBeInTheDocument();
    expect(screen.getByText("Cult: 2")).toBeInTheDocument();
    expect(screen.getByText(/Cult \(95%\)/)).toBeInTheDocument();
  });

  it("should show reported status badge", () => {
    const reportedReplies: ReplyData[] = [
      {
        element: document.createElement("div"),
        username: "reported_user",
        text: "Some hateful content",
        status: "reported",
        result: { isMatch: true, confidence: 92, reason: "Hateful content" },
      },
    ];

    render(
      <LiveFeedPanel replies={reportedReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="report" />
    );

    expect(screen.getByText("Reported")).toBeInTheDocument();
    expect(screen.getByText("Reported: 1")).toBeInTheDocument();
  });

  it("should show actioned status badge", () => {
    const actionedReplies: ReplyData[] = [
      {
        element: document.createElement("div"),
        username: "actioned_user",
        text: "Some hateful content",
        status: "actioned",
        result: { isMatch: true, confidence: 95, reason: "Hateful content" },
      },
    ];

    render(
      <LiveFeedPanel replies={actionedReplies} isScanning={false} onClose={() => {}} blockingMode="hate" actionMode="both" />
    );

    expect(screen.getByText("Blocked & Reported")).toBeInTheDocument();
    expect(screen.getByText("Blocked: 1")).toBeInTheDocument();
    expect(screen.getByText("Reported: 1")).toBeInTheDocument();
  });
});
