import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="bg-white">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Create and vote on polls with ease
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Alx Polly is a simple and intuitive polling platform where you can create polls, 
              share them with others, and see real-time results.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/polls">
                <Button size="lg">
                  Browse Polls
                </Button>
              </Link>
              <Link href="/polls/create">
                <Button variant="outline" size="lg">
                  Create Poll
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}