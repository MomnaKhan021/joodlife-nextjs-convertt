import type { WeightLogEntry } from "@/lib/weightLogs";

/**
 * Server-rendered SVG line chart of weight (kg) over time. Compares all
 * recorded consultation weights so the trend is visible at a glance.
 * Pure SVG — no client JS — and scales responsively via viewBox.
 */

const W = 720;
const H = 280;
const PAD = { top: 24, right: 24, bottom: 40, left: 44 };

function shortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function WeightChart({ entries }: { entries: WeightLogEntry[] }) {
  const pts = entries.filter((e) => e.weightKg !== null);

  if (pts.length === 0) return null;

  const weights = pts.map((e) => e.weightKg as number);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  // pad the y-range so the line isn't glued to the edges
  const range = Math.max(max - min, 4);
  const yMin = min - range * 0.25;
  const yMax = max + range * 0.25;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
  const y = (w: number) =>
    PAD.top + innerH - ((w - yMin) / (yMax - yMin)) * innerH;

  const coords = pts.map((e, i) => ({
    cx: x(i),
    cy: y(e.weightKg as number),
    w: e.weightKg as number,
    date: e.date,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.cx.toFixed(1)} ${c.cy.toFixed(1)}`)
    .join(" ");

  // area under the line
  const areaPath =
    `${linePath} L ${coords[coords.length - 1].cx.toFixed(1)} ${(PAD.top + innerH).toFixed(1)}` +
    ` L ${coords[0].cx.toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  // 4 horizontal gridlines
  const gridYs = [0, 1, 2, 3].map((i) => PAD.top + (i / 3) * innerH);
  const gridVals = [0, 1, 2, 3].map((i) => Math.round(yMax - (i / 3) * (yMax - yMin)));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Weight over time chart"
    >
      <defs>
        <linearGradient id="wlArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#142e2a" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#142e2a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines + y labels */}
      {gridYs.map((gy, i) => (
        <g key={i}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={gy}
            y2={gy}
            stroke="#142e2a"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={gy + 4}
            textAnchor="end"
            fontSize="11"
            fill="#142e2a"
            fillOpacity="0.45"
            fontFamily="var(--font-ui), sans-serif"
          >
            {gridVals[i]}
          </text>
        </g>
      ))}

      {/* area + line */}
      {coords.length > 1 ? <path d={areaPath} fill="url(#wlArea)" /> : null}
      {coords.length > 1 ? (
        <path
          d={linePath}
          fill="none"
          stroke="#142e2a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}

      {/* points + value + date labels */}
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={c.cy} r="5" fill="#ffffff" stroke="#142e2a" strokeWidth="2.5" />
          <text
            x={c.cx}
            y={c.cy - 12}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="600"
            fill="#142e2a"
            fontFamily="var(--font-ui), sans-serif"
          >
            {c.w}
          </text>
          <text
            x={c.cx}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
            fontSize="11"
            fill="#142e2a"
            fillOpacity="0.55"
            fontFamily="var(--font-ui), sans-serif"
          >
            {shortDate(c.date)}
          </text>
        </g>
      ))}
    </svg>
  );
}
