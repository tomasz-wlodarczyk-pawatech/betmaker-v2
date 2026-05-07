import { Alert, Button } from "@aliengain/components";
import { IconRotateCw } from "@aliengain/icons";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <Alert
        variant="error"
        title="Something went wrong"
        description={message}
        action={
          <Button
            title="Try again"
            variant="outline"
            size="sm"
            leftIcon={<IconRotateCw size="sm" />}
            onClick={onRetry}
          />
        }
      />
    </div>
  );
}
