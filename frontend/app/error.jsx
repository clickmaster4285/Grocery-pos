"use client"

import { ErrorCard } from "@/components/ui/error-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReloadIcon, HomeIcon } from "@radix-ui/react-icons";

const ServerErrorIllustration = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path
      fill="#F472B6"
      d="M49.8,-65.4C63.4,-56.9,72.1,-40.3,76.8,-22.6C81.5,-4.9,82.1,13.9,74.2,28.6C66.3,43.3,49.8,53.9,32.3,63.4C14.8,72.9,-3.8,81.3,-20.3,77.3C-36.8,73.3,-51.2,56.9,-61.1,38.6C-71,20.3,-76.5,0.2,-72.4,-17.3C-68.4,-34.8,-54.8,-49.6,-39,-57.5C-23.2,-65.3,-5.3,-66.2,12.4,-71.1C30.1,-76,60.2,-84.9,49.8,-65.4Z"
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
      500
    </text>
  </svg>
);

export default function ServerError({ error, reset }) {
  return (
    <ErrorCard
    type="500"
      title="Server Error"
      description= {error.message || "Something went wrong on our end. We're working to fix it!"}
      code={500}
      illustration={<ServerErrorIllustration />}
      action={
        <div className="flex gap-4">
          <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 border-white/20">
            <Link href="/">
              <HomeIcon className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            <ReloadIcon className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      }
    />
  );
}