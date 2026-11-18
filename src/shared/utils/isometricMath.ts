export interface ScreenPoint {
  screenX: number;
  screenY: number;
}

export interface TileCoord {
  tileX: number;
  tileY: number;
}

export function tileToScreen(
  tileX: number,
  tileY: number,
  originX: number,
  originY: number,
  tileWidth = 64,
  tileHeight = 32,
  zoom = 1
): ScreenPoint {
  const halfW = (tileWidth * zoom) / 2;
  const halfH = (tileHeight * zoom) / 2;

  return {
    screenX: Math.round(originX + (tileX - tileY) * halfW),
    screenY: Math.round(originY + (tileX + tileY) * halfH)
  };
}

export function screenToTile(
  screenX: number,
  screenY: number,
  originX: number,
  originY: number,
  tileWidth = 64,
  tileHeight = 32,
  zoom = 1
): TileCoord {
  const halfW = (tileWidth * zoom) / 2;
  const halfH = (tileHeight * zoom) / 2;
  const dx = screenX - originX;
  const dy = screenY - originY;

  const tileX = Math.floor((dx / halfW + dy / halfH) / 2);
  const tileY = Math.floor((dy / halfH - dx / halfW) / 2);

  return { tileX, tileY };
}

export function isTileWithinBounds(
  tileX: number,
  tileY: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  return (
    Number.isInteger(tileX) &&
    Number.isInteger(tileY) &&
    tileX >= 0 &&
    tileY >= 0 &&
    tileX < gridWidth &&
    tileY < gridHeight
  );
}

export function sortPlacementsByDepth<T extends TileCoord>(placements: readonly T[]): T[] {
  return [...placements].sort((a, b) => {
    const depthDiff = a.tileX + a.tileY - (b.tileX + b.tileY);
    if (depthDiff !== 0) return depthDiff;
    if (a.tileX !== b.tileX) return a.tileX - b.tileX;
    return a.tileY - b.tileY;
  });
}

