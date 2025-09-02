import { PollForm } from "@/components/polls/poll-form";

export default function CreatePollPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
        <p className="mt-2 text-gray-600">
          Create a new poll and share it with others to get their opinions.
        </p>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <PollForm />
      </div>
    </div>
  );
}