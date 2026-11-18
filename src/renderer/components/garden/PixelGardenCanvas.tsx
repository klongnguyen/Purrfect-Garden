import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  GardenPlacementDTO,
  GardenWeatherMode,
  PetCatalogItemDTO
} from '@shared/types/domain';
import type { GardenInteractionMode } from '../../stores/useGardenStore';
import { createPixelPainter, type PixelPainter } from './pixelCanvasUtils';
import { ITEM_SPRITE_SPECS, resolvePetSpriteSpec } from './PixelSprite';

const CANVAS_W = 640;
const CANVAS_H = 400;
const K = '#24140B';

interface VillagePalette {
  grassMain: string;
  grassAlt: string;
  grassShade: string;
  pathCenter: string;
  pathEdge: string;
  pathOutline: string;
  soilBase: string;
  soilDark: string;
  soilRidge: string;
  soilBorder: string;
  waterDeep: string;
  waterMid: string;
  waterShore: string;
  waterGlint: string;
  roofRed: string;
  roofRedDark: string;
  roofGreen: string;
  roofGreenDark: string;
  foliageDeep: string;
  foliageMid: string;
  foliageBright: string;
  foliageTip: string;
  snowCap: string | null;
}

const VILLAGE_PALETTES: Record<string, VillagePalette> = {
  spring_meadow: {
    grassMain: '#83BC54',
    grassAlt: '#77B049',
    grassShade: '#5A8D33',
    pathCenter: '#DEC18D',
    pathEdge: '#C7A46E',
    pathOutline: '#8F6A3F',
    soilBase: '#7D4E2F',
    soilDark: '#59341B',
    soilRidge: '#986541',
    soilBorder: '#3E2210',
    waterDeep: '#357CBE',
    waterMid: '#4E99DD',
    waterShore: '#84C6F5',
    waterGlint: '#D4F2FF',
    roofRed: '#C84E34',
    roofRedDark: '#91311E',
    roofGreen: '#558744',
    roofGreenDark: '#39612C',
    foliageDeep: '#345E25',
    foliageMid: '#4E8637',
    foliageBright: '#6FA94E',
    foliageTip: '#94CA6B',
    snowCap: null
  },
  autumn_grove: {
    grassMain: '#C79B46',
    grassAlt: '#B68937',
    grassShade: '#7E6424',
    pathCenter: '#E2C38B',
    pathEdge: '#C7A264',
    pathOutline: '#7D582C',
    soilBase: '#7A4A2B',
    soilDark: '#573119',
    soilRidge: '#97613E',
    soilBorder: '#3C200E',
    waterDeep: '#3B78AC',
    waterMid: '#5291C7',
    waterShore: '#8AC0EA',
    waterGlint: '#D8F1FF',
    roofRed: '#BD422B',
    roofRedDark: '#872918',
    roofGreen: '#B86E29',
    roofGreenDark: '#854A18',
    foliageDeep: '#8A3B18',
    foliageMid: '#C86622',
    foliageBright: '#EA992D',
    foliageTip: '#F7C94D',
    snowCap: null
  },
  winter_sanctuary: {
    grassMain: '#CFE6FA',
    grassAlt: '#BED8F2',
    grassShade: '#89ADD1',
    pathCenter: '#E7F3FD',
    pathEdge: '#C3DCF2',
    pathOutline: '#7A9DC2',
    soilBase: '#6D4B3A',
    soilDark: '#4D3225',
    soilRidge: '#87604D',
    soilBorder: '#362117',
    waterDeep: '#2B689C',
    waterMid: '#478BC2',
    waterShore: '#9ED2F5',
    waterGlint: '#E8F7FF',
    roofRed: '#9E4032',
    roofRedDark: '#732A20',
    roofGreen: '#466E57',
    roofGreenDark: '#2E4C3B',
    foliageDeep: '#2A4E3C',
    foliageMid: '#406E55',
    foliageBright: '#66947A',
    foliageTip: '#EDF6FF',
    snowCap: '#F2F9FF'
  },
  magical_garden: {
    grassMain: '#123A4B',
    grassAlt: '#0E2F3E',
    grassShade: '#266173',
    pathCenter: '#3D316E',
    pathEdge: '#2C2252',
    pathOutline: '#1A1336',
    soilBase: '#274C5E',
    soilDark: '#193544',
    soilRidge: '#36657A',
    soilBorder: '#0F222C',
    waterDeep: '#0D4B6E',
    waterMid: '#18759E',
    waterShore: '#38BDF8',
    waterGlint: '#A5F3FC',
    roofRed: '#7E3AF2',
    roofRedDark: '#5521B5',
    roofGreen: '#0E7490',
    roofGreenDark: '#155E75',
    foliageDeep: '#164E63',
    foliageMid: '#0891B2',
    foliageBright: '#D946EF',
    foliageTip: '#67E8F9',
    snowCap: null
  }
};

