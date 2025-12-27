"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"

interface TimerProps {
  isRunning: boolean;
  onTimeUp?: () => void;
  duration?: number; // Not enforced per question in Focus mode usually, but good for Speed mode
}

export function Timer({ isRunning }: TimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (totalSeconds: number) => {
    const min = Math.floor(totalSeconds / 60)
    const sec = totalSeconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center space-x-2 text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full border border-border/50">
      <Clock className="w-4 h-4" />
      <span className="font-mono font-medium">{formatTime(seconds)}</span>
    </div>
  )
}
