import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ProcessingStateProps {
  progress: number;
  message?: string;
  detail?: string;
}

export default memo(function ProcessingState({ 
  progress, 
  message = "Generating Betslip",
  detail
}: ProcessingStateProps) {
  // Calculate the stroke-dashoffset for the circular progress
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <Card className="mb-6">
      <CardContent className="p-8">
        <div className="flex flex-col items-center">
          {/* Circular Progress Indicator */}
          <div className="relative mb-6">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 120 120"
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#f3f4f6"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="#9ce800"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-in-out"
              />
            </svg>
            
            {/* Progress percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Message text */}
          <p className="text-lg font-medium text-gray-700 text-center">
            {message}
          </p>
          
          {/* Detail text (if provided) */}
          {detail && (
            <p className="text-sm text-gray-500 text-center mt-2">
              {detail}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});