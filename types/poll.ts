export interface Poll {
    id: string;
    title: string;
    description: string;
    options: PollOption[];
    totalVotes: number;
    isActive: boolean;
    createdAt: string;
    createdBy: string;
    expiresAt?: string;
  }
  
  export interface PollOption {
    id: string;
    text: string;
    votes: number;
  }
  
  export interface CreatePollData {
    title: string;
    description: string;
    options: string[];
    expiresAt?: string;
  }