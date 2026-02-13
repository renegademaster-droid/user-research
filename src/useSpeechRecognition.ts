import { useCallback, useRef, useState } from "react";

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : undefined;

export interface UseSpeechRecognitionOptions {
  /** Called with final transcript segments (may be called multiple times in one session). */
  onResult?: (transcript: string) => void;
  /** Called when recognition stops (user or error). */
  onEnd?: () => void;
  /** Called when an error occurs. */
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { onResult, onEnd, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(
    null
  );

  const isSupported = typeof window !== "undefined" && !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setError(null);
    onEnd?.();
  }, [onEnd]);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI || !isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      stop();
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const parts: string[] = [];
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal && result[0]?.transcript) {
          parts.push(result[0].transcript.trim());
        }
      }
      const finalTranscript = parts.filter(Boolean).join(" ");
      if (finalTranscript) {
        onResult?.(finalTranscript);
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      onEnd?.();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone access was denied."
          : event.error === "no-speech"
            ? "No speech detected. Try again."
            : `Speech recognition error: ${event.error}`;
      setError(message);
      recognitionRef.current = null;
      setIsListening(false);
      onError?.(message);
      onEnd?.();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
    } catch (err) {
      setError("Could not start microphone.");
      onError?.("Could not start microphone.");
    }
  }, [isSupported, onResult, onEnd, onError, stop]);

  const toggle = useCallback(() => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  return { isSupported, isListening, error, start, stop, toggle };
}
