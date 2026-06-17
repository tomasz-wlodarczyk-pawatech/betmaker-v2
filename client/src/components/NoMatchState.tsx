import type { ReactNode } from "react";
import { Alert } from "@aliengain/components";
import { IconTriangleAlert } from "@aliengain/icons";

type AlertVariant = "success" | "neutral" | "warning" | "error" | "alternative";

interface NoMatchStateProps {
  title?: string;
  description?: string;
  variant?: AlertVariant;
  icon?: ReactNode;
}

const DEFAULT_TITLE = "No betslip matched these filters";
const DEFAULT_DESCRIPTION =
  "We couldn't find a combination near your target odds. Try widening your leg-odds range, increasing the number of legs, or adjusting your target odds.";

export default function NoMatchState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  variant = "warning",
  icon,
}: NoMatchStateProps) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <Alert
        variant={variant}
        icon={icon ?? <IconTriangleAlert size="md" />}
        title={title}
        description={description}
      />
    </div>
  );
}
