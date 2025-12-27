"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuestionCardProps {
  questionText: string;
  type: string; // MCQ, etc.
  currentStep: number;
  totalSteps: number;
}

export function QuestionCard({ questionText, type, currentStep, totalSteps }: QuestionCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Question {currentStep} of {totalSteps}</span>
        <Badge variant="outline">{type}</Badge>
      </div>
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            {questionText}
          </h2>
        </CardContent>
      </Card>
    </div>
  )
}
