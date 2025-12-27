"use client"

import { Header } from "@/components/layout/Header"
import { useUserStore } from "@/lib/store/useUserStore"
import { useSettingsStore } from "@/lib/store/useSettingsStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Trophy, Medal, Flame, Speaker, Volume2, VolumeX } from "lucide-react"

export default function ProfilePage() {
  const { name, xp, level, rankTitle, streak, resetProgress } = useUserStore()
  const { soundEnabled, toggleSound } = useSettingsStore()

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      resetProgress()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-screen-lg py-8 px-4 space-y-8">
        <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">
                Manage your settings and view your achievements.
            </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center dark:bg-yellow-900/50">
                            <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{rankTitle} (Lvl {level})</h3>
                            <p className="text-muted-foreground">{xp} Total XP</p>
                        </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                         <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="font-medium">{streak} Day Streak</span>
                         </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Settings</CardTitle>
                    <CardDescription>Customize your experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="sound-mode">Sound Effects</Label>
                            <p className="text-sm text-muted-foreground">
                                Play sounds on correct/incorrect answers.
                            </p>
                        </div>
                         <div className="flex items-center gap-2">
                            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            <Switch 
                                id="sound-mode" 
                                checked={soundEnabled}
                                onCheckedChange={toggleSound}
                            />
                         </div>
                    </div>
                    <Separator />
                    <div className="pt-4">
                        <Button variant="destructive" onClick={handleReset} className="w-full">
                            Reset All Progress
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}
