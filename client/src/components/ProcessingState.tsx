import { Card, CardContent } from "@/components/ui/card";

interface ProcessingStateProps {
  progress: number;
  message?: string;
  detail?: string;
}

export default function ProcessingState({ 
  progress, 
  message = "Processing...",
  detail = "Testing combinations to match your target odds"
}: ProcessingStateProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex flex-col items-center py-8">
          <div className="w-full max-w-md mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{message}</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-neutral-medium rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm text-neutral-dark">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