function drawFruitTree(
  p: PixelPainter,
  cx: number,
  baseY: number,
  pal: VillagePalette,
  fruitColor = '#E84A38'
) {
  // Ground shadow
  p.ellipse(cx, baseY + 2, 16, 6, 'rgba(0,0,0,0.22)');
  // Trunk & roots
  p.rect(cx - 4, baseY - 12, 8, 14, '#734525');
  p.rect(cx - 5, baseY - 2, 2, 3, '#523018');
  p.rect(cx + 3, baseY - 2, 2, 3, '#523018');
  p.rect(cx - 4, baseY - 12, 1, 12, K);
  p.rect(cx + 4, baseY - 12, 1, 12, K);

  // Layered 4-tone pixel canopy clusters (matching Cozy Farming Asset Pack)
  p.circle(cx, baseY - 24, 18, pal.foliageDeep, K);
  p.circle(cx - 10, baseY - 19, 11, pal.foliageDeep, K);
  p.circle(cx + 10, baseY - 19, 11, pal.foliageDeep, K);

  p.circle(cx - 9, baseY - 21, 9, pal.foliageMid);
  p.circle(cx + 9, baseY - 21, 9, pal.foliageMid);
  p.circle(cx, baseY - 27, 13, pal.foliageMid);

  p.circle(cx - 7, baseY - 24, 6, pal.foliageBright);
  p.circle(cx + 7, baseY - 25, 6, pal.foliageBright);
  p.circle(cx, baseY - 31, 8, pal.foliageBright);

  p.circle(cx - 3, baseY - 33, 4, pal.foliageTip);
  p.circle(cx + 5, baseY - 28, 3, pal.foliageTip);

  if (pal.snowCap) {
    p.ellipse(cx, baseY - 34, 10, 4, pal.snowCap);
  }

  // Cheerful apples/oranges/blossoms
  for (const [fx, fy] of [
    [cx - 9, baseY - 20],
    [cx + 8, baseY - 19],
    [cx - 1, baseY - 27],
    [cx + 4, baseY - 31],
    [cx - 12, baseY - 25]
  ]) {
    p.rect(fx, fy, 3, 3, fruitColor);
    p.px(fx, fy, '#FFF4C2');
  }
}

function drawShingledCozyFarmhouse(
  p: PixelPainter,
  x: number,
  y: number,
  pal: VillagePalette
) {
  // Drop shadow around house
  p.rect(x + 8, y + 48, 118, 60, 'rgba(0,0,0,0.2)');

  // Stone Chimney on left roof
  p.rect(x + 24, y + 6, 14, 28, '#9A9488');
  p.rect(x + 24, y + 6, 14, 28, 'rgba(0,0,0,0)');
  p.rect(x + 22, y + 4, 18, 4, '#B7B0A4');
  p.rect(x + 22, y + 3, 18, 1, K);
  p.rect(x + 24, y + 12, 6, 3, '#6F6A60');
  p.rect(x + 31, y + 18, 6, 3, '#6F6A60');

  // Steep Gridded Terracotta Shingled Roof (Reference Images 1 & 2)
  const roofLeft = x + 6;
  const roofW = 120;
  const roofTop = y + 14;
  const roofH = 44;
  for (let row = 0; row < roofH; row += 1) {
    const inset = Math.max(0, Math.floor((14 - row) * 0.6));
    const rx = roofLeft + inset;
    const rw = roofW - inset * 2;
    const isRowSeam = row % 6 === 0;
    const fill =
      row === 0 || row === roofH - 1
        ? K
        : pal.snowCap && row < 8
          ? pal.snowCap
          : isRowSeam
            ? pal.roofRedDark
            : pal.roofRed;
    p.rect(rx, roofTop + row, rw, 1, fill);
    p.px(rx, roofTop + row, K);
    p.px(rx + rw - 1, roofTop + row, K);
    if (!isRowSeam && row > 1 && row < roofH - 2) {
      const shift = Math.floor(row / 6) % 2 === 0 ? 0 : 4;
      for (let tx = rx + 6 + shift; tx < rx + rw - 4; tx += 9) {
        p.px(tx, roofTop + row, pal.roofRedDark);
      }
    }
  }

  // Front Gable Triangle & Round Attic Wreath Window (Reference Image 2)
  const gCenterX = x + 66;
  for (let gr = 0; gr < 26; gr += 1) {
    const gw = gr * 2 + 4;
    p.rect(gCenterX - gw / 2, y + 26 + gr, gw, 1, '#F2E3C4');
    p.px(gCenterX - gw / 2, y + 26 + gr, '#59331B');
    p.px(gCenterX + gw / 2 - 1, y + 26 + gr, '#59331B');
  }
  // Roof trim boards over gable
  for (let gr = 0; gr < 27; gr += 1) {
    p.rect(gCenterX - gr - 3, y + 25 + gr, 3, 1, K);
    p.rect(gCenterX + gr + 1, y + 25 + gr, 3, 1, K);
  }
  p.circle(gCenterX, y + 40, 6, '#FFFFFF', '#4F8238');
  p.circle(gCenterX, y + 40, 3, '#588EB8');

  // Timber & Cream Plaster Lower Wall Facade
  p.rect(x + 12, y + 58, 108, 44, '#F1E2C4');
  p.rect(x + 12, y + 58, 108, 2, K);
  p.rect(x + 12, y + 101, 108, 2, K);
  p.rect(x + 11, y + 58, 2, 44, K);
  p.rect(x + 119, y + 58, 2, 44, K);
  // Horizontal & Vertical Oak Timber Beams
  p.rect(x + 13, y + 60, 106, 4, '#6A3F23');
  p.rect(x + 13, y + 78, 106, 3, '#6A3F23');
  p.rect(x + 42, y + 60, 4, 41, '#6A3F23');
  p.rect(x + 86, y + 60, 4, 41, '#6A3F23');
  // Base Stone Plinth
  p.rect(x + 13, y + 94, 106, 7, '#8E887B');
  for (let bx = x + 16; bx < x + 115; bx += 10) {
    p.rect(bx, y + 95, 1, 5, '#686258');
  }

  // Left & Right Glowing Paned Windows with Green Shutters & Flower Boxes
  for (const wx of [x + 20, x + 94]) {
    p.rect(wx - 4, y + 68, 4, 14, '#4E7D3E');
    p.rect(wx + 16, y + 68, 4, 14, '#4E7D3E');
    p.rect(wx, y + 68, 16, 14, K);
    p.rect(wx + 2, y + 70, 12, 10, '#FFE388');
    p.rect(wx + 7, y + 70, 2, 10, '#6A3F23');
    p.rect(wx + 2, y + 74, 12, 2, '#6A3F23');
    // Window flower box
    p.rect(wx - 1, y + 83, 18, 5, '#784726');
    p.rect(wx + 1, y + 81, 4, 3, '#4F943D');
    p.rect(wx + 6, y + 80, 4, 4, '#F472B6');
    p.rect(wx + 11, y + 81, 5, 3, '#FACC15');
  }

  // Center Arched Wooden Front Door & 4-Step Porch Staircase
  p.rect(x + 56, y + 66, 20, 28, K);
  p.rect(x + 58, y + 68, 16, 26, '#8F5630');
  p.rect(x + 62, y + 71, 8, 9, '#FFE694');
  p.px(x + 71, y + 82, '#FACC15'); // brass knob
  for (let st = 0; st < 4; st += 1) {
    p.rect(x + 52 - st, y + 94 + st * 4, 28 + st * 2, 4, st % 2 === 0 ? '#BD824E' : '#9E6637');
    p.rect(x + 52 - st, y + 97 + st * 4, 28 + st * 2, 1, K);
  }
  // Barrel & Potted Shrub beside steps
  p.ellipse(x + 48, y + 96, 5, 7, '#9C5E31', K);
  p.rect(x + 43, y + 95, 10, 1, '#5D5B57');
  p.circle(x + 86, y + 96, 5, pal.foliageBright, K);
}

