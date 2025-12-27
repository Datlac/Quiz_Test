"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuizStore } from "@/lib/store/useQuizStore"
import { useUserStore } from "@/lib/store/useUserStore"
import { Trophy, RefreshCcw, Home } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { calculateXp } from "@/lib/utils/scoring"

export function ResultSummary({ topicId }: { topicId: string }) {
  const { score, questions, resetQuiz } = useQuizStore()
  const { addXp, updateTopicProgress } = useUserStore()
  
  const total = questions.length
  const percentage = Math.round((score / total) * 100)
  
  const xpEarned = calculateXp(score, total)

  // Use Effect to save progress ONLY ONCE when component mounts
  useEffect(() => {
    addXp(xpEarned)
    // We assume every answer was tracked in store, but here we simplify topic mastery update
    //Ideally updateTopicProgress should be called incrementally or we calculate it here.
    // Let's rely on the store having updated streak/mistakes during the quiz, 
    // here we just update the general "Mastery" stats if needed or just trust the per-question updates.
    // Actually, `updateTopicProgress` in `useUserStore` increments total/correct count.
    // It's better to call it per question. If we didn't, we'd do it here. 
    // For now, let's assume `QuizEngine` called it per question.
  }, []) 

  return (
    <div className="container max-w-lg pt-20">
      <Card className="text-center border-2">
        <CardHeader>
          <div className="mx-auto bg-yellow-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 dark:bg-yellow-900/50">
            <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-3xl">Quiz Complete!</CardTitle>
          <p className="text-muted-foreground">You scored</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-5xl font-extrabold text-primary">
            {score} <span className="text-2xl text-muted-foreground font-normal">/ {total}</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span>{percentage}%</span>
            </div>
             <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out" 
                    style={{ width: `${percentage}%` }}
                />
            </div>
          </div>

          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="font-semibold text-lg">+{xpEarned} XP Earned</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="w-full" onClick={resetQuiz} asChild>
                <Link href="/dashboard">
                    <Home className="w-4 h-4 mr-2" /> Dashboard
                </Link>
            </Button>
            <Button className="w-full" onClick={() => window.location.reload()}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
