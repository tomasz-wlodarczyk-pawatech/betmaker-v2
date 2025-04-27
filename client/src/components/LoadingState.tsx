import { Card, CardContent } from "@/components/ui/card";

interface LoadingStateProps {
  message?: string;
  detail?: string;
}

export default function LoadingState({ 
  message = "Loading...", 
  detail = "This may take a moment" 
}: LoadingStateProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <div className="flex flex-col items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg font-medium">{message}</p>
          <p className="text-sm text-neutral-dark mt-2">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}