function drawRedBarnSiloAndWindmill(
  p: PixelPainter,
  x: number,
  y: number,
  pal: VillagePalette
) {
  // Shadow
  p.rect(x + 6, y + 50, 164, 52, 'rgba(0,0,0,0.2)');

  // 1. Stone Grain Silo (Middle)
  const sx = x + 98;
  p.rect(sx, y + 20, 26, 72, '#B6B0A4');
  p.rect(sx + 18, y + 20, 8, 72, '#8F897D');
  p.rect(sx, y + 20, 1, 72, K);
  p.rect(sx + 26, y + 20, 1, 72, K);
  for (let sy = y + 32; sy < y + 88; sy += 12) {
    p.rect(sx + 1, sy, 25, 2, '#6E685E');
  }
  p.ellipse(sx + 13, y + 18, 14, 12, pal.snowCap ?? pal.roofGreen, K);
  p.rect(sx + 11, y + 4, 4, 3, '#D4CEBF');

  // 2. Red Gambrel Barn with Green Shingled Roof (Left)
  const bx = x + 4;
  // Gambrel Roof
  for (let row = 0; row < 34; row += 1) {
    const inset = row < 12 ? Math.max(0, 16 - row * 1.4) : Math.max(0, 16 - 12 * 1.4 - (row - 12) * 0.25);
    const rx = bx + Math.floor(inset);
    const rw = 88 - Math.floor(inset) * 2;
    p.rect(
      rx,
      y + 12 + row,
      rw,
      1,
      row === 0 || row === 33
        ? K
        : pal.snowCap && row < 8
          ? pal.snowCap
          : row % 5 === 0
            ? pal.roofGreenDark
            : pal.roofGreen
    );
  }
  // Barn Facade + Vertical Wood Seams
  p.rect(bx + 6, y + 46, 76, 48, '#BF3B2A');
  p.rect(bx + 6, y + 46, 76, 1, K);
  p.rect(bx + 6, y + 93, 76, 2, K);
  for (let px = bx + 12; px < bx + 80; px += 6) {
    p.rect(px, y + 47, 1, 46, '#92291C');
  }
  // White Cream Gable Trim & Hayloft Doors
  p.rect(bx + 22, y + 24, 44, 22, '#BF3B2A');
  p.rect(bx + 20, y + 44, 48, 3, '#F4EAD4');
  p.rect(bx + 36, y + 28, 16, 14, K);
  p.rect(bx + 38, y + 30, 12, 10, '#E89E3C');
  // Main Barn Double Doors with X Bracing
  p.rect(bx + 26, y + 60, 36, 33, K);
  p.rect(bx + 28, y + 62, 32, 31, '#8C4E28');
  p.rect(bx + 43, y + 62, 2, 31, K);
  for (let d = 0; d < 14; d += 1) {
    p.px(bx + 29 + d, y + 64 + d * 2, '#D9B88F');
    p.px(bx + 42 - d, y + 64 + d * 2, '#D9B88F');
    p.px(bx + 46 + d, y + 64 + d * 2, '#D9B88F');
    p.px(bx + 59 - d, y + 64 + d * 2, '#D9B88F');
  }

  // 3. Wooden Windmill with Cross Sails (Right)
  const wx = x + 136;
  for (let wy = 0; wy < 62; wy += 1) {
    const half = 11 + Math.floor(wy * 0.14);
    p.rect(wx + 20 - half, y + 30 + wy, half * 2, 1, wy % 8 === 0 ? '#784A2A' : '#B47948');
    p.px(wx + 20 - half, y + 30 + wy, K);
    p.px(wx + 20 + half - 1, y + 30 + wy, K);
  }
  p.ellipse(wx + 20, y + 28, 13, 10, pal.snowCap ?? pal.roofRed, K);
  p.rect(wx + 16, y + 82, 8, 12, '#59331B');
  // Windmill Diagonal Lattice Sails
  const hubX = wx + 20;
  const hubY = y + 34;
  for (let i = -28; i <= 28; i += 1) {
    p.rect(hubX + i - 1, hubY + i - 1, 3, 3, '#E8D6B9');
    p.px(hubX + i, hubY + i, K);
    p.rect(hubX + i - 1, hubY - i - 1, 3, 3, '#E8D6B9');
    p.px(hubX + i, hubY - i, K);
  }
  p.circle(hubX, hubY, 4, '#5A341B', K);
}

