"use client"

import { ErrorCard } from "@/components/ui/error-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RocketIcon, HomeIcon } from "@radix-ui/react-icons";

const NotFoundIllustration = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path
      fill="#A78BFA"
      d="M45.1,-65.3C57.9,-56.8,67.1,-42.9,72.5,-27.9C77.9,-12.9,79.5,3.2,74.1,16.2C68.7,29.2,56.3,39.1,42.8,49.3C29.3,59.5,14.6,70,-1.1,71.6C-16.9,73.3,-33.8,66.1,-48.6,55.4C-63.4,44.7,-76.2,30.5,-80.3,13.5C-84.5,-3.5,-80,-23.3,-68.5,-37.2C-57,-51.1,-38.5,-59.1,-22.9,-66.5C-7.3,-73.9,5.5,-80.7,20.6,-78.8C35.7,-76.9,53.1,-66.3,45.1,-65.3Z"
      transform="translate(100 100)"
    />
    <text
      x="100"
      y="100"
      fontFamily="Arial"
      fontSize="20"
      fontWeight="bold"
      textAnchor="middle"
      fill="white"
    >
      404
    </text>
  </svg>
);

export default function NotFound() {
  return (
    <>
      <ErrorCard
      type="404"
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        code={404}
        illustration={<NotFoundIllustration />}
        action={
          <div className="flex gap-4">
            <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20">
              <Link href="/">
                <HomeIcon className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contact">
                <RocketIcon className="mr-2 h-4 w-4" />
                Report Issue
              </Link>
            </Button>
          </div>
        }
      />
    </>
  );
}