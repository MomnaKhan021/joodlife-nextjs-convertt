import type { ReactNode } from "react";

/**
 * Renders copy that contains an accented phrase.
 *
 * The design highlights part of many headings and paragraphs — the green
 * "clinician-led care", the italic "it's transformation". Splitting each of
 * those into two CMS fields would be tedious and easy to get wrong, so the
 * editor writes one field and wraps the accented part in **double asterisks**:
 *
 *   "Part of Jood's **clinician-led care**"
 *
 * Everything between the markers is wrapped in `accentClass`; the rest is
 * plain. A line break in the source becomes a <br />, so multi-line headings
 * keep working. Text with no markers renders unchanged, which is what makes
 * this safe to apply to existing copy.
 */
export default function Highlight({
  text,
  accentClass = "text-[#b4ff9f]",
  as: Tag = "span",
}: {
  text: string;
  /** Classes applied to the **accented** run. */
  accentClass?: string;
  as?: "span" | "em";
}) {
  const nodes: ReactNode[] = [];

  text.split("\n").forEach((line, li, lines) => {
    // Odd indices are the accented runs, because split keeps alternating.
    line.split("**").forEach((part, i) => {
      if (!part) return;
      nodes.push(
        i % 2 === 1 ? (
          <Tag key={`${li}-${i}`} className={accentClass}>
            {part}
          </Tag>
        ) : (
          <span key={`${li}-${i}`}>{part}</span>
        ),
      );
    });
    if (li < lines.length - 1) nodes.push(<br key={`br-${li}`} />);
  });

  return <>{nodes}</>;
}
