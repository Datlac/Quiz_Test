"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Topic } from "@/lib/utils/topic-manager"
import { Play, Zap, Clock, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuizConfigDialogProps {
  children: React.ReactNode;
  topic: Topic;
}

export function QuizConfigDialog({ children, topic }: QuizConfigDialogProps) {
  const router = useRouter()
  const [questionCount, setQuestionCount] = useState([Math.min(10, topic.questionCount)])
  const [mode, setMode] = useState("focus")

  const handleStart = () => {
    // We pass config via query params
    const query = new URLSearchParams({
        count: questionCount[0].toString(),
        mode: mode
    }).toString()
    
    router.push(`/quiz/${encodeURIComponent(topic.id)}?${query}`)
  }

  // Calculate estimated time (assuming 1 min per question for Focus, 30s for Speed)
  const timePerQ = mode === "speed" ? 0.5 : 1
  const estTime = Math.ceil(questionCount[0] * timePerQ)

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup Quiz: {topic.name}</DialogTitle>
          <DialogDescription>
            Customize your session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <Tabs defaultValue="focus" onValueChange={setMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="focus">Focus</TabsTrigger>
              <TabsTrigger value="speed">Speed</TabsTrigger>
            </TabsList>
            <TabsContent value="focus" className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>Standard mode. No time pressure. Instant explanation.</span>
                </div>
            </TabsContent>
            <TabsContent value="speed" className="space-y-2 mt-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-md">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Speed run! Timer counts up. 30s target per question.</span>
                </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div className="flex justify-between">
                <Label>Number of Questions</Label>
                <span className="font-bold text-primary">{questionCount[0]}</span>
            </div>
            <Slider 
                defaultValue={[Math.min(10, topic.questionCount)]} 
                max={topic.questionCount} 
                min={1} 
                step={1} 
                onValueChange={setQuestionCount}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>{topic.questionCount} (All)</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm bg-secondary/50 p-3 rounded-lg">
             <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Est. Time:</span>
             </div>
             <span className="font-mono font-bold">{estTime} min</span>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleStart} className="w-full">
            <Play className="w-4 h-4 mr-2" /> Start Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
