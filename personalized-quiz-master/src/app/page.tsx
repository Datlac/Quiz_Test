import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Clock, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
            <div className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium">
              Reinforce your knowledge
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Personalized Quiz Master
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              A modern, adaptive learning platform designed to help you master topics faster through personalized quizzes and instant feedback.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/dashboard">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="https://github.com/Datlac/Quiz_Test" target="_blank">
                  View GitHub
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
              Features
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Everything you need to improve your learning efficiency.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Zap className="h-12 w-12 text-yellow-500" />
                <div className="space-y-2">
                  <h3 className="font-bold">Focus Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    Distraction-free interface designed for deep learning.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Clock className="h-12 w-12 text-blue-500" />
                <div className="space-y-2">
                  <h3 className="font-bold">Speed Runs</h3>
                  <p className="text-sm text-muted-foreground">
                    Test your reflexes with time-limited challenges.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-2">
              <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <BookOpen className="h-12 w-12 text-green-500" />
                <div className="space-y-2">
                  <h3 className="font-bold">Smart Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically track and retry questions you missed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
