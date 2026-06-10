import { Alert } from "@aliengain/components";
import { IconTriangleAlert } from "@aliengain/icons";

interface NoMatchStateProps {
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "No betslip matched these filters";
const DEFAULT_DESCRIPTION =
  "We couldn't find a combination near your target odds. Try widening your leg-odds range, increasing the number of legs, or adjusting your target odds.";

export default function NoMatchState({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: NoMatchStateProps) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <Alert
        variant="warning"
        icon={<IconTriangleAlert size="md" />}
        title={title}
        description={description}
      />
    </div>
  );
}
