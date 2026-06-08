import { Alert } from "@aliengain/components";
import { IconTrophy } from "@aliengain/icons";

export default function NoMatchState() {
  return (
    <div style={{ marginTop: "1rem" }}>
      <Alert
        variant="warning"
        icon={<IconTrophy size="md" />}
        title="No matching combinations found"
        description="We couldn't find a combination matching your target odds."
      />
    </div>
  );
}
