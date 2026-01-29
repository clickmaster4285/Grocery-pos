"use client";

import { ErrorCard } from "@/components/ui/error-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LockClosedIcon, ArrowRightIcon } from "@radix-ui/react-icons";

const ForbiddenIllustration = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
    <path
      fill="#F88181"
      d="M42.8,-62.1C55.4,-53.3,65.2,-39.9,70.9,-24.7C76.6,-9.5,78.3,7.5,72.7,21.6C67.1,35.7,54.3,46.9,39.4,57.3C24.5,67.7,7.5,77.3,-9.3,81.3C-26.1,85.3,-52.2,83.7,-66.7,70.8C-81.2,57.9,-84.1,33.7,-81.6,11.9C-79.1,-9.9,-71.2,-29.3,-58.3,-42.4C-45.4,-55.5,-27.6,-62.3,-9.5,-58.2C8.6,-54.1,17.2,-39.1,42.8,-62.1Z"
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
      403
    </text>
  </svg>
);

export default function Forbidden() {
  return (
    <ErrorCard
      type="403"
      title="Access Denied"
      description="You do not have the necessary permissions to view this page."
      code={403}
      illustration={<ForbiddenIllustration />}
      action={
        <Button asChild>
          <Link href="/">
            <ArrowRightIcon className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      }
    />
  );
}