function drawRoofedStoneWell(
  p: PixelPainter,
  cx: number,
  cy: number,
  pal: VillagePalette
) {
  p.ellipse(cx, cy + 16, 17, 7, 'rgba(0,0,0,0.22)');
  // Cobblestone Ring
  p.ellipse(cx, cy + 12, 15, 8, '#7A756B', K);
  p.ellipse(cx, cy + 8, 14, 7, '#B4AEA1', K);
  p.ellipse(cx, cy + 8, 10, 4, pal.waterDeep, K);
  p.px(cx - 3, cy + 7, pal.waterGlint);
  p.px(cx + 3, cy + 8, pal.waterGlint);
  // Roof Support Posts & Pitched Well Canopy
  p.rect(cx - 11, cy - 10, 3, 18, '#6B3E20');
  p.rect(cx + 8, cy - 10, 3, 18, '#6B3E20');
  for (let r = 0; r < 11; r += 1) {
    const inset = 10 - r;
    p.rect(cx - 16 + inset, cy - 20 + r, 32 - inset * 2, 1, r === 0 ? K : pal.snowCap ?? pal.roofRed);
  }
  p.rect(cx - 16, cy - 9, 32, 2, K);
}

function drawSpottedCow(p: PixelPainter, x: number, y: number) {
  p.ellipse(x + 11, y + 13, 11, 4, 'rgba(0,0,0,0.2)');
  p.rect(x + 3, y + 11, 3, 4, '#241B18');
  p.rect(x + 15, y + 11, 3, 4, '#241B18');
  p.ellipse(x + 11, y + 7, 9, 6, '#FFFDF7', K);
  p.ellipse(x + 14, y + 6, 4, 3, '#2D2420');
  p.ellipse(x + 8, y + 9, 3, 2, '#2D2420');
  p.ellipse(x + 3, y + 6, 5, 4, '#FFFDF7', K);
  p.ellipse(x + 2, y + 8, 3, 2, '#F4A3AC');
  p.px(x + 3, y + 5, K);
}

function drawFluffySheep(p: PixelPainter, x: number, y: number) {
  p.ellipse(x + 8, y + 10, 8, 3, 'rgba(0,0,0,0.18)');
  p.rect(x + 4, y + 8, 2, 3, K);
  p.rect(x + 10, y + 8, 2, 3, K);
  p.ellipse(x + 8, y + 5, 7, 5, '#FFFDF7', '#B6ADA0');
  p.circle(x + 13, y + 5, 3, '#4A3F3B', K);
  p.px(x + 14, y + 4, '#FFFDF7');
}

function drawFlowerBush(
  p: PixelPainter,
  cx: number,
  cy: number,
  bloomColor: string,
  pal: VillagePalette
) {
  p.ellipse(cx, cy + 4, 8, 3, 'rgba(0,0,0,0.18)');
  p.circle(cx - 4, cy + 1, 5, pal.foliageDeep, K);
  p.circle(cx + 4, cy + 1, 5, pal.foliageDeep, K);
  p.circle(cx, cy - 1, 6, pal.foliageMid, K);
  p.circle(cx - 3, cy - 2, 3, pal.foliageBright);
  p.circle(cx + 3, cy - 1, 3, pal.foliageBright);
  // Crisp tiny 3px flower blossoms instead of giant colored balls
  for (const [fx, fy] of [
    [cx - 4, cy - 1],
    [cx + 1, cy - 3],
    [cx + 4, cy + 1]
  ]) {
    p.rect(fx - 1, fy, 3, 1, bloomColor);
    p.rect(fx, fy - 1, 1, 3, bloomColor);
    p.px(fx, fy, '#FFF9C4');
  }
}

function drawShrub(p: PixelPainter, cx: number, cy: number, pal: VillagePalette) {
  p.ellipse(cx, cy + 4, 8, 3, 'rgba(0,0,0,0.18)');
  p.circle(cx - 3, cy + 1, 5, pal.foliageDeep, K);
  p.circle(cx + 3, cy + 1, 5, pal.foliageDeep, K);
  p.circle(cx, cy - 1, 6, pal.foliageMid, K);
  p.circle(cx - 2, cy - 3, 4, pal.foliageBright);
}

