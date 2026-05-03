import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Minimal Lexical-JSON → React renderer. Handles the node types
 * Payload's default rich-text editor produces (root, paragraph,
 * heading, list, listitem, quote, link, text with format flags,
 * linebreak, upload). Anything unknown is skipped silently so
 * forward-compatibility doesn't crash the render.
 *
 * Lexical text-format bitmask reference:
 *   1   bold
 *   2   italic
 *   4   strikethrough
 *   8   underline
 *   16  code (inline)
 *   32  subscript
 *   64  superscript
 */

type LexNode = {
  type?: string;
  tag?: string;
  text?: string;
  format?: number | string;
  children?: LexNode[];
  url?: string;
  fields?: { url?: string; newTab?: boolean; doc?: { value?: unknown } };
  listType?: "bullet" | "number" | "check";
  value?: { url?: string; alt?: string; filename?: string } | number | string;
  relationTo?: string;
  newTab?: boolean;
  [key: string]: unknown;
};

type LexRoot = { root?: LexNode } | LexNode | unknown;

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKETHROUGH = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;
const FORMAT_SUBSCRIPT = 32;
const FORMAT_SUPERSCRIPT = 64;

export default function RichText({ data }: { data: LexRoot }) {
  const root = extractRoot(data);
  if (!root) return null;
  return <>{renderChildren(root.children ?? [])}</>;
}

function extractRoot(data: LexRoot): LexNode | null {
  if (!data || typeof data !== "object") return null;
  if ("root" in data && data.root) return data.root as LexNode;
  if ("children" in data) return data as LexNode;
  return null;
}

function renderChildren(nodes: LexNode[]): ReactNode {
  return nodes.map((n, i) => (
    <RenderNode key={i} node={n} />
  ));
}

function RenderNode({ node }: { node: LexNode }) {
  switch (node.type) {
    case "paragraph":
      return (
        <p className="my-4 font-ui text-[16px] leading-[1.7] text-[#142e2a]/85 md:text-[17px]">
          {renderChildren(node.children ?? [])}
        </p>
      );

    case "heading": {
      const tag = (node.tag as string) ?? "h2";
      const cls = headingClass(tag);
      return createHeading(tag, cls, renderChildren(node.children ?? []));
    }

    case "quote":
      return (
        <blockquote className="my-6 border-l-4 border-[#142e2a]/30 bg-[#f7f9f2] px-5 py-4 font-display text-[18px] italic leading-[1.6] text-[#142e2a] md:text-[20px]">
          {renderChildren(node.children ?? [])}
        </blockquote>
      );

    case "list": {
      const isOrdered = node.listType === "number";
      const cls =
        "my-4 ml-6 space-y-2 font-ui text-[16px] leading-[1.7] text-[#142e2a]/85 md:text-[17px] " +
        (isOrdered ? "list-decimal" : "list-disc");
      return isOrdered ? (
        <ol className={cls}>{renderChildren(node.children ?? [])}</ol>
      ) : (
        <ul className={cls}>{renderChildren(node.children ?? [])}</ul>
      );
    }

    case "listitem":
      return <li>{renderChildren(node.children ?? [])}</li>;

    case "link":
    case "autolink": {
      const href =
        (node.fields?.url as string | undefined) ??
        (node.url as string | undefined) ??
        "#";
      const newTab = !!(node.fields?.newTab ?? node.newTab);
      const isExternal = /^https?:\/\//i.test(href);
      const className =
        "underline underline-offset-2 decoration-[#142e2a]/30 hover:decoration-[#142e2a] transition";
      if (isExternal) {
        return (
          <a
            href={href}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            className={className}
          >
            {renderChildren(node.children ?? [])}
          </a>
        );
      }
      return (
        <Link href={href} className={className}>
          {renderChildren(node.children ?? [])}
        </Link>
      );
    }

    case "linebreak":
      return <br />;

    case "upload": {
      // Payload puts the media row under either `value` (object) or
      // requires a separate populate. We support the populated shape.
      const v = node.value;
      if (v && typeof v === "object" && "url" in v && v.url) {
        const m = v as { url: string; alt?: string; filename?: string };
        // eslint-disable-next-line @next/next/no-img-element
        return (
          <img
            src={m.url}
            alt={m.alt ?? m.filename ?? ""}
            className="my-6 w-full rounded-2xl"
          />
        );
      }
      return null;
    }

    case "text":
      return renderText(node);

    case "horizontalrule":
      return <hr className="my-8 border-[#142e2a]/15" />;

    default:
      // Unknown node type → render children if any so wrappers don't
      // swallow content silently.
      if (node.children?.length) {
        return <>{renderChildren(node.children)}</>;
      }
      return null;
  }
}

function renderText(node: LexNode): ReactNode {
  const text = node.text ?? "";
  if (!text) return null;
  const fmt = typeof node.format === "number" ? node.format : 0;

  let el: ReactNode = text;
  if (fmt & FORMAT_CODE) {
    el = (
      <code className="rounded bg-[#142e2a]/8 px-1.5 py-0.5 font-mono text-[0.9em]">
        {el}
      </code>
    );
  }
  if (fmt & FORMAT_BOLD) el = <strong>{el}</strong>;
  if (fmt & FORMAT_ITALIC) el = <em>{el}</em>;
  if (fmt & FORMAT_UNDERLINE) el = <u>{el}</u>;
  if (fmt & FORMAT_STRIKETHROUGH) el = <s>{el}</s>;
  if (fmt & FORMAT_SUBSCRIPT) el = <sub>{el}</sub>;
  if (fmt & FORMAT_SUPERSCRIPT) el = <sup>{el}</sup>;
  return el;
}

function headingClass(tag: string): string {
  switch (tag) {
    case "h1":
      return "mt-10 mb-4 font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#142e2a] md:text-[40px]";
    case "h2":
      return "mt-10 mb-4 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#142e2a] md:text-[32px]";
    case "h3":
      return "mt-8 mb-3 font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.01em] text-[#142e2a] md:text-[24px]";
    case "h4":
      return "mt-6 mb-2 font-display text-[18px] font-semibold leading-[1.3] text-[#142e2a]";
    case "h5":
    case "h6":
      return "mt-5 mb-2 font-ui text-[15px] font-semibold uppercase tracking-[0.06em] text-[#142e2a]/70";
    default:
      return "";
  }
}

function createHeading(
  tag: string,
  className: string,
  children: ReactNode
): ReactNode {
  const allowed = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
  const Tag = (allowed.includes(tag as (typeof allowed)[number]) ? tag : "h2") as
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
  return <Tag className={className}>{children}</Tag>;
}
