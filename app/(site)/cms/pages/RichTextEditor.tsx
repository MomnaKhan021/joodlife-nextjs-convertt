"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight WYSIWYG editor that produces HTML.
 *
 * Deliberately not a Lexical/ProseMirror port — it edits a `contentEditable`
 * region and stores the resulting HTML in the same `bodyHtml` field the
 * storefront already renders, so nothing downstream changes.
 *
 * Three modes, switchable without losing content:
 *   Write   — formatting toolbar, what-you-see-is-what-you-get
 *   HTML    — raw markup, for pasted or hand-written content
 *   Preview — read-only render in the storefront's prose styling
 */

type Mode = "write" | "html" | "preview";

const BTN =
  "rounded px-2 py-1 text-[13px] text-[#1a1a1a] transition-colors hover:bg-[#e4e7de] disabled:opacity-40";

/** document.execCommand is deprecated but remains the only broadly
 *  supported way to do this without shipping an editor framework. */
function exec(command: string, value?: string) {
  document.execCommand(command, false, value);
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("write");
  const ref = useRef<HTMLDivElement | null>(null);

  // Seed the editable region once per switch into Write mode. Writing on
  // every render would fight the caret and reset the cursor to the start.
  useEffect(() => {
    if (mode === "write" && ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function sync() {
    if (ref.current) onChange(ref.current.innerHTML);
  }

  function apply(command: string, arg?: string) {
    ref.current?.focus();
    exec(command, arg);
    sync();
  }

  function addLink() {
    const url = prompt("Link URL (https://… or /page)");
    if (!url) return;
    apply("createLink", url);
  }

  return (
    <div className="mt-1 overflow-hidden rounded-lg border border-[#d8ddd0] bg-white">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 border-b border-[#e4e7de] bg-[#f7f9f2] px-2 py-1.5">
        {(["write", "html", "preview"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors ${
              mode === m
                ? "bg-white text-[#1a1a1a] shadow-sm"
                : "text-[#616161] hover:bg-white/60"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === "write" && (
        <>
          {/* Formatting toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e4e7de] px-2 py-1.5">
            <button type="button" className={`${BTN} font-bold`} onClick={() => apply("bold")} title="Bold">
              B
            </button>
            <button type="button" className={`${BTN} italic`} onClick={() => apply("italic")} title="Italic">
              I
            </button>
            <button type="button" className={`${BTN} underline`} onClick={() => apply("underline")} title="Underline">
              U
            </button>
            <span className="mx-1 h-4 w-px bg-[#e4e7de]" />
            <button type="button" className={BTN} onClick={() => apply("formatBlock", "<h2>")} title="Heading 2">
              H2
            </button>
            <button type="button" className={BTN} onClick={() => apply("formatBlock", "<h3>")} title="Heading 3">
              H3
            </button>
            <button type="button" className={BTN} onClick={() => apply("formatBlock", "<p>")} title="Paragraph">
              P
            </button>
            <span className="mx-1 h-4 w-px bg-[#e4e7de]" />
            <button type="button" className={BTN} onClick={() => apply("insertUnorderedList")} title="Bullet list">
              • List
            </button>
            <button type="button" className={BTN} onClick={() => apply("insertOrderedList")} title="Numbered list">
              1. List
            </button>
            <span className="mx-1 h-4 w-px bg-[#e4e7de]" />
            <button type="button" className={BTN} onClick={addLink} title="Insert link">
              Link
            </button>
            <button type="button" className={BTN} onClick={() => apply("unlink")} title="Remove link">
              Unlink
            </button>
            <span className="mx-1 h-4 w-px bg-[#e4e7de]" />
            <button
              type="button"
              className={BTN}
              onClick={() => apply("removeFormat")}
              title="Clear formatting"
            >
              Clear
            </button>
          </div>

          <div
            ref={ref}
            contentEditable
            suppressContentEditableWarning
            onInput={sync}
            onBlur={sync}
            role="textbox"
            aria-multiline="true"
            aria-label="Page body"
            className="prose-blog min-h-[300px] px-4 py-3 text-[15px] leading-[1.7] text-[#142e2a] outline-none"
          />
        </>
      )}

      {mode === "html" && (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="min-h-[340px] w-full resize-y px-4 py-3 font-mono text-[13px] leading-[1.6] text-[#1a1a1a] outline-none"
          placeholder={"<h2>Heading</h2>\n<p>Your content…</p>"}
        />
      )}

      {mode === "preview" && (
        <div
          className="prose-blog min-h-[300px] px-4 py-3 text-[15px] leading-[1.7] text-[#142e2a]"
          dangerouslySetInnerHTML={{ __html: value || "<p></p>" }}
        />
      )}
    </div>
  );
}
