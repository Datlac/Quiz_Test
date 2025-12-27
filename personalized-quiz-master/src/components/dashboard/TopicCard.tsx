"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Star, BookOpen } from "lucide-react"
import Link from "next/link"
import { Topic } from "@/lib/utils/topic-manager"
import { useUserStore } from "@/lib/store/useUserStore"
import { QuizConfigDialog } from "./QuizConfigDialog"

interface TopicCardProps {
  topic: Topic;
}

export function TopicCard({ topic }: TopicCardProps) {
  const { topicProgress } = useUserStore();
  const progress = topicProgress[topic.id];
  const mastery = progress?.masteryLevel || 0;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary group">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl line-clamp-1" title={topic.name}>
                {topic.name}
            </CardTitle>
            {topic.isCustom && <Badge variant="secondary">Custom</Badge>}
        </div>
        <CardDescription className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {topic.questionCount} Questions
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                    className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                    style={{ width: `${mastery}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{mastery}%</span>
        </div>
        {mastery === 100 && (
            <div className="flex items-center text-xs text-yellow-500 font-medium">
                <Star className="w-3 h-3 mr-1 fill-yellow-500" /> Mastered
            </div>
        )}
      </CardContent>
      <CardFooter>
        <QuizConfigDialog topic={topic}>
            <Button className="w-full group-hover:bg-primary/90">
                <Play className="w-4 h-4 mr-2" /> Start Quiz
            </Button>
        </QuizConfigDialog>
      </CardFooter>
    </Card>
  )
}

