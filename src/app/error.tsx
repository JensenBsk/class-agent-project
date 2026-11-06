"use client";

import { StateMessage } from "@/components/StateMessage";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Don't show error.message: it can leak internal details. Log it on the server instead.
  return (
    <StateMessage
      variant="error"
      title="Something went wrong"
      action={
        <button type="button" className="button" onClick={() => reset()}>
          Try again
        </button>
      }
    >
      Your saved information is safe. Try again, or go back to the home page.
    </StateMessage>
  );
}
