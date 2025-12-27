"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserStore } from "@/lib/store/useUserStore"
import { Calculator, Flame, Trophy, Target } from "lucide-react"

export function StatOverview() {
  const { xp, streak, totalQuizzesTaken, totalCorrect } = useUserStore()

  const stats = [
    {
        title: "Total XP",
        value: xp,
        icon: Trophy,
        color: "text-yellow-500"
    },
    {
        title: "Streak",
        value: streak,
        icon: Flame,
        color: "text-orange-500"
    },
    {
        title: "Quizzes",
        value: totalQuizzesTaken,
        icon: BookOpen, // Changed from Book to BookOpen to match import
        color: "text-blue-500"
    },
    {
        title: "Correct Answers",
        value: totalCorrect,
        icon: Target,
        color: "text-green-500"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
        </Card>
      ))}
    </div>
  )
}

import { BookOpen } from "lucide-react"
