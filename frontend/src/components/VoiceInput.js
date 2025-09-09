import React, { useState, useEffect, useRef } from "react";

const VoiceInput = ({ onTranscriptChange, initialValue = "" }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition settings
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      // Handle recognition results
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Only add final results to the transcript, not interim results
        if (finalTranscript) {
          setTranscript((prevTranscript) => {
            const newTranscript = prevTranscript + finalTranscript;
            // Use setTimeout to avoid setState during render
            setTimeout(() => onTranscriptChange(newTranscript), 0);
            return newTranscript;
          });
        }
      };

      // Handle recognition end
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsListening(false);
      };

      // Handle recognition errors
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setIsListening(false);
      };

      // Handle recognition start
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };
    } else {
      setIsSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari."
      );
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [onTranscriptChange]);

  const startRecording = () => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      setRecordingDuration(0);
      recognitionRef.current.start();

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start voice recording. Please try again.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsRecording(false);
    setIsListening(false);
  };

  const clearTranscript = () => {
    setTranscript("");
    onTranscriptChange("");
  };

  const handleManualEdit = (e) => {
    const newTranscript = e.target.value;
    setTranscript(newTranscript);
    onTranscriptChange(newTranscript);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isSupported) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center">
          <div className="text-red-500 mr-2">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Voice Input Not Supported
            </h3>
            <p className="text-sm text-red-600 mt-1">
              Your browser doesn't support speech recognition. Please use
              Chrome, Edge, or Safari for voice input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Controls */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isSupported}
          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          } ${!isSupported ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isRecording ? (
            <>
              <div className="w-3 h-3 bg-white rounded-full mr-2 animate-pulse"></div>
              Stop Recording
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              Start Recording
            </>
          )}
        </button>

        {transcript && (
          <button
            type="button"
            onClick={clearTranscript}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status Indicators */}
      {isListening && (
        <div className="flex items-center justify-between text-blue-600">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm">Listening... Speak now</span>
          </div>
          {recordingDuration > 0 && (
            <div className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">
              {formatDuration(recordingDuration)}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Transcript Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Voice Transcript *
        </label>
        <textarea
          value={transcript}
          onChange={handleManualEdit}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your voice will be transcribed here automatically, or you can type directly..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Tip: You can edit the transcript manually after recording, or type
          directly in this field.
        </p>
      </div>

      {/* Recording Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-1">
          Recording Tips:
        </h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Speak clearly and at a moderate pace</li>
          <li>• Minimize background noise for better accuracy</li>
          <li>• Click "Stop Recording" when you're finished speaking</li>
          <li>• You can record for as long as you need</li>
          <li>• You can edit the transcript after recording</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceInput;
