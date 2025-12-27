"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useQuizStore } from "@/lib/store/useQuizStore"
import { useUserStore } from "@/lib/store/useUserStore"
import { Question } from "@/lib/types/quiz"
import { QuestionCard } from "./QuestionCard"
import { OptionItem } from "./OptionItem"
import { Timer } from "./Timer"
import { ResultSummary } from "./ResultSummary"
import { ArrowRight, Trophy } from "lucide-react"
import { toast } from "sonner" // Assuming installed via shadcn
import { useSoundEffects } from "@/hooks/useSoundEffects"

interface QuizEngineProps {
  questions: Question[];
  topicId: string;
}

export function QuizEngine({ questions: initialQuestions, topicId }: QuizEngineProps) {
  const router = useRouter()
  const { playSound } = useSoundEffects()
  const { 
    questions, 
    currentQuestionIndex, 
    startQuiz, 
    answerQuestion, 
    nextQuestion, 
    isFinished,
    score
  } = useQuizStore()

  const { recordMistake, updateTopicProgress, updateStreak } = useUserStore()
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)

  // Initialize quiz on mount
  useEffect(() => {
    if (initialQuestions.length > 0) {
        startQuiz(initialQuestions)
    }
  }, [initialQuestions, startQuiz])

  const currentQuestion = questions[currentQuestionIndex]

  if (!currentQuestion && !isFinished) return <div>Loading quiz...</div>
  
  if (isFinished) {
    return <ResultSummary topicId={topicId} />
  }

  const handleSelectOption = (index: number) => {
    if (isAnswered) return
    
    setSelectedOption(index)
    setIsAnswered(true)
    
    const isCorrect = index === currentQuestion.a
    
    // Update Stores
    answerQuestion(currentQuestion.id, index) // Note: store might need update to handle correction check logic internally if desired, currently it just stores selection.
    
    // We update User stats immediately for instant feedback feeling
    updateTopicProgress(topicId, isCorrect)
    updateStreak(isCorrect)
    
    if (isCorrect) {
        playSound('correct')
        // Play sound (future)
        toast.success("Correct!", { position: "bottom-center", duration: 1000 })
        // Clear from mistakes if it was there
        useUserStore.getState().clearMistake(currentQuestion.id)
    } else {
        playSound('incorrect')
        recordMistake(currentQuestion.id)
        toast.error("Incorrect", { position: "bottom-center", duration: 1000 })
    }

    // Auto Advance after delay
    setTimeout(() => {
        handleNext()
    }, 1500)
  }

  const handleNext = () => {
    nextQuestion()
    setSelectedOption(null)
    setIsAnswered(false)
  }

  const progress = ((currentQuestionIndex) / questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Top Bar: Progress & Timer */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Progress</span>
            <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-primary">Score: {score}</span>
                <Timer isRunning={!isAnswered} />
            </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Area */}
      <div className="min-h-[200px] flex items-center justify-center py-6">
        <QuestionCard 
            questionText={currentQuestion.q} 
            type={currentQuestion.type}
            currentStep={currentQuestionIndex + 1}
            totalSteps={questions.length}
        />
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.options.map((option, idx) => (
            <OptionItem
                key={idx}
                index={idx}
                option={option}
                isSelected={selectedOption === idx}
                isAnswered={isAnswered}
                isCorrect={idx === currentQuestion.a}
                isTargetCorrect={idx === currentQuestion.a}
                onSelect={() => handleSelectOption(idx)}
            />
        ))}
      </div>

      {/* Explanation (revealed after answer) */}
      {isAnswered && currentQuestion.explanation && (
        <div className="bg-muted p-4 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <p className="font-semibold text-sm text-foreground/80">Explanation:</p>
            <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Manual Next Button (optional, mostly for accessibility or if auto-advance is disabled) */}
       {isAnswered && (
        <div className="flex justify-end pt-4">
            <Button onClick={handleNext} className="gap-2">
                Next Question <ArrowRight className="w-4 h-4" />
            </Button>
        </div>
      )}
    </div>
  )
}