function drawVegetablePlanterBed(
  p: PixelPainter,
  x: number,
  y: number,
  cols: number,
  rows: number,
  pal: VillagePalette,
  cropKind: 'carrot' | 'cabbage' | 'tomato'
) {
  const bedW = cols * 16 + 8;
  const bedH = rows * 14 + 8;
  // Wooden Raised Bed Frame (Cozy Farming Asset Pack #8)
  p.rect(x, y, bedW, bedH, '#5C3419');
  p.rect(x, y, bedW, 1, K);
  p.rect(x, y + bedH - 1, bedW, 1, K);
  p.rect(x, y, 1, bedH, K);
  p.rect(x + bedW - 1, y, 1, bedH, K);
  p.rect(x + 3, y + 3, bedW - 6, bedH - 6, pal.soilBase);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = x + 10 + c * 16;
      const cy = y + 10 + r * 14;
      if (cropKind === 'carrot') {
        p.rect(cx - 3, cy - 4, 6, 4, pal.foliageMid);
        p.rect(cx - 2, cy - 5, 4, 2, pal.foliageBright);
        p.rect(cx - 1, cy - 1, 3, 4, '#EA6D23');
        p.px(cx, cy + 3, K);
      } else if (cropKind === 'cabbage') {
        p.circle(cx, cy - 1, 5, '#4A8E3D', K);
        p.circle(cx - 1, cy - 2, 3, '#83CE63');
        p.px(cx, cy - 1, '#C4F0A1');
      } else {
        // Tomato stakes with bright red berries
        p.rect(cx - 1, cy - 6, 2, 8, '#7A4926');
        p.circle(cx, cy - 2, 5, pal.foliageDeep, K);
        p.circle(cx, cy - 3, 4, pal.foliageMid);
        p.rect(cx - 3, cy - 3, 2, 2, '#E83A2E');
        p.rect(cx + 2, cy - 1, 2, 2, '#E83A2E');
      }
    }
  }
}

function drawTabbyCatWithHeart(p: PixelPainter, x: number, y: number) {
  // Pixel Speech Bubble Heart
  p.rect(x + 4, y - 15, 13, 10, '#FFFDF7');
  p.rect(x + 4, y - 16, 13, 1, K);
  p.rect(x + 3, y - 15, 1, 9, K);
  p.rect(x + 17, y - 15, 1, 9, K);
  p.rect(x + 5, y - 5, 11, 1, K);
  p.rect(x + 9, y - 4, 3, 2, '#FFFDF7');
  p.px(x + 8, y - 12, '#DF3E4E');
  p.px(x + 12, y - 12, '#DF3E4E');
  p.rect(x + 7, y - 11, 7, 2, '#DF3E4E');
  p.rect(x + 8, y - 9, 5, 1, '#DF3E4E');
  p.px(x + 10, y - 8, '#DF3E4E');

  // Sitting Orange-White Tabby Cat
  p.ellipse(x + 10, y + 10, 8, 3, 'rgba(0,0,0,0.2)');
  p.rect(x + 4, y + 2, 12, 9, '#F1A76A');
  p.rect(x + 5, y, 3, 3, '#F1A76A');
  p.rect(x + 12, y, 3, 3, '#F1A76A');
  p.rect(x + 6, y + 6, 8, 5, '#FFFDF7');
  p.px(x + 7, y + 4, K);
  p.px(x + 13, y + 4, K);
  p.px(x + 10, y + 6, '#E87D8A');
  p.rect(x + 4, y + 11, 12, 1, K);
}

interface PixelGardenCanvasProps {
  theme: string;
  weatherMode?: GardenWeatherMode;
  gridWidth: number;
  gridHeight: number;
  placements: GardenPlacementDTO[];
  placedPets?: PetCatalogItemDTO[];
  interactionMode: GardenInteractionMode;
  selectedPlacementId: string | null;
  hoveredTile: { x: number; y: number } | null;
  zoomLevel: number;
  onHoverTile: (tile: { x: number; y: number } | null) => void;
  onTileClick: (tileX: number, tileY: number) => void;
}

