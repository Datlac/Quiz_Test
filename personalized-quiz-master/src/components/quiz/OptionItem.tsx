"use client"

import { cn } from "@/lib/utils"
// Note: We'll use framer-motion for animations later
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"

interface OptionItemProps {
  option: string;
  index: number;
  isSelected: boolean;
  isAnswered: boolean;
  isCorrect?: boolean; // Valid only if answered
  isTargetCorrect?: boolean; // If this specific option is the correct one
  onSelect: () => void;
}

export function OptionItem({
  option,
  index,
  isSelected,
  isAnswered,
  isCorrect,
  isTargetCorrect,
  onSelect
}: OptionItemProps) {
  let variantClass = "border-muted bg-card hover:bg-accent/50 hover:border-primary/50"
  let icon = null

  if (isAnswered) {
    if (isSelected) {
      if (isCorrect) {
        variantClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
        icon = <Check className="w-5 h-5 text-green-500" />
      } else {
        variantClass = "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
        icon = <X className="w-5 h-5 text-red-500" />
      }
    } else if (isTargetCorrect) {
        variantClass = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 opacity-70"
        icon = <Check className="w-5 h-5 text-green-500" />
    } else {
        variantClass = "opacity-50"
    }
  } else if (isSelected) {
     variantClass = "border-primary bg-primary/10 ring-1 ring-primary"
  }

  return (
    <motion.button
      whileHover={!isAnswered ? { scale: 1.01 } : {}}
      whileTap={!isAnswered ? { scale: 0.99 } : {}}
      onClick={onSelect}
      disabled={isAnswered}
      className={cn(
        "relative w-full p-4 text-left rounded-xl border-2 transition-all duration-200 flex items-center justify-between",
        variantClass
      )}
    >
      <span className="font-medium mr-4 flex items-center">
        <span className="w-6 h-6 rounded-full border border-current mr-3 flex items-center justify-center text-xs opacity-70">
            {String.fromCharCode(65 + index)}
        </span>
        {option}
      </span>
      {icon}
    </motion.button>
  )
}
