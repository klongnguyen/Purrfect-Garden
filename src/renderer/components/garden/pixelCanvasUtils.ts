export interface PixelPainter {
  px: (x: number, y: number, color: string) => void;
  rect: (x: number, y: number, w: number, h: number, color: string) => void;
  ditherRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    colorA: string,
    colorB: string,
    sparseMod?: number
  ) => void;
  circle: (cx: number, cy: number, r: number, fill: string, outline?: string) => void;
  ellipse: (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fill: string,
    outline?: string
  ) => void;
  isoTile: (
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
    fill: string,
    outline?: string
  ) => void;
  stampMatrix: (
    grid: readonly string[],
    palette: Record<string, string>,
    startX: number,
    startY: number,
    scale?: number
  ) => void;
}

export function createPixelPainter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): PixelPainter {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, width, height);

  const px = (x: number, y: number, color: string) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= width || iy >= height) return;
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, 1, 1);
  };

  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iw = Math.round(w);
    const ih = Math.round(h);
    if (iw <= 0 || ih <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, iw, ih);
  };

  const ditherRect = (
    x: number,
    y: number,
    w: number,
    h: number,
    colorA: string,
    colorB: string,
    sparseMod = 4
  ) => {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iw = Math.round(w);
    const ih = Math.round(h);
    rect(ix, iy, iw, ih, colorA);
    ctx.fillStyle = colorB;
    for (let dy = 0; dy < ih; dy += 1) {
      for (let dx = 0; dx < iw; dx += 1) {
        const pxX = ix + dx;
        const pxY = iy + dy;
        const hash = ((pxX * 73856093) ^ (pxY * 19349663)) >>> 0;
        if (hash % sparseMod === 0) {
          ctx.fillRect(pxX, pxY, 1, 1);
        }
      }
    }
  };

  const ellipse = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    fill: string,
    outline?: string
  ) => {
    const icx = Math.round(cx);
    const icy = Math.round(cy);
    const irx = Math.max(1, Math.round(rx));
    const iry = Math.max(1, Math.round(ry));
    for (let dy = -iry; dy <= iry; dy += 1) {
      for (let dx = -irx; dx <= irx; dx += 1) {
        const dist = (dx * dx) / (irx * irx) + (dy * dy) / (iry * iry);
        if (dist <= 1.0) {
          if (outline) {
            const onEdge =
              ((dx + 1) * (dx + 1)) / (irx * irx) + (dy * dy) / (iry * iry) > 1.0 ||
              ((dx - 1) * (dx - 1)) / (irx * irx) + (dy * dy) / (iry * iry) > 1.0 ||
              (dx * dx) / (irx * irx) + ((dy + 1) * (dy + 1)) / (iry * iry) > 1.0 ||
              (dx * dx) / (irx * irx) + ((dy - 1) * (dy - 1)) / (iry * iry) > 1.0;
            px(icx + dx, icy + dy, onEdge ? outline : fill);
          } else {
            px(icx + dx, icy + dy, fill);
          }
        }
      }
    }
  };

  const circle = (cx: number, cy: number, r: number, fill: string, outline?: string) => {
    ellipse(cx, cy, r, r, fill, outline);
  };

  const isoTile = (
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
    fill: string,
    outline?: string
  ) => {
    const icx = Math.round(cx);
    const icy = Math.round(cy);
    const hw = Math.max(1, Math.round(halfW));
    const hh = Math.max(1, Math.round(halfH));

    for (let row = 0; row <= hh * 2; row += 1) {
      const dyFromCenter = Math.abs(row - hh);
      const span = Math.max(0, Math.round(((hh - dyFromCenter) / hh) * hw));
      if (span === 0) {
        px(icx, icy + row, outline ?? fill);
        continue;
      }
      ctx.fillStyle = fill;
      ctx.fillRect(icx - span, icy + row, span * 2, 1);
      if (outline) {
        px(icx - span, icy + row, outline);
        px(icx + span - 1, icy + row, outline);
        if (row === 0 || row === hh * 2) {
          ctx.fillStyle = outline;
          ctx.fillRect(icx - span, icy + row, span * 2, 1);
        }
      }
    }
  };

  const stampMatrix = (
    grid: readonly string[],
    palette: Record<string, string>,
    startX: number,
    startY: number,
    scale = 1
  ) => {
    const ix = Math.round(startX);
    const iy = Math.round(startY);
    const iscale = Math.max(1, Math.round(scale));
    for (let y = 0; y < grid.length; y += 1) {
      const row = grid[y] ?? '';
      for (let x = 0; x < row.length; x += 1) {
        const ch = row[x];
        if (!ch || ch === '.' || ch === ' ') continue;
        const color = palette[ch];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(ix + x * iscale, iy + y * iscale, iscale, iscale);
      }
    }
  };

  return {
    px,
    rect,
    ditherRect,
    circle,
    ellipse,
    isoTile,
    stampMatrix
  };
}

