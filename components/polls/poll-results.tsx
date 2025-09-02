"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PollResultsProps {
  pollId: string;
}

export function PollResults({ pollId: _pollId }: PollResultsProps) {
  // Mock poll data - replace with actual data fetching
  const pollOptions = [
    { id: "1", text: "Option 1", votes: 15, percentage: 42.9 },
    { id: "2", text: "Option 2", votes: 8, percentage: 22.9 },
    { id: "3", text: "Option 3", votes: 12, percentage: 34.3 },
  ];

  const totalVotes = pollOptions.reduce((sum, option) => sum + option.votes, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Poll Results</CardTitle>
        <CardDescription>
          {totalVotes} total votes cast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pollOptions.map((option) => (
          <div key={option.id} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{option.text}</span>
              <span className="text-gray-600">
                {option.votes} votes ({option.percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={option.percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
