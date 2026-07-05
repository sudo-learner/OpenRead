"use client";

import { useEffect, useRef, useState } from "react";

export default function TextToSpeech({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    // Stop reading if the page changes or component unmounts.
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [text]);

  function play() {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setState("idle");
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setState("playing");
  }

  function pause() {
    window.speechSynthesis.pause();
    setState("paused");
  }

  function resume() {
    window.speechSynthesis.resume();
    setState("playing");
  }

  function stop() {
    window.speechSynthesis.cancel();
    setState("idle");
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {state === "idle" && (
        <button onClick={play} className="px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/5">
          🔊 Listen to this page
        </button>
      )}
      {state === "playing" && (
        <>
          <button onClick={pause} className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary">
            ⏸ Pause
          </button>
          <button onClick={stop} className="px-3 py-1.5 rounded-lg border border-white/20">
            ⏹ Stop
          </button>
        </>
      )}
      {state === "paused" && (
        <>
          <button onClick={resume} className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary">
            ▶ Resume
          </button>
          <button onClick={stop} className="px-3 py-1.5 rounded-lg border border-white/20">
            ⏹ Stop
          </button>
        </>
      )}
    </div>
  );
}
