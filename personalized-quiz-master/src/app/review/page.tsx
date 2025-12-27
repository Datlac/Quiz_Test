"use client"

import { useEffect, useState } from "react"
import { QuizEngine } from "@/components/quiz/QuizEngine"
import { Header } from "@/components/layout/Header"
import { useUserStore } from "@/lib/store/useUserStore"
import { Question } from "@/lib/types/quiz"
import questionsData from "@/data/initial-questions.json"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ReviewPage() {
  const { mistakes } = useUserStore()
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Filter questions that match the IDs in mistakes
    const mistakeIds = new Set(mistakes.map(m => m.questionId))
    const filtered = (questionsData as unknown as Question[]).filter(q => mistakeIds.has(q.id))
    
    setReviewQuestions(filtered)
    setLoading(false)
  }, [mistakes])

  if (loading) return <div>Loading...</div>

  if (reviewQuestions.length === 0) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 container max-w-screen-lg flex flex-col items-center justify-center gap-6 p-4 text-center">
                <div className="bg-green-100 p-6 rounded-full dark:bg-green-900/30">
                    <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-3xl font-bold">No Mistakes to Review!</h1>
                <p className="text-muted-foreground max-w-md">
                    Great job! You haven't made any mistakes yet, or you've cleared them all. 
                    Keep learning to maintain your streak.
                </p>
                <Button asChild size="lg">
                    <Link href="/dashboard">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                </Button>
            </main>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container max-w-screen-lg py-8 px-4">
        <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
                Review Mode 
                <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {reviewQuestions.length} questions
                </span>
            </h1>
        </div>
        
        {/* We use a specific ID for review to differentiate if needed */}
        <QuizEngine questions={reviewQuestions} topicId="review" />
      </main>
    </div>
  )
}
