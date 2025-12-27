import { getQuestionsByTopic } from "@/lib/utils/topic-manager";
import { QuizEngine } from "@/components/quiz/QuizEngine";
import { Header } from "@/components/layout/Header";
import { notFound } from "next/navigation";

// Define Page Props
interface PageProps {
  params: {
    topic: string;
  };
}

// Next.js 14 requires `params` to be awaited in async components in some versions or handled specifically.
// In standard App Router, params is an object.
export default function QuizPage({ params }: PageProps) {
  const topicId = decodeURIComponent(params.topic);
  const questions = getQuestionsByTopic(topicId);

  if (!questions || questions.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Topic Not Found</h1>
            <p>We couldn't find any questions for "{topicId}".</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container max-w-screen-lg py-8 px-4">
        <QuizEngine questions={questions} topicId={topicId} />
      </main>
    </div>
  );
}
