import { AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { memo } from "react";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

const ErrorState = memo(function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="mb-6 border-l-4 border-error">
      <CardContent className="p-5">
        <div className="flex items-start">
          <AlertCircle className="text-error mr-3 h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Something went wrong</h3>
            <p className="text-sm mt-1">{message}</p>
            <button 
              onClick={onRetry}
              className="mt-3 text-primary font-medium text-sm flex items-center hover:underline"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Try again
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ErrorState;
