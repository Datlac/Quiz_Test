"use client"

import { useSettingsStore } from "@/lib/store/useSettingsStore";
import { useCallback } from "react";

// Simple oscillator beep for "correct" (high pitch) and "incorrect" (low pitch)
// This avoids needing external MP3 files and works instantly.
export function useSoundEffects() {
  const { soundEnabled } = useSettingsStore();

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'click') => {
    if (!soundEnabled) return;

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'correct') {
            // High happy ding
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.3);
        } else if (type === 'incorrect') {
            // Low error buzz
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.2);
        } else if (type === 'click') {
            // Subtle click
             oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.05);
        }

    } catch (e) {
        console.error("Audio playback failed", e);
    }
  }, [soundEnabled]);

  return { playSound };
}
