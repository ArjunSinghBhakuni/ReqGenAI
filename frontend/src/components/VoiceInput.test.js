import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceInput from "./VoiceInput";

// Mock the Web Speech API
const mockRecognition = {
  continuous: false,
  interimResults: false,
  lang: "en-US",
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onend: null,
  onerror: null,
  onstart: null,
};

// Mock window.SpeechRecognition
Object.defineProperty(window, "SpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: jest.fn(() => mockRecognition),
});

describe("VoiceInput Component", () => {
  const mockOnTranscriptChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders voice input component", () => {
    render(<VoiceInput onTranscriptChange={mockOnTranscriptChange} />);

    expect(screen.getByText("Start Recording")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        /Your voice will be transcribed here automatically/
      )
    ).toBeInTheDocument();
  });

  test("shows browser not supported message when SpeechRecognition is not available", () => {
    // Remove SpeechRecognition from window
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    render(<VoiceInput onTranscriptChange={mockOnTranscriptChange} />);

    expect(screen.getByText("Voice Input Not Supported")).toBeInTheDocument();
  });

  test("calls onTranscriptChange when transcript is updated", () => {
    render(<VoiceInput onTranscriptChange={mockOnTranscriptChange} />);

    const textarea = screen.getByPlaceholderText(
      /Your voice will be transcribed here automatically/
    );
    fireEvent.change(textarea, { target: { value: "Test transcript" } });

    expect(mockOnTranscriptChange).toHaveBeenCalledWith("Test transcript");
  });

  test("start recording button calls recognition.start", () => {
    render(<VoiceInput onTranscriptChange={mockOnTranscriptChange} />);

    const startButton = screen.getByText("Start Recording");
    fireEvent.click(startButton);

    expect(mockRecognition.start).toHaveBeenCalled();
  });

  test("clear button resets transcript", () => {
    render(
      <VoiceInput
        onTranscriptChange={mockOnTranscriptChange}
        initialValue="Initial text"
      />
    );

    const clearButton = screen.getByText("Clear");
    fireEvent.click(clearButton);

    expect(mockOnTranscriptChange).toHaveBeenCalledWith("");
  });
});
