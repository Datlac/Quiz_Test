"use client"

import { useEffect, useState } from "react"
import { getAllTopics, Topic } from "@/lib/utils/topic-manager"
import { TopicCard } from "./TopicCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/lib/store/useUserStore"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link, Play, RotateCcw } from "lucide-react" // Note: Link is from lucide, but we need next/link 
// Fixing imports
import NextLink from "next/link"

export function TopicSelector() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const { mistakes } = useUserStore() // Access mistakes

  useEffect(() => {
    // Simulate loading or fetch customized topics
    const data = getAllTopics()
    setTopics(data)
    setLoading(false)
  }, [])

  if (loading) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="h-[125px] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            ))}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Review Card - Only show if mistakes exist */}
        {mistakes.length > 0 && (
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-red-700 dark:text-red-400">
                        <RotateCcw className="w-5 h-5" /> Review Mistakes
                    </CardTitle>
                    <CardDescription>
                        {mistakes.length} questions to review
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                     <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white">
                        <NextLink href="/review">
                            <Play className="w-4 h-4 mr-2" /> Start Review
                        </NextLink>
                    </Button>
                </CardFooter>
            </Card>
        )}

        {topics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
        ))}
    </div>
  )
}

