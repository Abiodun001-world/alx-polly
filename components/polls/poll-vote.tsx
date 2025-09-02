"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PollVoteProps {
  pollId: string;
}

export function PollVote({ pollId }: PollVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock poll data - replace with actual data fetching
  const pollOptions = [
    { id: "1", text: "Option 1", votes: 15 },
    { id: "2", text: "Option 2", votes: 8 },
    { id: "3", text: "Option 3", votes: 12 },
  ];

  const handleVote = async () => {
    if (!selectedOption) return;
    
    setIsLoading(true);
    
    // TODO: Implement actual voting logic
    console.log("Voting for option:", selectedOption, "in poll:", pollId);
    
    // Simulate API call
    setTimeout(() => {
      setHasVoted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (hasVoted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vote Submitted!</CardTitle>
          <CardDescription>
            Thank you for voting. You can view the results below.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cast Your Vote</CardTitle>
        <CardDescription>
          Select your preferred option from the choices below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
          {pollOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <Button 
          onClick={handleVote} 
          disabled={!selectedOption || isLoading}
          className="w-full"
        >
          {isLoading ? "Submitting Vote..." : "Submit Vote"}
        </Button>
      </CardContent>
    </Card>
  );
}
