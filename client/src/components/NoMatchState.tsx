import { Alert, Chip } from "@aliengain/components";
import { IconTrophy } from "@aliengain/icons";

interface NoMatchStateProps {
  targetOdds: number;
  onTryLower: () => void;
  onTryHigher: () => void;
}

export default function NoMatchState({
  targetOdds,
  onTryLower,
  onTryHigher,
}: NoMatchStateProps) {
  const lowerOdds = Math.round(targetOdds * 0.65 * 100) / 100;
  const higherOdds = Math.round(targetOdds * 1.5 * 100) / 100;

  return (
    <div style={{ marginTop: "1rem" }}>
      <Alert
        variant="warning"
        icon={<IconTrophy size="md" />}
        title="No matching combinations found"
        description={`We couldn't find a combination matching your target odds (${targetOdds.toFixed(
          2,
        )} ±15%).`}
        action={
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Chip size="sm" onClick={onTryLower}>
              Try lower odds ({lowerOdds.toFixed(2)})
            </Chip>
            <Chip size="sm" onClick={onTryHigher}>
              Try higher odds ({higherOdds.toFixed(2)})
            </Chip>
          </div>
        }
      />
    </div>
  );
}
