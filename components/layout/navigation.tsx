"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";

export function Navigation() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/polls" className="text-gray-900 hover:text-gray-700">
              All Polls
            </Link>
            <Link href="/polls/create" className="text-gray-900 hover:text-gray-700">
              Create Poll
            </Link>
            <Link href="/profile" className="text-gray-900 hover:text-gray-700">
              Profile
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  Welcome, {user.user_metadata?.name || user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}