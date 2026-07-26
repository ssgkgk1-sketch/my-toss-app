import type { DailyClose } from "../data/stocks";

interface Props {
  /** 기간(일/주/월/년)에 맞게 이미 리샘플링된 시계열 */
  points: DailyClose[];
  /** 그라디언트 id 충돌 방지용 (종목코드) */
  seed: string;
  color: string;
}

/** 인접점 평균을 이용한 부드러운 베지어 패스 */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return "";
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const px = pts[i - 1], cx = pts[i];
    const mpx = (px.x + cx.x) / 2;
    d += ` C ${f(mpx)} ${f(px.y)} ${f(mpx)} ${f(cx.y)} ${f(cx.x)} ${f(cx.y)}`;
  }
  return d;
}

const f = (n: number) => n.toFixed(2);

const W = 375;
const H = 160;
const PAD = { t: 16, r: 8, b: 20, l: 8 };

export function LineChart({ points, seed, color }: Props) {
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  // 데이터가 부족하면(신규 상장 등) 점선 플레이스홀더만 표시
  if (points.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block" }} aria-hidden="true">
        <line
          x1={PAD.l}
          y1={H / 2}
          x2={W - PAD.r}
          y2={H / 2}
          stroke={color}
          strokeOpacity="0.25"
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  const closes = points.map((p) => p.close);
  const minY = Math.min(...closes);
  const maxY = Math.max(...closes);
  const rangeY = maxY - minY || 1;

  const svgPts = closes.map((y, i) => ({
    x: PAD.l + (i / (closes.length - 1)) * chartW,
    y: PAD.t + ((maxY - y) / rangeY) * chartH,
  }));

  const line = smoothPath(svgPts);
  const lastPt = svgPts[svgPts.length - 1];
  const firstPt = svgPts[0];
  const fill =
    `${line} L ${f(lastPt.x)} ${f(H - PAD.b)} L ${f(firstPt.x)} ${f(H - PAD.b)} Z`;

  const gradId = `chart-grad-${seed}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
