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
      result: { isHate: false, confidence: 10, reason: "Normal content" },
    },
    {
      element: document.createElement("div"),
      username: "user2",
      text: "This is hate speech",
      status: "hate",
      result: { isHate: true, confidence: 95, reason: "Contains slur" },
    },
    {
      element: document.createElement("div"),
      username: "user3",
      text: "Blocked user",
      status: "blocked",
      result: { isHate: true, confidence: 88, reason: "Threat detected" },
    },
  ];

  it("should not render when no replies and not scanning", () => {
    const { container } = render(
      <LiveFeedPanel replies={[]} isScanning={false} onClose={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render panel with replies", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} />
    );

    expect(screen.getByText("Scan Results")).toBeInTheDocument();
    expect(screen.getByText("@user1")).toBeInTheDocument();
    expect(screen.getByText("@user2")).toBeInTheDocument();
    expect(screen.getByText("@user3")).toBeInTheDocument();
  });

  it("should display correct stats", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} />
    );

    expect(screen.getByText("Analyzed: 3/3")).toBeInTheDocument();
    expect(screen.getByText("Hate: 2")).toBeInTheDocument();
    expect(screen.getByText("Blocked: 1")).toBeInTheDocument();
  });

  it("should call onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={handleClose} />
    );

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("should show status badges correctly", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} />
    );

    expect(screen.getByText(/Safe/)).toBeInTheDocument();
    expect(screen.getByText(/Hate \(95%\)/)).toBeInTheDocument();
    expect(screen.getByText("Blocked")).toBeInTheDocument();
  });

  it("should show reason for hate content", () => {
    render(
      <LiveFeedPanel replies={mockReplies} isScanning={false} onClose={() => {}} />
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
      result: { isHate: false, confidence: 5, reason: "Safe" },
    };

    render(
      <LiveFeedPanel replies={[longReply]} isScanning={false} onClose={() => {}} />
    );

    const truncatedText = screen.getByText(/A{100}\.\.\./);
    expect(truncatedText).toBeInTheDocument();
  });
});
