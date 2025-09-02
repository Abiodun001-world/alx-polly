import { PollVote } from "@/components/polls/poll-vote";
import { PollResults } from "@/components/polls/poll-results";

interface PollPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PollPage({ params }: PollPageProps) {
  const { id } = await params;
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Sample Poll Question
        </h1>
        <p className="text-gray-600 mb-6">
          This is a sample poll description that explains what the poll is about.
        </p>
        
        <div className="space-y-6">
          <PollVote pollId={id} />
          <PollResults pollId={id} />
        </div>
      </div>
    </div>
  );
}