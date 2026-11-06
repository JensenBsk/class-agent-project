import { formatDate, type NextAction } from "@/agents/tracker";
import styles from "./tracker.module.css";

type Item = NextAction & { applicationId: string; company: string; position: string };

const PRIORITY_TEXT = { high: "Do soon", medium: "Coming up", low: "When you can" } as const;

/** The "What should I do next?" list. Expects items already sorted by `listNextActions`. */
export function NextActionsList({ items }: { items: Item[] }) {
  return (
    <ol className={styles.list}>
      {items.map((item) => (
        <li key={item.applicationId} className={styles.actionItem} data-priority={item.priority}>
          <p className={styles.actionTitle}>
            {item.action}{" "}
            <span className={styles.badge} data-priority={item.priority}>
              {PRIORITY_TEXT[item.priority]}
            </span>
          </p>
          <p className={styles.muted}>
            {item.position} at {item.company}. {item.reason}
            {item.dueDate ? ` Due ${formatDate(item.dueDate)}.` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}
