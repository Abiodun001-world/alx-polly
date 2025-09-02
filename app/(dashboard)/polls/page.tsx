import { PollCard } from "@/components/polls/poll-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PollsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Polls</h1>
        <Link href="/polls/create">
          <Button>Create New Poll</Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Poll cards will be rendered here */}
        <PollCard 
          id="1"
          title="Sample Poll"
          description="This is a sample poll for demonstration"
          totalVotes={42}
          isActive={true}
          createdAt="2025-08-30"
        />
      </div>
    </div>
  );
}