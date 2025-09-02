"use client";

import { useState, useEffect } from 'react';
import { Poll, CreatePollData } from '@/types/poll';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/polls');
      const data = await response.json();

      if (data.polls) {
        setPolls(data.polls);
      } else {
        setError('Failed to fetch polls');
      }
    } catch (error) {
      setError('Failed to fetch polls');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async (pollData: CreatePollData) => {
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });

      const data = await response.json();

      if (data.poll) {
        setPolls(prev => [data.poll, ...prev]);
        return { success: true, poll: data.poll };
      } else {
        return { success: false, error: 'Failed to create poll' };
      }
    } catch (error) {
      return { success: false, error: 'Failed to create poll' };
    }
  };

  const voteOnPoll = async (pollId: string, optionId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optionId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the poll in the list
        setPolls(prev => prev.map(poll => 
          poll.id === pollId 
            ? { ...poll, totalVotes: poll.totalVotes + 1 }
            : poll
        ));
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      return { success: false, error: 'Failed to vote' };
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  return {
    polls,
    loading,
    error,
    fetchPolls,
    createPoll,
    voteOnPoll,
  };
}
