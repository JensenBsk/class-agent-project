import Link from "next/link";
import { StateMessage } from "@/components/StateMessage";

export default function NotFound() {
  return (
    <StateMessage
      variant="empty"
      title="Page not found"
      action={
        <Link className="button" href="/">
          Go home
        </Link>
      }
    >
      That page doesn&apos;t exist.
    </StateMessage>
  );
}
