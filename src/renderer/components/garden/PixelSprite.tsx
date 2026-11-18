import { useEffect, useRef } from 'react';
import type { AchievementCategory } from '@shared/types/domain';
import { createPixelPainter } from './pixelCanvasUtils';

interface PixelSpriteProps {
  spriteKey: string;
  size?: number;
  className?: string;
}

export interface PixelMatrixSpec {
  grid: readonly string[];
  palette: Record<string, string>;
  label: string;
}

interface PixelRun {
  x: number;
  y: number;
  width: number;
  color: string;
}

function compilePixelRuns(
  grid: readonly string[],
  palette: Record<string, string>
): { width: number; height: number; runs: PixelRun[] } {
  const height = grid.length;
  const width = grid.reduce((max, row) => Math.max(max, row.length), 0);
  const runs: PixelRun[] = [];

  for (let y = 0; y < height; y += 1) {
    const row = grid[y] ?? '';
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (!ch || ch === '.' || ch === ' ') {
        x += 1;
        continue;
      }
      const color = palette[ch];
      if (!color) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === ch) {
        end += 1;
      }
      runs.push({ x, y, width: end - x, color });
      x = end;
    }
  }

  return { width, height, runs };
}

function PixelMatrix({
  spec,
  size,
  className = ''
}: {
  spec: PixelMatrixSpec;
  size: number;
  className?: string;
}) {
  const { width, height, runs } = compilePixelRuns(spec.grid, spec.palette);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${width} ${height}`}
      shapeRendering="crispEdges"
      className={`pixel-art select-none ${className}`}
      role="img"
      aria-label={spec.label}
    >
      {runs.map((run, idx) => (
        <rect
          key={`${run.y}-${run.x}-${idx}`}
          x={run.x}
          y={run.y}
          width={run.width}
          height={1}
          fill={run.color}
        />
      ))}
    </svg>
  );
}

// ============================================================================
// 1. 24x24 HIGH-DETAIL ITEM & TOOL SPRITES (SHARED WITH CANVAS WORLD)
// ============================================================================

export const ITEM_SPRITE_SPECS: Record<string, PixelMatrixSpec> = {
  sprout_pot: {
    label: 'Sprout Pot',
    palette: {
      k: '#2B1B17',
      g: '#529E44',
      l: '#83D15E',
      d: '#366E2E',
      s: '#6A4428',
      t: '#CF7043',
      T: '#EA9160',
      b: '#9E4D2B'
    },
    grid: [
      '........................',
      '........................',
      '......kkkk....kkkk......',
      '.....kllllk..kllllk.....',
      '....klgggglkkggggggk....',
      '....kggddgggggddgggk....',
      '.....kkddddkdddddkk.....',
      '.......kkkkdkkkkk.......',
      '..........kdk...........',
      '..........kdk...........',
      '.........ksssk..........',
      '.....kkkkkkkkkkkkkk.....',
      '....kTTTTTTTTTTTTTTk....',
      '....kttttttttttttbbk....',
      '.....kkkkkkkkkkkkkk.....',
      '.....ktttttttttttbbk....',
      '.....kttTttttttttbbk....',
      '......ktttttttttbbk.....',
      '......ktttttttttbbk.....',
      '.......ktttttttbbk......',
      '.......kbbbbbbbbbk......',
      '........kkkkkkkkk.......',
      '........................',
      '........................'
    ]
  },

  sunlit_daisy: {
    label: 'Sunlit Daisy',
    palette: {
      k: '#2B1B17',
      w: '#FFFDF7',
      c: '#EAE2CE',
      y: '#F9D649',
      o: '#E0922B',
      g: '#4F9E43',
      l: '#7ED05E',
      d: '#336C2E',
      t: '#C86D43',
      b: '#944727'
    },
    grid: [
      '........................',
      '.........kkkkkk.........',
      '........kwwwwwwk........',
      '.....kkkkwwccwwkkkk.....',
      '....kwwwwkkyykkwwwwk....',
      '....kwwcwkyyyykcwwwk....',
      '....kwwwwkyooykwwwwk....',
      '.....kkkkkyyyykckkk.....',
      '....kwwcckkyykkwwcwk....',
      '....kwwwwkkcckkwwwwk....',
      '.....kkkkwwwwwwkkkk.....',
      '........kwwwwwwk........',
      '.........kkggkk.........',
      '.....kkk...kgk...kkk....',
      '....kllgk..kgk..kgllk...',
      '.....kddgk.kgk.kgddk....',
      '......kkkk.kdk.kkkk.....',
      '......kkkkkkkkkkkk......',
      '.....kttttttttttbbk.....',
      '......kkkkkkkkkkkk......',
      '......kttttttttbbk......',
      '.......kbbbbbbbbk.......',
      '........kkkkkkkk........',
      '........................'
    ]
  },

  lavender_bush: {
    label: 'Lavender Bush',
    palette: {
      k: '#2B1B17',
      p: '#A27BEA',
      P: '#C9AEFF',
      v: '#734FBD',
      g: '#558B4D',
      l: '#7BB569',
      d: '#375E32'
    },
    grid: [
      '........................',
      '.........kk..kk.........',
      '....kk..kPPkkPPk..kk....',
      '...kPPk.kppkkppk.kPPk...',
      '...kppkkPvvkPppvkkppk...',
      '...kvvkppPPkppPPkkvvk...',
      '....kkpvvkpppvkppvkk....',
      '..kk..kppkkggkkppk..kk..',
      '.kPPk.kvvkllllkvvk.kPPk.',
      '.kppkkllkllggllkllkkppk.',
      '.kvvkllggggggggggllkvvk.',
      '..kkllggPPggggPPggllkk..',
      '..klgggppggPPggppggglk..',
      '.klggggvvgppggvvggggglk.',
      '.kggggggggvvggggggggddk.',
      '.kggdggggggggggggggdddk.',
      '..kdddggggggggggggdddk..',
      '..kddddddggggggddddddk..',
      '...kddddddddddddddddk...',
      '....kkkkkkkkkkkkkkkk....',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  stepping_stone: {
    label: 'Stepping Stone',
    palette: {
      k: '#2B1B17',
      s: '#B7B2A8',
      h: '#DEDAD0',
      m: '#8F8A80',
      d: '#635F58',
      g: '#5D9B4A',
      l: '#84C666'
    },
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '.......kkkkkkkkkk.......',
      '.....kkhhhhhhhhhhkk.....',
      '....khhsssssssssshhk....',
      '...khssshhssssmsssssk...',
      '..khsssmmsssssmmsssssk..',
      '..ksssmsssssssdmssssmk..',
      '..ksssssssssssdmmssmmk..',
      '..kssmmssggsssssssmmmk..',
      '..kssmdslgllssssmmmmmk..',
      '...kmmmdkggksssmmmmmdk..',
      '...kddmmkkkkmmmmmmdddk..',
      '....kdddddddddddddddk...',
      '.....kkdddddddddddkk....',
      '.......kkkkkkkkkkk......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  wooden_lantern: {
    label: 'Wooden Lantern',
    palette: {
      k: '#2B1B17',
      w: '#8E5835',
      W: '#B4764B',
      d: '#5E3820',
      y: '#FFE885',
      Y: '#FFF7D0',
      o: '#F0A83A'
    },
    grid: [
      '........................',
      '..........kkkk..........',
      '........kkWWWWkk........',
      '......kkWWWWWWWWkk......',
      '....kkwwwwwwwwwwwwkk....',
      '...kddddddddddddddddk...',
      '....kkkkwwwwwwwwkkkk....',
      '......kwwyyyyyywwk......',
      '......kwyyYYYYyywk......',
      '......kwyYYYYYYywk......',
      '......kwyYYyyYYywk......',
      '......kwoyyyyyyowk......',
      '......kwwoooooowwk......',
      '......kddddddddddk......',
      '.......kkkkkkkkkk.......',
      '.........kWWWWk.........',
      '.........kwwddk.........',
      '.........kwwddk.........',
      '........kkwwddkk........',
      '.......kWWWWWWWWk.......',
      '.......kddddddddk.......',
      '........kkkkkkkk........',
      '........................',
      '........................'
    ]
  },

  watering_can: {
    label: 'Flower Watering Can',
    palette: {
      k: '#1F1B24',
      b: '#91AAFA',
      B: '#B8CAFF',
      s: '#6A83DC',
      n: '#383F73',
      N: '#4E5794',
      g: '#CBD5E1',
      G: '#8998AD',
      w: '#FFFDF5',
      y: '#E69D3A'
    },
    grid: [
      '........................',
      '.............kkkkkk.....',
      '...........kkNNNNNNkk...',
      '..........kNNkkkkkkNNk..',
      '.........kNNk......kNNk.',
      '........kNNNNkkkk..kNNk.',
      '.......kNNNNNNNNNk.kNNk.',
      '..kk...knnnnnnnnnk.kNNk.',
      '.kggk...kBBBBBBBBk.kNNk.',
      'kggGk...kBBbbbbbbkkNNk..',
      'kgkGk..kBbbbbbbbbbbNNk..',
      'kggGkk.kBbbbwwwbbbbbsk..',
      '.kggGkkkBbbwyyywbbbbsk..',
      '..kGGbbbbbbwyyywbbbssk..',
      '...kGbbbbbbbwwwbbbsssk..',
      '....kkbbbbbwwwwwbsssk...',
      '......kbbbbbbbbssssk....',
      '......kbbbbbbbsssssk....',
      '......kbbssssssssssk....',
      '.......kssssssssssk.....',
      '........kkkkkkkkkk......',
      '........................',
      '........................',
      '........................'
    ]
  },

  sunflower_seed: {
    label: 'Sunflower Seed Bag',
    palette: {
      k: '#2B1B17',
      p: '#D59D63',
      P: '#EDBE88',
      d: '#A66E3E',
      r: '#FFF1D2',
      y: '#F7CE46',
      o: '#8C4D22',
      g: '#559642'
    },
    grid: [
      '........................',
      '........kkkkkkkk........',
      '.......kPPPPPPPPk.......',
      '.......kpddppddpk.......',
      '........krrrrrrk........',
      '.......kPPPPPPPPk.......',
      '......kPPpppppppdk......',
      '.....kPPppyyyyppddk.....',
      '.....kPppyyooyyppdk.....',
      '....kPPppyoookyppddk....',
      '....kPpppyyooyyppddk....',
      '....kPppppyyyypppddk....',
      '....kPpppppggppppddk....',
      '....kPppppggggpppddk....',
      '....kpddppppppppdddk....',
      '.....kpdddddddddddk.....',
      '.....kddddddddddddk.....',
      '......kkkkkkkkkkkk......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  moonflower_seed: {
    label: 'Moonflower Seed Bag',
    palette: {
      k: '#221730',
      p: '#6B5BA6',
      P: '#8D7EC9',
      d: '#493C7A',
      r: '#CBE8FF',
      c: '#9CEBFF',
      w: '#FFFFFF',
      s: '#73C2F0'
    },
    grid: [
      '........................',
      '........kkkkkkkk........',
      '.......kPPPPPPPPk.......',
      '.......kpddppddpk.......',
      '........krrrrrrk........',
      '.......kPPPPPPPPk.......',
      '......kPPpppppppdk......',
      '.....kPPppccwwppddk.....',
      '.....kPppcwcpppppdk.....',
      '....kPPppwcppppppddk....',
      '....kPpppwcppppppddk....',
      '....kPpppcwcpppppddk....',
      '....kPppppccwwpppddk....',
      '....kPpppssssspppddk....',
      '....kpddppppppppdddk....',
      '.....kpdddddddddddk.....',
      '.....kddddddddddddk.....',
      '......kkkkkkkkkkkk......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  cherry_bonsai: {
    label: 'Cherry Blossom Bonsai',
    palette: {
      k: '#2B1B17',
      p: '#F9A8D4',
      P: '#FCE7F3',
      m: '#E46AA7',
      w: '#7D4D33',
      W: '#A36B4A',
      c: '#4B8E8D',
      C: '#6DB3B2'
    },
    grid: [
      '........................',
      '......kkkkkk............',
      '....kkPPPPPPkk..........',
      '...kPPppppppppkk..kkkk..',
      '..kPPppmmmppppppkkPPPPk.',
      '..kppmmmmppppmmpppPpppk.',
      '...kkmmkkppkkmmmppppmmk.',
      '.....kkkkwk.kkkmmmmmkk..',
      '.......kWWk....kkkkk....',
      '........kWWkkkwwk.......',
      '........kWWWWWWk........',
      '.........kkWWwk.........',
      '..........kWWk..........',
      '.........kWWwk..........',
      '........kWWwwk..........',
      '....kkkkkkkkkkkkkk......',
      '...kCCCCCCCCCCCCCCk.....',
      '...kcccccccccccccck.....',
      '....kcccccccccccck......',
      '.....kkkkkkkkkkkk.......',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  crystal_lotus: {
    label: 'Crystal Lotus',
    palette: {
      k: '#1E1A36',
      c: '#6BF2FF',
      C: '#D6FFFF',
      b: '#37B7E8',
      v: '#C688FF',
      g: '#3C857A',
      l: '#63B8A2'
    },
    grid: [
      '........................',
      '...........kk...........',
      '..........kCCk..........',
      '.........kCccCk.........',
      '......kkkCcCCcCkkk......',
      '.....kCCkcCCCCckCCk.....',
      '....kCcckCccccCkccCk....',
      '...kCccbcCccccCcbccCk...',
      '...kcbvbkcbbbbckbvbck...',
      '..kccvbkccbbbbcckbvcck..',
      '..kcbbkccbbvvbbcckbbck..',
      '...kkkllkkkkkkkkllkkk...',
      '...kllllggggggggllllk...',
      '....kggggggggggggggk....',
      '.....kkkkkkkkkkkkkk.....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  pruning_shears: {
    label: 'Pruning Shears',
    palette: {
      k: '#2B1B17',
      s: '#CBD5E1',
      S: '#F8FAFC',
      d: '#64748B',
      y: '#EAB308',
      r: '#D96B43',
      R: '#F29368'
    },
    grid: [
      '........................',
      '........kk....kk........',
      '.......kSSk..kSSk.......',
      '......kSssk..kssSk......',
      '......kssdk..kdssk......',
      '.......kssk..kssk.......',
      '.......ksdk..kdsk.......',
      '........kskkksk.........',
      '.........ksyyk..........',
      '.........ksssk..........',
      '........kRRkRRk.........',
      '.......kRRrkrrRk........',
      '......kRRrk..krrRk......',
      '.....kRRrk....krrRk.....',
      '....kRRrk......krrRk....',
      '....krrk........krrk....',
      '.....kk..........kk.....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  solar_dew_collector: {
    label: 'Solar Dew Collector',
    palette: {
      k: '#2B1B17',
      c: '#7CE8FF',
      C: '#DDFBFF',
      b: '#3B9ED8',
      g: '#EAB308',
      G: '#FDE047',
      o: '#A16207',
      s: '#94A3B8'
    },
    grid: [
      '........................',
      '.........kkkkkk.........',
      '.......kkGGGGGGkk.......',
      '......kGGCCCCCCGGk......',
      '.....kGCccccccccCGk.....',
      '.....kCcCCccccccbbk.....',
      '.....kCccccCCcccbbk.....',
      '.....kccccccccbbbbk.....',
      '......kggggggggggk......',
      '......kooooooooook......',
      '.......kssssssssk.......',
      '........kssssssk........',
      '........ksCCCCsk........',
      '........ksccccsk........',
      '........ksbbbbsk........',
      '.......kggggggggk.......',
      '......kGGggggggook......',
      '.....kooooooooooook.....',
      '......kkkkkkkkkkkk......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  greenhouse_lamp: {
    label: 'Greenhouse Lamp',
    palette: {
      k: '#241D24',
      i: '#475569',
      I: '#64748B',
      y: '#FDE047',
      Y: '#FEF9C3',
      o: '#F59E0B',
      g: '#4F9E43'
    },
    grid: [
      '........................',
      '..........kkkk..........',
      '.........kIIIIk.........',
      '........kiikiiik........',
      '.......kkkkkkkkkk.......',
      '......kIIIIIIIIIIk......',
      '.......kYYYYYYYYk.......',
      '......kYYyyyyyyYYk......',
      '......kYyyYYYYyyYk......',
      '......kYyYYYYYYyYk......',
      '......koyyyyyyyyok......',
      '......koooooooooik......',
      '.......kkkkkkkkkk.......',
      '........kIIIIIIk........',
      '.........kiiiik.........',
      '........kIIIIIIk........',
      '.......kiiiiggiiik......',
      '......kIIIIIIIIIIIk.....',
      '.......kkkkkkkkkkk......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  },

  gacha_ticket: {
    label: 'Pet Companion Ticket',
    palette: {
      k: '#2B1B17',
      y: '#F7C948',
      Y: '#FFF2A6',
      o: '#C78522',
      b: '#4C5DA6',
      w: '#FFFFFF'
    },
    grid: [
      '........................',
      '........................',
      '........................',
      '........................',
      '....kkkkkkkkkkkkkkkk....',
      '...kYYYYYYYYYYYYYYYYk...',
      '..kYYyyyyyyyyyyyyyyYYk..',
      '..kYybbbbbbYYbbbbbbYYk..',
      '...kYbbbbbbYYbbbbbbYk...',
      '..kYYbbyyyyYYyyyybbYYk..',
      '..kYYbbywyyYYyywybbYYk..',
      '..kYYbbyyyyYYyyyybbYYk..',
      '...kYbbbbbbYYbbbbbbYk...',
      '..kYYboooooYYooooobYYk..',
      '..kYyyyyyyyyyyyyyyyyYk..',
      '...kkooooooooooooookk...',
      '....kkkkkkkkkkkkkkkk....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................'
    ]
  }
};

// ============================================================================
// 2. 32x32 ACHIEVEMENT BOOK ILLUSTRATIONS (REFERENCE IMAGE 3)
// ============================================================================

const ACHIEVEMENT_SPECS: Record<AchievementCategory, PixelMatrixSpec> = {
  focus_master: {
    label: 'Star Trophy Illustration',
    palette: {
      k: '#5A3A12',
      y: '#F2C13E',
      Y: '#FFF08F',
      o: '#CA8B22',
      b: '#9E6817',
      w: '#8F5818',
      W: '#F7D259'
    },
    grid: [
      '................................',
      '...............kk...............',
      '......kk.......kyk..............',
      '.....kYYk.....kYYyk.............',
      '...kkYyyYkk...kYYyk.............',
      '....kkYYkk....kYYyk.............',
      '......kk.....kYYYYyk............',
      '..kk.........kYyyyok............',
      '.kYYk..kkkkkkkkYyyokkkkkkk......',
      '..kk..kYYYYYYYYyyyoyyyyyook.....',
      '.......kYYYYyyyyyyoyyyook.......',
      '........kYYYyyyyyoooyook........',
      '.........kYYyyyyooooyok.........',
      '.........kYyyyyyooyyook....kk...',
      '........kYYyyyykkooyyook..kYYk..',
      '........kYYyykk..kkooyok...kk...',
      '.......kYyykk..kk..kkoook.......',
      '.......kkk...kkYYk...kkk..kk....',
      '............kYYyyok......kYYk...',
      '..........kkYYyyyyokk.....kk....',
      '.........kYYYYyyyyyook..........',
      '........kbbbbbbbbbbbbbk.........',
      '.......kkkkkkkkkkkkkkkkk........',
      '......kbbbbbbbbbbbbbbbbbk.......',
      '......kbbWWWWWWWWWWWWbbbk.......',
      '......kbbWWWWWWWWWWWWbbbk.......',
      '......kbbbbbbbbbbbbbbbbbk.......',
      '.....kwwwwwwwwwwwwwwwwwwwk......',
      '.....kkkkkkkkkkkkkkkkkkkkk......',
      '................................',
      '................................',
      '................................'
    ]
  },

  green_thumb: {
    label: 'Gardener Watering Can Illustration',
    palette: {
      k: '#16161D',
      b: '#93ABFC',
      B: '#B8C9FF',
      s: '#6A83DF',
      n: '#383E72',
      N: '#4E5793',
      g: '#C5CEDE',
      G: '#8996B0',
      w: '#ECE1BF',
      y: '#DC9B48'
    },
    grid: [
      '................................',
      '..................kkkkkkk.......',
      '................kkNNNNNNNkk.....',
      '...............kNNkkkkkkkNNk....',
      '..............kNNk.......kNNk...',
      '............kkNNNNkkkk...kNNk...',
      '..........kkNNNNNNNNNNkk.kNNk...',
      '.........kNNNNNNNNNNNNNNkkNNk...',
      '.........kNNNNnnnnnnnnnnNkNNk...',
      '..........kkkkBBBBBBBBkkkNNk....',
      '..kkkk......kBBBbbbbbbbbNNNk....',
      '.kggggk.....kBBbbbbbbbbbbNNk....',
      'kggkkggk....kBBbbwwbbbbbbbsk....',
      'kgkggkGk....kBbbwkkwbbbbbbsskk..',
      'kggGkGgk....kBbwyyyywbbbwbbssk..',
      'kggGkGgkk..kBBbwykkywbwwwbbssk..',
      '.kGggGGGkk.kBbbwyyyywwwwbbbssk..',
      '..kGGbbbbkkkBbbbwkkwwwwwbbbssk..',
      '...kkGGbbbbbbbbbbwwbbwwwbbsssk..',
      '.....kkGbbbbbbbbbwwwwwbbbbsssk..',
      '.......kkbbbbbbbbbbbbbbbsssssk..',
      '.........kbbbbbbbbbbbbbbssssk...',
      '.........kbbbbbsssssssssssssk...',
      '..........kbbbbssssssssssssk....',
      '...........kkkkkkkkkkkkkkkk.....',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  consistency: {
    label: 'Dedicated Sleeping Cat Illustration',
    palette: {
      k: '#6B3420',
      o: '#F5AB65',
      O: '#FFD39E',
      s: '#DF843F',
      d: '#B85C28',
      p: '#F497A6',
      w: '#FFF3DF'
    },
    grid: [
      '................................',
      '................................',
      '.............kkkkkkkkk..........',
      '..........kkkOOOOOOOOOkkk.......',
      '........kkOOOOssOOOssOOOOkk.....',
      '.......kOOOOOossoOossoOOOOOk....',
      '......kOOOooooooooooooooooOOk...',
      '..kk..kOOoooooooooossooooooOOk..',
      '.kppkkOOoooOOOOssOossoooooooOk..',
      '.kpOkkOOooOOOOOoooooossssooooOk.',
      '..kOOoOOOOOossssoooooooooooooOk.',
      '..kOOOOOOOooooOOOOOoooossssooOk.',
      '..kOOkkOOkOOooOOOOooOOOOooooOOk.',
      '..kOwwwwwwwwOOOOOOOooooooooooOk.',
      '..kOwwwwwppwwwwOOOOoosssooooOOk.',
      '..kOwwwwwwwwwwwOOOOooooooosssOk.',
      '..kkOwwwwkkwwwOOddOOOOOOOOOOsOk.',
      '...kOOwkkkkwwOdddOOOOOOOOOssOk..',
      '...kOwwwwwwwOOddooOOOOOOssddOk..',
      '....kOwwkkwOOOoooOOOOOsssdddk...',
      '....kOOOOOkkOwwwwOOOOOOOOddk....',
      '.....kkkkkkkkwwwwwwkkkkdddk.....',
      '.............kkkkkkkkkkkk.......',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  explorer: {
    label: 'Explorer Map and Compass',
    palette: {
      k: '#3A2518',
      p: '#F7E7C4',
      d: '#DFC592',
      g: '#6BB85C',
      b: '#5AAFE8',
      r: '#DC4C3E',
      y: '#F3C548',
      o: '#C78A22'
    },
    grid: [
      '................................',
      '......kkkkkkkkkkkkkkkkkk........',
      '.....kppppppppppppppppppk.......',
      '....kppggppppppppbbbbppppk......',
      '....kpggggppppppbbbbbbpppk......',
      '....kppggppprrppbbbbbbpppk......',
      '....kppppppprrppppbbpppppk......',
      '....kppppppppprrpppppppppk......',
      '....kppppppppppprrpppppppk......',
      '....kppppggggppppprrrppppk......',
      '....kpppggggggppppprppdddk......',
      '....kpppggggggppppppdddddk......',
      '....kddddppppppkkkkkkkkk........',
      '.....kkkkkkkkkkYYYYyyyyyk.......',
      '.............kYYoooooooyyk......',
      '............kYoookpppkooyyk.....',
      '...........kYookppprppkooyk.....',
      '...........kYokppprkrppkoyk.....',
      '...........kYokpppbkbppkoyk.....',
      '...........kYookpppbppkooyk.....',
      '............kYYookpppkooyyk.....',
      '.............kYYYoooooyyyk......',
      '..............kkkkkkkkkkk.......',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  collector: {
    label: 'Botanical Field Book',
    palette: {
      k: '#281C18',
      g: '#3C7A52',
      G: '#58A36F',
      d: '#275438',
      y: '#F7CE5B',
      p: '#FFF5DC',
      s: '#E2D0A9',
      r: '#D9504A'
    },
    grid: [
      '................................',
      '.......kkkkkkkkkkkkkkk..........',
      '......kGGGGGGGGGGGGGGGk.........',
      '.....kGggggggggggggggggk........',
      '.....kGggyyggggggggggggk........',
      '.....kGgyYYygggggggggggk........',
      '.....kGggyyggyyggggggggk........',
      '.....kGgggggyYYygggggggk........',
      '.....kGgggggkyykgggggggk........',
      '.....kGggggggggggggggggk........',
      '.....kGgggGGGGGGGGgggggk........',
      '.....kGgggGggggggGgggggk........',
      '.....kGggggggggggggggggk........',
      '.....kdddddddddddddddddk........',
      '.....kpppppppppppppppppk........',
      '.....kpppppppppprrpppppk........',
      '.....kssssssssssrRsssssk........',
      '......kkkkkkkkkkrRkkkkk.........',
      '...............kRRk.............',
      '...............krrk.............',
      '...............krk..............',
      '................k...............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  pet_lover: {
    label: 'Heart and Paw Ribbon',
    palette: {
      k: '#451A22',
      r: '#F26B7A',
      R: '#FFB3BE',
      d: '#C44353',
      y: '#F7CE46',
      p: '#6B4230'
    },
    grid: [
      '................................',
      '................................',
      '.....kkkkkk........kkkkkk.......',
      '...kkRRRRRRkk....kkRRRRRRkk.....',
      '..kRRRRrrrrrrkk.kRRrrrrrrrrk....',
      '.kRRRrrrrrrrrrrkrrrrrrrrrrrdk...',
      '.kRRrrrrrrrrrrrrrrrrrrrrrrrdk...',
      '.kRrrrrrrrrrpppppprrrrrrrrddk...',
      '.kRrrrrrrppkRRRRRRkppprrrrddk...',
      '..krrrrrpkRpkrrrrkpRpkrrrddk....',
      '..krrrrrrpkrrppppkrrkrrrdddk....',
      '...krrrrrrrrppppppprrrrdddk.....',
      '....krrrrrrrppppppprrrdddk......',
      '.....krrrrrrrrrrrrrrrdddk.......',
      '......krrrrrrrrrrrrrdddk........',
      '.......krrrrrrrrrrrdddk.........',
      '........krrrrrrrrrdddk..........',
      '.........krrrrrrrdddk...........',
      '..........krrrrrdddk............',
      '...........krrrdddk.............',
      '............krdddk..............',
      '.............kddk...............',
      '..............kk................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  early_bird: {
    label: 'Morning Sun and Cozy Mug',
    palette: {
      k: '#3A2518',
      y: '#F7C948',
      Y: '#FFF2A6',
      o: '#E88B2E',
      w: '#FFFDF7',
      c: '#DFD2C0',
      b: '#8C5835'
    },
    grid: [
      '..............kk................',
      '......kk......kYk......kk.......',
      '.....kYYk.....kyk.....kYYk......',
      '......kk....kkYYYkk....kk.......',
      '..........kkYYYYYYYkk...........',
      '..kk.....kYYyyyyyyyYYk.....kk...',
      '.kYYk...kYYyyyyyyyyyYYk...kYYk..',
      '..kk....kYyyyyyyyyyyyYk....kk...',
      '........kYyyyyyyyyyyyYk.........',
      '........kYYYYYYYYYYYYYk.........',
      '....kkkkkkkkkkkkkkkkkkkkkk......',
      '......kwwwwwwwwwwwwwwk..........',
      '.....kwwwwbbbbbbbbwwwwk.........',
      '.....kwwwwwwwwwwwwwwwwkkk.......',
      '.....kwwwwwwwwwwwwwwwkwwk.......',
      '.....kwwwwwwwwwwwwwwwk..k.......',
      '.....kwwwwwwwwwwwwwwwkwwk.......',
      '.....kccccwwwwwwwwccckkk........',
      '......kccccccccccccck...........',
      '.......kkkkkkkkkkkkk............',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  },

  night_owl: {
    label: 'Crescent Moon and Stars',
    palette: {
      k: '#1E1A36',
      y: '#FDE68A',
      Y: '#FEF9C3',
      o: '#F59E0B',
      c: '#93C5FD',
      w: '#FFFFFF'
    },
    grid: [
      '................................',
      '...........kkkkkk...............',
      '........kkkYYYYYYkk.....kk......',
      '.......kYYYYyyyyyyk....kwwk.....',
      '......kYYYyyyyyyok......kk......',
      '.....kYYyyyyyook................',
      '....kYYyyyyyok..................',
      '....kYyyyyyyk.........kk........',
      '....kYyyyyyyk........kYYk.......',
      '....kYyyyyyyk.........kk........',
      '....kYyyyyyyk...................',
      '.....kYYyyyyyok......kk.........',
      '......kYYyyyyyyok...kcck........',
      '.......kYYYyyyyyykk..kk.........',
      '........kkkYYYYYYYYkk...........',
      '...........kkkkkkkkk............',
      '......kk............kk..........',
      '.....kYYk..........kYYk.........',
      '......kk............kk..........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ]
  }
};

// ============================================================================
// 3. 32x32 CHIBI PIXEL PET ILLUSTRATIONS (REFERENCE IMAGE 2 - CAT, DOG, CAPYBARA)
// ============================================================================

export const PET_SPECS: Record<'cat' | 'dog' | 'capybara', PixelMatrixSpec> = {
  cat: {
    label: 'Pixel Tabby Cat Companion',
    palette: {
      k: '#1A1616',
      o: '#EEAA6D',
      O: '#F6C899',
      d: '#C8783E',
      w: '#FFFFFF',
      s: '#E4DAD4',
      p: '#E87686',
      r: '#D94356',
      g: 'rgba(0,0,0,0.22)'
    },
    grid: [
      '................................',
      '................................',
      '.....kkkk..............kkkk.....',
      '....kOOOOkk..........kkOOOOk....',
      '....kOdddOOkkkkkkkkkkOOdddOk....',
      '...kOdoooOOooooooooooOOoooOdOk..',
      '...kOooooooOOOwwwwOOOoooooooOk..',
      '...kOoooooooOwwwwwwOooooooooOk..',
      '...kOooooooooOwwwwOoooooooooOk..',
      '...kddoooooooOwwwwOooooooooddk..',
      '.kkkOoooooooooOwwOoooooooooOkkk.',
      '...kOooooKKoooOwwOoooKKoooooOk..',
      '.kkkOoooKwKooooooooooKwKooooOkkk',
      '...kddooKKKoooOOOOoooKKKoodddk..',
      '....kOoppwwwwwwrwwwwwwppooOk....',
      '....kOoppwwwwwwwwwwwwwppooOk....',
      '.....kOwwwwwwwwwwwwwwwwwwOk.....',
      '....kwwwwwwwwwwwwwwwwwwwwwwk....',
      '....kwwwwwwwwwwwwwwwwwwwwwwk....',
      '....kwwwwwwwwwwwwwwwwwwwwwwk....',
      '....kwwwwwwwwwwwwwwwwwwwwwwk....',
      '....ksswwwwwwwwwwwwwwwwwwssk.kk.',
      '....ksswwwwwwwwwwwwwwwwwwsskkoOk',
      '....ksswwkwwwwwwwwwwwwkwwsskkddk',
      '...gkkkkkkwwwwwwwwwwwwkkkkkkkwwk',
      '..gggggggkkkkkkkkkkkkkkkggggkkkk',
      '....ggggggggggggggggggggggggg...',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ].map((r) => r.replace(/K/g, 'k'))
  },

  dog: {
    label: 'Pixel Golden Puppy Companion',
    palette: {
      k: '#1A1412',
      t: '#E6AE67',
      T: '#F5CB8C',
      d: '#BE7F3B',
      e: '#54331A',
      E: '#734827',
      c: '#F9E3BE',
      g: 'rgba(0,0,0,0.16)'
    },
    grid: [
      '................................',
      '................................',
      '........kkkk......kkkk..........',
      '......kkEEEEkkkkkkEEEEkk........',
      '.....kEEeeeeTTTTTTeeeeEEk.......',
      '....kEEeeeeeTTTTTTeeeeeEEk......',
      '....kEeeeTTttttttttTTeeeEk......',
      '....kEeeTttttttttttttTeeEk......',
      '....kEekttttttttttttttkEEk......',
      '.....kkktttKKttttKKtttkkk.......',
      '......kttttKwKttKwKttttk........',
      '......ktttttttKKtttttttk........',
      '.......ktttttKKKKtttttk.........',
      '.......kttttttKKttttttk.........',
      '........kktttKkkKtttkk..........',
      '..........kkkkkkkkkk............',
      '........kTTTTtccctTTTk..........',
      '.......kTtttttcccttttTk...kk....',
      '......kTtkttttcccttttkTk.kEEk...',
      '......kTtktttkcccktttkTkkEEek...',
      '......kddktttkcccktttkddkeek....',
      '......kddktddkccckddtkddkkk.....',
      '......gkkkdddkccckdddkkkgg......',
      '.....gggggkkkkkkkkkkkgggggg.....',
      '.......gggggggggggggggggg.......',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ].map((r) => r.replace(/K/g, 'k'))
  },

  capybara: {
    label: 'Pixel Capybara with Yuzu Companion',
    palette: {
      k: '#241812',
      g: '#509C42',
      y: '#F79D27',
      Y: '#FFD15C',
      b: '#B57F50',
      B: '#D4A171',
      d: '#8E5E36',
      s: '#634026',
      p: '#E88585',
      h: 'rgba(130, 88, 52, 0.25)'
    },
    grid: [
      '................................',
      '..............kk................',
      '............kkggk...............',
      '...........kkYYYYkk.............',
      '..........kYYyyyyyYk............',
      '..........kyyyyyyyyk............',
      '........kkkkyyyyyykkkk..........',
      '......kkBBBBkkkkkkkkBBkk........',
      '.....kBBbbbbbbbbbbbbbbBBk.......',
      '.....kbbddddbbbbbbddddbbk.......',
      '....kBBBBbbbbbbbbbbbbBBBBk......',
      '....kbbKKKbbssssssbbKKKbbk......',
      '....kbbbbbbssssssssbbbbbbk......',
      '....kbbppbbsssKKsssbbppbbk......',
      '....kdbbbbbssKkkKssbbbbddk......',
      '.....kdbbbbbssssssbbbbddk.......',
      '.....kbbbbbbbbbbbbbbbbbbk.......',
      '....kBBbbbbbbbbbbbbbbbbBBk......',
      '....kbbbbbbbbbbbbbbbbbbbbk......',
      '....kbbddbbbbbbbbbbbbddbbk......',
      '....kdbddbbbbbbbbbbbbdddbk......',
      '....kddddbbkbbbbbbkbbddddk......',
      '...hhkkkkkbbkbbbbkbbkkkkkhh.....',
      '..hhhhhhhkkkkhhhhkkkkhhhhhhh....',
      '....hhhhhhhhhhhhhhhhhhhhhh......',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ].map((r) => r.replace(/K/g, 'k'))
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export function PixelSprite({ spriteKey, size = 36, className = '' }: PixelSpriteProps) {
  const spec = ITEM_SPRITE_SPECS[spriteKey] ?? ITEM_SPRITE_SPECS.sprout_pot;
  return <PixelMatrix spec={spec} size={size} className={className} />;
}

export function AchievementIllustration({
  achievementId,
  category,
  size = 112,
  className = ''
}: {
  achievementId?: string;
  category: AchievementCategory;
  size?: number;
  className?: string;
}) {
  const resolvedCategory: AchievementCategory =
    achievementId?.includes('green')
      ? 'green_thumb'
      : achievementId?.includes('streak')
        ? 'consistency'
        : achievementId?.includes('explorer')
          ? 'explorer'
          : achievementId?.includes('collector')
            ? 'collector'
            : achievementId?.includes('pet')
              ? 'pet_lover'
              : achievementId?.includes('early')
                ? 'early_bird'
                : achievementId?.includes('night')
                  ? 'night_owl'
                  : category;

  const spec = ACHIEVEMENT_SPECS[resolvedCategory] ?? ACHIEVEMENT_SPECS.focus_master;
  return <PixelMatrix spec={spec} size={size} className={className} />;
}

const PET_PALETTE_VARIANTS: Record<string, Record<string, string>> = {
  cat_calico: {
    k: '#241816',
    o: '#F59E7B',
    O: '#FFE7D6',
    d: '#4A3A3A',
    w: '#FFFDFB',
    s: '#EADFD8',
    p: '#F48FB1',
    r: '#E2506A',
    g: 'rgba(0,0,0,0.22)'
  },
  cat_starlight: {
    k: '#131126',
    o: '#6B66C9',
    O: '#9E99EB',
    d: '#403C8C',
    w: '#EFEAFF',
    s: '#C9C2ED',
    p: '#F472B6',
    r: '#FACC15',
    g: 'rgba(12,10,36,0.28)'
  },
  dog_corgi: {
    k: '#22150D',
    t: '#DF8A3E',
    T: '#F7BE7C',
    d: '#B36324',
    e: '#C86D2A',
    E: '#F0A45C',
    c: '#FFFDF7',
    g: 'rgba(0,0,0,0.16)'
  },
  dog_samoyed: {
    k: '#262B38',
    t: '#F5F7FA',
    T: '#FFFFFF',
    d: '#CBD5E1',
    e: '#DDE5EF',
    E: '#F8FAFC',
    c: '#FFFFFF',
    g: 'rgba(30,41,59,0.16)'
  },
  capy_onsen: {
    k: '#241812',
    g: '#86EFAC',
    y: '#F8FAFC',
    Y: '#FFFFFF',
    b: '#A47148',
    B: '#C8966C',
    d: '#7F5230',
    s: '#59371E',
    p: '#FDA4AF',
    h: 'rgba(90, 62, 36, 0.25)'
  },
  capy_sakura: {
    k: '#2A1822',
    g: '#4D9E4A',
    y: '#F472B6',
    Y: '#FBCFE8',
    b: '#C68D6A',
    B: '#E4B18D',
    d: '#9C6648',
    s: '#6E4530',
    p: '#F43F5E',
    h: 'rgba(130, 88, 52, 0.25)'
  }
};

export function resolvePetSpriteSpec(
  species: 'cat' | 'dog' | 'capybara',
  spriteKey?: string
): PixelMatrixSpec {
  const base = PET_SPECS[species];
  const override = spriteKey ? PET_PALETTE_VARIANTS[spriteKey] : undefined;
  if (!override) return base;
  return {
    ...base,
    palette: override
  };
}

export function PetIllustration({
  species,
  spriteKey,
  size = 112,
  className = ''
}: {
  species: 'cat' | 'dog' | 'capybara';
  spriteKey?: string;
  size?: number;
  className?: string;
}) {
  const spec = resolvePetSpriteSpec(species, spriteKey);
  return <PixelMatrix spec={spec} size={size} className={className} />;
}

// ============================================================================
// 4. TRUE LOW-RES PIXEL-ART CANVAS LANDSCAPE BANNERS (REFERENCE IMAGE 4)
// ============================================================================

function paintBannerScene(ctx: CanvasRenderingContext2D, theme: string) {
  const W = 180;
  const H = 120;
  const p = createPixelPainter(ctx, W, H);
  const K = '#2B1B17';

  if (theme === 'autumn_grove') {
    // Ground & warm cobblestone earth matching Reference Image 4 Autumn Garden
    p.ditherRect(0, 0, W, H, '#B49556', '#9D7F46', 5);
    p.ditherRect(58, 22, 74, 48, '#C89F6A', '#B88D58', 4);

    // Top-right Greenhouse Interior
    p.rect(88, 0, 92, 42, '#5E3820');
    p.rect(92, 2, 86, 36, '#D9B98A');
    for (let x = 96; x < 174; x += 18) {
      p.rect(x, 4, 14, 10, '#A3CC9E');
      p.rect(x + 2, 6, 4, 5, '#4F8B41');
      p.rect(x + 8, 5, 4, 6, '#E87E35');
    }
    p.rect(112, 20, 44, 8, '#8E5630');
    p.rect(116, 17, 6, 5, '#599C4A');
    p.rect(130, 17, 6, 5, '#F0A43E');
    p.rect(144, 17, 6, 5, '#599C4A');

    // Top-left Rustic Tool Shed & Mossy Roof
    p.rect(0, 0, 44, 28, '#61513E');
    p.ditherRect(0, 0, 42, 14, '#5E7055', '#495A42', 3);
    p.rect(6, 14, 14, 14, '#7D4D2B');
    p.rect(24, 16, 10, 10, '#E07F38');

    // Raised Wooden Planter Beds with Pumpkins & Green Squash (Reference Image 4)
    p.rect(14, 48, 42, 22, '#4A2B16');
    p.rect(16, 50, 38, 18, '#8C5932');
    p.rect(18, 52, 34, 14, '#6E4627');
    p.circle(26, 61, 4, '#EA7B26', K);
    p.circle(36, 57, 5, '#C8DFC2', K);
    p.circle(44, 61, 3, '#E87826', K);
    p.rect(62, 26, 34, 16, '#4A2B16');
    p.rect(64, 28, 30, 12, '#6A963E');

    // Cobblestone Diagonal Walkway
    for (let i = 0; i < 9; i += 1) {
      p.ellipse(90 + i * 10, 44 + i * 7, 7, 4, '#CFC5B1', '#7A6C59');
      p.ellipse(84 + i * 10, 50 + i * 7, 6, 3, '#DFD7C5', '#7A6C59');
    }

    // Golden-Orange & Crimson Autumn Trees
    const trees = [
      { cx: 30, cy: 96, c1: '#B85420', c2: '#E39729', c3: '#F6CA4E' },
      { cx: 64, cy: 102, c1: '#A8471C', c2: '#E89D2D', c3: '#F7D259' },
      { cx: 92, cy: 108, c1: '#923015', c2: '#CE4B22', c3: '#EA7933' },
      { cx: 158, cy: 76, c1: '#B25C22', c2: '#E3992E', c3: '#F5C44E' }
    ];
    for (const t of trees) {
      p.rect(t.cx - 3, t.cy + 10, 6, 12, '#5E3820');
      p.circle(t.cx - 8, t.cy + 2, 11, t.c1, K);
      p.circle(t.cx + 8, t.cy + 3, 10, t.c2, K);
      p.circle(t.cx, t.cy - 4, 12, t.c2, K);
      p.circle(t.cx - 2, t.cy - 6, 7, t.c3);
    }
    return;
  }

  if (theme === 'winter_sanctuary') {
    // Deep Twilight Blue Mountains + Snow Peaks + Frost Ground (Reference Image 4 Winter Garden)
    p.ditherRect(0, 0, W, H, '#D4E9FC', '#C3DCF7', 6);
    p.ditherRect(0, 0, W, 32, '#344BA6', '#455EBE', 5);
    // Pixel Mountain Ridges
    for (let dy = 0; dy < 24; dy += 1) {
      p.rect(86 - dy, 10 + dy, dy * 2 + 6, 1, '#4C64C7');
      p.rect(134 - dy, 6 + dy, dy * 2 + 8, 1, '#3D53B4');
      if (dy < 8) {
        p.rect(86 - dy, 10 + dy, dy * 2 + 6, 1, '#EAF4FF');
        p.rect(134 - dy, 6 + dy, dy * 2 + 8, 1, '#EAF4FF');
      }
    }
    // Frosted Stone Perimeter Wall
    p.rect(0, 32, W, 6, '#90ACC9');
    p.rect(0, 31, W, 2, '#EBF6FF');
    p.rect(0, 32, 10, H - 32, '#9BB7D6');

    // Snow-Dusted Pine Trees
    const pines = [14, 30, 74];
    for (const pxCenter of pines) {
      for (let h = 0; h < 22; h += 1) {
        const w = Math.floor(h * 0.7) + 1;
        p.rect(pxCenter - w, 6 + h, w * 2, 1, h % 6 < 2 ? '#D9EEFF' : '#406B4F');
      }
    }

    // Tall Brown Log Cabin (Left Foreground matching Reference Image 4)
    p.rect(20, 48, 52, 42, '#6A4229');
    p.rect(24, 52, 44, 36, '#845434');
    // Pitched Shingle Roof
    for (let r = 0; r < 26; r += 1) {
      const rx = 46 - r;
      const rw = r * 2 + 2;
      p.rect(rx, 24 + r, rw, 1, r < 2 || r > 23 ? K : (r % 3 === 0 ? '#783B32' : '#9E5447'));
    }
    p.rect(56, 20, 7, 14, '#70493C'); // Chimney
    // Warm Lit Porch Light + Windows + Wooden Door
    p.circle(46, 52, 3, '#FFE47A', K);
    p.rect(39, 60, 14, 24, '#4C2E1B');
    p.rect(27, 60, 8, 8, '#FFCC54');
    p.rect(57, 60, 8, 8, '#FFCC54');
    p.rect(16, 86, 58, 6, '#B07648');
    p.rect(36, 92, 20, 28, '#B8D4EE');
    // Oak Barrel & Stacked Firewood
    p.rect(14, 78, 7, 9, '#A36234');
    p.rect(12, 96, 8, 6, '#C4B3A1');
    p.rect(72, 82, 8, 6, '#C4B3A1');

    // 3 Snowy Crop Rows on the Right
    for (const ry of [52, 74, 96]) {
      p.rect(86, ry, 86, 10, '#7D5C47');
      p.rect(86, ry - 1, 86, 2, '#CBE4FA');
      for (let cx = 92; cx < 166; cx += 12) {
        p.circle(cx, ry + 3, 3, '#4E7D49', K);
        p.px(cx - 1, ry + 1, '#EEF7FF');
      }
    }
    return;
  }

  if (theme === 'magical_garden') {
    // Midnight Starlight Cavern Soil & Bioluminescent Mist (Reference Image 4)
    p.ditherRect(0, 0, W, H, '#081B26', '#0D2A38', 3);
    p.ellipse(48, 36, 38, 18, '#173752');
    p.ellipse(128, 80, 44, 24, '#0D4359');

    // Violet Pixel Moss Platforms
    const pads = [
      [18, 56],
      [44, 72],
      [68, 88],
      [96, 46],
      [138, 28]
    ];
    for (const [pxX, pxY] of pads) {
      p.rect(pxX, pxY, 22, 11, '#33205C');
      p.ditherRect(pxX + 2, pxY + 1, 18, 7, '#643CA3', '#8B5CF6', 4);
    }

    // Glowing Magenta/Pink Mushroom Cluster (Upper-Left like Ref Image 4)
    p.ellipse(42, 28, 22, 14, '#581C87');
    p.rect(39, 30, 6, 34, '#E9D5FF');
    p.ellipse(42, 24, 15, 10, '#DB2777', '#FBCFE8');
    p.ellipse(40, 22, 8, 5, '#F9A8D4');
    p.rect(20, 48, 4, 18, '#DDD6FE');
    p.ellipse(22, 46, 9, 6, '#F472B6', '#FCE7F3');
    p.rect(64, 38, 4, 16, '#DDD6FE');
    p.ellipse(66, 36, 8, 5, '#E879F9', '#FAE8FF');

    // Hero Translucent Neon Cyan Mushroom Foreground Right (Ref Image 4)
    p.ellipse(116, 74, 30, 20, '#0C4A6E');
    p.rect(112, 68, 8, 42, '#67E8F9');
    p.rect(114, 68, 3, 40, '#ECFEFF');
    p.ellipse(116, 60, 24, 14, '#06B6D4', '#A5F3FC');
    p.ellipse(114, 58, 16, 9, '#67E8F9');
    p.circle(108, 56, 3, '#ECFEFF');
    p.circle(122, 60, 2, '#ECFEFF');
    // Companion Cyan Mushroom
    p.rect(134, 88, 4, 22, '#67E8F9');
    p.ellipse(136, 84, 10, 6, '#22D3EE', '#CFFAFE');

    // Glowing Pink & Cyan Spores & Starlight Dust
    const sparks: Array<[number, number, string]> = [
      [18, 16, '#F472B6'],
      [78, 14, '#67E8F9'],
      [104, 22, '#FDE047'],
      [148, 18, '#E879F9'],
      [166, 56, '#67E8F9'],
      [82, 98, '#A78BFA'],
      [126, 36, '#F472B6']
    ];
    for (const [sx, sy, col] of sparks) {
      p.px(sx, sy, '#FFFFFF');
      p.px(sx - 1, sy, col);
      p.px(sx + 1, sy, col);
      p.px(sx, sy - 1, col);
      p.px(sx, sy + 1, col);
    }
    return;
  }

  // spring_meadow (Khu vườn mùa xuân matching Ref Image 4 top-left)
  p.ditherRect(0, 24, W, H - 24, '#92CA56', '#83BC48', 5);
  // Blue Spring Sky + Outlined Puffy Pixel Clouds
  p.rect(0, 0, W, 24, '#BBE1FA');
  for (const [cx, cy] of [
    [22, 10],
    [138, 9],
    [156, 12]
  ]) {
    p.ellipse(cx, cy, 14, 6, '#FFFFFF', '#91BEDE');
    p.ellipse(cx + 8, cy + 2, 10, 5, '#FFFFFF');
  }
  // Wooden Back Fence
  p.rect(0, 20, W, 3, '#8D5832');
  for (let fx = 4; fx < W; fx += 12) {
    p.rect(fx, 15, 5, 11, '#AE7447');
    p.rect(fx, 15, 5, 1, K);
  }

  // Central Cozy Spring Cottage
  p.rect(72, 34, 34, 22, '#FAF0DA');
  for (let ry = 0; ry < 14; ry += 1) {
    p.rect(72 + (13 - ry), 20 + ry, 34 - (13 - ry) * 2 + 12, 1, ry === 0 ? K : '#C65E44');
  }
  p.rect(86, 40, 8, 16, '#7C4B2C');
  p.rect(76, 39, 6, 6, '#7EC6F2');

  // Cobblestone Flower Path Descending
  for (let s = 0; s < 8; s += 1) {
    p.ellipse(84 - s * 2, 58 + s * 8, 12, 4, '#EFE5D1', '#9C8D77');
  }

  // Giant Sunflowers on Left Meadow & Foreground Right
  for (const [sx, sy] of [
    [40, 42],
    [54, 38],
    [46, 56],
    [138, 86],
    [154, 92]
  ]) {
    p.rect(sx - 1, sy + 5, 2, 9, '#468236');
    p.circle(sx, sy, 6, '#F7CA3E', K);
    p.circle(sx, sy, 3, '#6F3E1E');
  }

  // Fluffy Multi-Tone Pink Cherry Blossom (Sakura) Trees on Right
  for (const [tx, ty] of [
    [118, 18],
    [144, 42]
  ]) {
    p.rect(tx - 3, ty + 10, 6, 14, '#734227');
    p.circle(tx - 8, ty + 2, 12, '#DF6C96', K);
    p.circle(tx + 9, ty + 3, 11, '#F7A4C3', K);
    p.circle(tx, ty - 4, 13, '#F48EB3', K);
    p.circle(tx - 2, ty - 6, 7, '#FCE1EC');
  }

  // Purple Blossom Tree & Green Conifers on Left
  p.circle(28, 34, 11, '#986BE3', K);
  p.circle(26, 32, 6, '#C7A9FF');
  p.circle(14, 72, 11, '#4A8E40', K);
  p.circle(34, 82, 10, '#8C5CE0', K);

  // Flower Beds Along Cobble Path
  for (const [fx, fy, fc] of [
    [60, 74, '#F472B6'],
    [66, 86, '#C084FC'],
    [112, 90, '#EC4899'],
    [122, 96, '#8B5CF6'],
    [104, 104, '#F59E0B']
  ]) {
    p.circle(Number(fx), Number(fy), 6, String(fc), K);
    p.px(Number(fx), Number(fy), '#FFF9D6');
  }
}

export function GardenThemePreviewBanner({
  theme,
  className = ''
}: {
  theme: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paintBannerScene(ctx, theme);
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={120}
      className={`pixel-art h-full w-full object-cover ${className}`}
      aria-label={`${theme} pixel art showcase`}
    />
  );
}
