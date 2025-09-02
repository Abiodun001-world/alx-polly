import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PollCardProps {
  id: string;
  title: string;
  description: string;
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
}

export function PollCard({ id, title, description, totalVotes, isActive, createdAt }: PollCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <span>{totalVotes} votes</span>
          <span className={`px-2 py-1 rounded-full text-xs ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isActive ? 'Active' : 'Closed'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Created {formatDate(createdAt)}
          </span>
          <Link href={`/polls/${id}`}>
            <Button size="sm">
              {isActive ? 'Vote' : 'View Results'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
