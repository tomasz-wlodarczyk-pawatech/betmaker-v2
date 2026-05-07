import { Alert } from "@aliengain/components";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "var(--colors-background-default)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem" }}>
        <Alert
          variant="error"
          title="404 Page Not Found"
          description="Did you forget to add the page to the router?"
        />
      </div>
    </div>
  );
}
