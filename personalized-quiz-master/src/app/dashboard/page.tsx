import { Header } from "@/components/layout/Header";
import { TopicSelector } from "@/components/dashboard/TopicSelector";
import { StatOverview } from "@/components/dashboard/StatOverview";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-screen-2xl py-8 px-4 space-y-8">
        <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
                Track your progress and choose a topic to start learning.
            </p>
        </div>

        <StatOverview />
        
        <Separator />
        
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold tracking-tight">Available Topics</h2>
            <TopicSelector />
        </div>
      </main>
    </div>
  );
}