export function PixelGardenCanvas({
  theme,
  weatherMode = 'sunny',
  gridWidth,
  gridHeight,
  placements,
  placedPets = [],
  interactionMode,
  selectedPlacementId,
  hoveredTile,
  zoomLevel,
  onHoverTile,
  onTileClick
}: PixelGardenCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [boxSize, setBoxSize] = useState<{ w: number; h: number }>({ w: 800, h: 500 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setBoxSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
      }
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const geometry = useMemo(() => {
    const maxW = 360;
    const maxH = 196;
    const tileW = Math.max(18, Math.floor(maxW / Math.max(1, gridWidth)));
    const tileH = Math.max(12, Math.floor(maxH / Math.max(1, gridHeight)));
    const totalW = tileW * gridWidth;
    const totalH = tileH * gridHeight;
    const originX = Math.round((CANVAS_W - totalW) / 2);
    const originY = 128;
    return { tileW, tileH, totalW, totalH, originX, originY };
  }, [gridWidth, gridHeight]);

  const clientToTile = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const px = ((clientX - rect.left) / rect.width) * CANVAS_W;
    const py = ((clientY - rect.top) / rect.height) * CANVAS_H;

    const tileX = Math.floor((px - geometry.originX) / geometry.tileW);
    const tileY = Math.floor((py - geometry.originY) / geometry.tileH);

    if (tileX < 0 || tileX >= gridWidth || tileY < 0 || tileY >= gridHeight) {
      return null;
    }
    return { x: tileX, y: tileY };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pal = VILLAGE_PALETTES[theme] ?? VILLAGE_PALETTES.spring_meadow;
    const p = createPixelPainter(ctx, CANVAS_W, CANVAS_H);

    // 1. Lush Textured 3/4 Meadow Grass Field
    p.ditherRect(0, 0, CANVAS_W, CANVAS_H, pal.grassMain, pal.grassAlt, 4);

    // Subtle meadow wildflowers & clover grass tufts around courtyard edges
    for (let i = 0; i < 42; i += 1) {
      const hashX = ((i * 173 + 29) % (CANVAS_W - 24)) + 12;
      const hashY = ((i * 97 + 17) % (CANVAS_H - 24)) + 12;
      p.rect(hashX, hashY, 3, 2, pal.grassShade);
      p.px(hashX + 1, hashY - 1, pal.grassShade);
      if (i % 5 === 0) {
        p.px(hashX + 4, hashY, i % 10 === 0 ? '#FFF6D6' : '#F49AC0');
      }
    }

    // 2. Top Perimeter Wooden Fence & Stacked Golden Hay Bales (Ref Image 2)
    p.rect(0, 14, CANVAS_W, 3, '#9E683B');
    p.rect(0, 17, CANVAS_W, 1, K);
    for (let fx = 8; fx < CANVAS_W; fx += 22) {
      p.rect(fx, 6, 6, 15, '#B67B48');
      p.rect(fx, 6, 6, 1, K);
      p.rect(fx, 6, 1, 15, K);
      p.rect(fx + 5, 6, 1, 15, K);
    }
    for (const [hx, hy] of [
      [182, 22],
      [204, 24],
      [193, 14],
      [392, 22],
      [412, 24]
    ]) {
      p.ellipse(hx, hy, 11, 7, '#E69F38', K);
      p.ellipse(hx - 1, hy - 2, 7, 4, '#F9CB54');
    }

    // 3. Winding Tan Dirt Village Roads (Routing cleanly AROUND the courtyard garden beds)
    // Upper courtyard avenue beneath Farmhouse, Well, and Barn
    p.rect(92, 102, 438, 20, pal.pathEdge);
    p.rect(96, 104, 430, 16, pal.pathCenter);
    // Stub connecting Well down onto upper avenue
    p.rect(294, 72, 34, 34, pal.pathEdge);
    p.rect(297, 74, 28, 30, pal.pathCenter);
    // Lower promenade leading across Wooden Bridge
    p.rect(112, 318, 416, 20, pal.pathEdge);
    p.rect(115, 320, 410, 16, pal.pathCenter);
    // Left & Right Vertical Paths connecting upper avenue to lower promenade
    p.rect(112, 110, 24, 224, pal.pathEdge);
    p.rect(115, 112, 18, 220, pal.pathCenter);
    p.rect(504, 110, 24, 224, pal.pathEdge);
    p.rect(507, 112, 18, 220, pal.pathCenter);

    // 4. Sparkling Blue Farm Canal / Pond at Lower Tier + Wooden Plank Bridge (Ref Images 1 & 2)
    const canalY = 338;
    const canalH = 44;
    p.rect(0, canalY - 3, CANVAS_W, 4, '#6E4F33');
    p.rect(0, canalY + canalH, CANVAS_W, 3, '#6E4F33');
    p.rect(0, canalY, CANVAS_W, canalH, pal.waterDeep);
    p.rect(0, canalY + 2, CANVAS_W, canalH - 6, pal.waterMid);
    p.rect(0, canalY + 1, CANVAS_W, 4, pal.waterShore);
    // Crisp horizontal water sparkle ripples
    for (let wx = 14; wx < CANVAS_W - 20; wx += 34) {
      const wy = canalY + 10 + ((wx * 3) % 22);
      p.rect(wx, wy, 10, 2, pal.waterGlint);
      p.rect(wx + 16, wy + 5, 6, 1, pal.waterShore);
    }

    // Wooden Plank Bridge Spanning Canal onto Dirt Path
    const bridgeX = 282;
    p.rect(bridgeX - 2, canalY - 4, 62, canalH + 8, K);
    p.rect(bridgeX, canalY - 2, 58, canalH + 4, '#A66D3B');
    for (let py = canalY; py < canalY + canalH; py += 6) {
      p.rect(bridgeX + 2, py, 54, 4, '#C48850');
      p.rect(bridgeX + 2, py + 4, 54, 1, '#784A23');
    }
    // Bridge Side Railings
    p.rect(bridgeX, canalY - 5, 5, canalH + 10, '#784A23');
    p.rect(bridgeX + 53, canalY - 5, 5, canalH + 10, '#784A23');
    p.rect(bridgeX + 1, canalY - 6, 3, 4, '#DFA066');
    p.rect(bridgeX + 54, canalY - 6, 3, 4, '#DFA066');

    // 5. Landmark Architecture, Trees & Side Raised Vegetable Beds
    drawShingledCozyFarmhouse(p, 16, 12, pal);
    drawRedBarnSiloAndWindmill(p, 434, 16, pal);
    drawRoofedStoneWell(p, 311, 56, pal);

    // Scenic Vegetable & Flower Planter Beds flanking Farmhouse & Barn
    drawVegetablePlanterBed(p, 20, 198, 4, 2, pal, 'carrot');
    drawVegetablePlanterBed(p, 536, 134, 5, 2, pal, 'tomato');
    drawVegetablePlanterBed(p, 540, 248, 4, 2, pal, 'cabbage');

    // Fruit Trees along left & right pasture margins
    drawFruitTree(p, 58, 174, pal, '#EB4D3D');
    drawFruitTree(p, 48, 296, pal, '#F59E0B');
    drawFruitTree(p, 594, 204, pal, '#EB4D3D');
    drawFruitTree(p, 248, 48, pal, '#EB4D3D');
    drawFruitTree(p, 372, 48, pal, '#F59E0B');

    // 6. Central Interactive 3/4 Orthographic Garden Plot Courtyard
    // Outer courtyard timber frame fence border
    p.rect(
      geometry.originX - 4,
      geometry.originY - 4,
      geometry.totalW + 8,
      geometry.totalH + 8,
      'rgba(104, 63, 35, 0.35)'
    );
    p.rect(
      geometry.originX - 2,
      geometry.originY - 2,
      geometry.totalW + 4,
      geometry.totalH + 4,
      pal.grassMain
    );

    const placementMap = new Map<string, GardenPlacementDTO>();
    for (const pl of placements) {
      placementMap.set(`${pl.tileX},${pl.tileY}`, pl);
    }

    // Render tiles cleanly in 3/4 orthographic grid
    for (let ty = 0; ty < gridHeight; ty += 1) {
      for (let tx = 0; tx < gridWidth; tx += 1) {
        const tileXPos = geometry.originX + tx * geometry.tileW;
        const tileYPos = geometry.originY + ty * geometry.tileH;
        const existing = placementMap.get(`${tx},${ty}`);
        const isHovered = hoveredTile?.x === tx && hoveredTile?.y === ty;
        const isSelected = existing !== undefined && existing.id === selectedPlacementId;
        const isPlanted = existing?.category === 'plant' || existing?.category === 'seed';

        // Subtle checkerboard grass variation inside garden courtyard
        const tileTint = (tx + ty) % 2 === 0 ? pal.grassMain : '#8DC65D';
        p.rect(tileXPos, tileYPos, geometry.tileW, geometry.tileH, tileTint);
        // Subtle 1px grass plot corner tick so buildable grid is easy to aim
        p.px(tileXPos, tileYPos, 'rgba(54, 92, 34, 0.38)');

        // Fertile Tilled Soil Tile beneath Plants & Seeds (Ref Image 1)
        if (isPlanted) {
          p.rect(
            tileXPos + 1,
            tileYPos + 1,
            geometry.tileW - 2,
            geometry.tileH - 2,
            pal.soilBorder
          );
          p.rect(
            tileXPos + 2,
            tileYPos + 2,
            geometry.tileW - 4,
            geometry.tileH - 4,
            pal.soilBase
          );
          // Tilled horizontal soil ridges
          for (let ry = tileYPos + 4; ry < tileYPos + geometry.tileH - 3; ry += 4) {
            p.rect(tileXPos + 4, ry, geometry.tileW - 8, 1, pal.soilRidge);
            p.rect(tileXPos + 4, ry + 1, geometry.tileW - 8, 1, pal.soilDark);
          }
        }

        // Crisp 3/4 Pixel Hover & Selection Reticle
        if (isSelected || isHovered) {
          const borderCol = isSelected
            ? '#FFF078'
            : interactionMode === 'remove' && existing
              ? '#FCA5A5'
              : '#FFFDF0';
          const fillCol = isSelected
            ? 'rgba(255, 240, 120, 0.32)'
            : interactionMode === 'remove' && existing
              ? 'rgba(248, 113, 113, 0.32)'
              : 'rgba(255, 255, 255, 0.22)';
          p.rect(tileXPos, tileYPos, geometry.tileW, geometry.tileH, fillCol);
          p.rect(tileXPos, tileYPos, geometry.tileW, 2, borderCol);
          p.rect(tileXPos, tileYPos + geometry.tileH - 2, geometry.tileW, 2, borderCol);
          p.rect(tileXPos, tileYPos, 2, geometry.tileH, borderCol);
          p.rect(tileXPos + geometry.tileW - 2, tileYPos, 2, geometry.tileH, borderCol);
        }
      }
    }

    // 7. Row-Sorted Placed Items Drawn Centered Inside Each 3/4 Tile
    const sortedPlacements = [...placements].sort((a, b) => {
      if (a.tileY !== b.tileY) return a.tileY - b.tileY;
      return a.tileX - b.tileX;
    });

    for (const pl of sortedPlacements) {
      const spec = ITEM_SPRITE_SPECS[pl.spriteKey] ?? ITEM_SPRITE_SPECS.sprout_pot;
      const cx = geometry.originX + pl.tileX * geometry.tileW + Math.floor(geometry.tileW / 2);
      const bottomY = geometry.originY + pl.tileY * geometry.tileH + geometry.tileH - 2;
      p.ellipse(cx, bottomY, 8, 3, 'rgba(0,0,0,0.22)');
      p.stampMatrix(spec.grid, spec.palette, cx - 12, bottomY - 21, 1);
    }

    // 8. Courtyard & Pasture Details (Cows, Sheep, Cat, Shrubs, Flower Bushes)
    drawSpottedCow(p, 538, 188);
    drawSpottedCow(p, 540, 294);
    drawFluffySheep(p, 576, 300);
    drawFluffySheep(p, 598, 292);
    drawFluffySheep(p, 72, 248);
    drawTabbyCatWithHeart(p, 152, 92);

    // Friendly static straw-hat village gardener near central well (scenic only)
    const gx = 272;
    const gy = 82;
    p.ellipse(gx + 5, gy + 15, 5, 2, 'rgba(0,0,0,0.22)');
    p.rect(gx + 1, gy + 1, 8, 2, '#E6B85C'); // Straw brim
    p.rect(gx + 3, gy - 1, 4, 2, '#C89236');
    p.rect(gx + 3, gy + 3, 4, 3, '#FCE0BE');
    p.rect(gx + 2, gy + 6, 6, 6, '#3B6EA8'); // Denim overalls
    p.rect(gx + 2, gy + 12, 2, 3, '#4A2C16');
    p.rect(gx + 6, gy + 12, 2, 3, '#4A2C16');

    // Bottom bank shrubs & detailed pixel flower bushes flanking the promenade
    drawShrub(p, 82, 320, pal);
    drawFlowerBush(p, 102, 322, '#F472B6', pal);
    drawFlowerBush(p, 218, 324, '#F472B6', pal);
    drawFlowerBush(p, 384, 324, '#FACC15', pal);
    drawFlowerBush(p, 462, 322, '#A78BFA', pal);
    drawShrub(p, 482, 320, pal);

    // 9. Deployed Collectible Pet Companions Walking/Sitting in Garden Courtyard (M3.3)
    placedPets.forEach((pet, idx) => {
      const petTileX = Math.max(
        0,
        Math.min(gridWidth - 1, pet.tileX ?? ((idx * 3 + 2) % gridWidth))
      );
      const petTileY = Math.max(
        0,
        Math.min(gridHeight - 1, pet.tileY ?? (1 + Math.floor((idx * 2) % gridHeight)))
      );
      const cx = geometry.originX + petTileX * geometry.tileW + Math.floor(geometry.tileW / 2);
      const bottomY = geometry.originY + petTileY * geometry.tileH + geometry.tileH - 2;
      const petSpec = resolvePetSpriteSpec(pet.species, pet.spriteKey);
      p.stampMatrix(petSpec.grid, petSpec.palette, cx - 16, bottomY - 26, 1);

      // Tiny pixel name badge & floating heart indicator above placed pet
      p.px(cx + 10, bottomY - 27, '#E24B5B');
      p.px(cx + 12, bottomY - 27, '#E24B5B');
      p.rect(cx + 9, bottomY - 26, 5, 2, '#E24B5B');
      p.px(cx + 11, bottomY - 24, '#E24B5B');
    });

    // 10. Dynamic Pixel Weather & Atmosphere Overlay (M3.3)
    if (weatherMode === 'rain') {
      p.rect(0, 0, CANVAS_W, CANVAS_H, 'rgba(26, 50, 86, 0.24)');
      for (let i = 0; i < 68; i += 1) {
        const rx = (i * 53 + 17) % (CANVAS_W - 8);
        const ry = (i * 37 + 11) % (CANVAS_H - 12);
        p.rect(rx, ry, 1, 5, '#BAE6FD');
        p.px(rx - 1, ry + 5, '#7DD3FC');
        if (i % 4 === 0) {
          p.rect(rx - 2, ry + 8, 3, 1, 'rgba(224, 242, 254, 0.65)');
        }
      }
    } else if (weatherMode === 'petals') {
      p.rect(0, 0, CANVAS_W, CANVAS_H, 'rgba(255, 224, 238, 0.08)');
      for (let i = 0; i < 46; i += 1) {
        const pxX = (i * 71 + 19) % (CANVAS_W - 8);
        const pyY = (i * 41 + 23) % (CANVAS_H - 8);
        const petalCol = i % 3 === 0 ? '#F9A8D4' : i % 3 === 1 ? '#FBCFE8' : '#FFF1F2';
        p.rect(pxX, pyY, 2, 2, petalCol);
        p.px(pxX + 2, pyY + 1, petalCol);
      }
    } else if (weatherMode === 'starlight') {
      p.rect(0, 0, CANVAS_W, CANVAS_H, 'rgba(12, 20, 54, 0.44)');
      // Warm glow around farmhouse & lanterns in starlight mode
      p.ellipse(42, 82, 16, 10, 'rgba(255, 224, 120, 0.28)');
      p.ellipse(116, 82, 16, 10, 'rgba(255, 224, 120, 0.28)');
      for (let i = 0; i < 34; i += 1) {
        const fx = (i * 89 + 31) % (CANVAS_W - 12);
        const fy = (i * 59 + 13) % (CANVAS_H - 12);
        const spark = i % 2 === 0 ? '#67E8F9' : '#FEF08A';
        p.px(fx, fy, '#FFFFFF');
        p.px(fx - 1, fy, spark);
        p.px(fx + 1, fy, spark);
        p.px(fx, fy - 1, spark);
        p.px(fx, fy + 1, spark);
      }
    }
  }, [
    theme,
    weatherMode,
    gridWidth,
    gridHeight,
    placements,
    placedPets,
    interactionMode,
    selectedPlacementId,
    hoveredTile,
    geometry
  ]);

  const availW = Math.max(320, boxSize.w);
  const availH = Math.max(200, boxSize.h);
  const baseScale = Math.min(availW / CANVAS_W, availH / CANVAS_H);
  const displayW = Math.max(320, Math.floor(CANVAS_W * baseScale * zoomLevel));
  const displayH = Math.max(200, Math.floor(CANVAS_H * baseScale * zoomLevel));

  return (
    <div
      ref={wrapperRef}
      className="flex h-full w-full items-center justify-center overflow-auto bg-[#77B049]"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          width: `${displayW}px`,
          height: `${displayH}px`
        }}
        className="pixel-art block shrink-0 cursor-pointer select-none"
        onMouseMove={(e) => onHoverTile(clientToTile(e.clientX, e.clientY))}
        onMouseLeave={() => onHoverTile(null)}
        onClick={(e) => {
          const hit = clientToTile(e.clientX, e.clientY);
          if (hit) {
            onTileClick(hit.x, hit.y);
          }
        }}
      />
    </div>
  );
}
