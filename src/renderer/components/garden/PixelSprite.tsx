import type { AchievementCategory } from '@shared/types/domain';

interface PixelSpriteProps {
  spriteKey: string;
  size?: number;
  className?: string;
}

interface PixelMatrixSpec {
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
// 1. 24x24 HIGH-DETAIL ITEM & TOOL SPRITES
// ============================================================================

const ITEM_SPRITE_SPECS: Record<string, PixelMatrixSpec> = {
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
  }
};

// ============================================================================
// 2. 32x32 ACHIEVEMENT BOOK ILLUSTRATIONS (REFERENCE IMAGE 3)
// ============================================================================

const ACHIEVEMENT_SPECS: Record<AchievementCategory, PixelMatrixSpec> = {
  // Reference Image 3 Card 1: Gleaming Gold Star Trophy + 4 Pixel Sparkles
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

  // Reference Image 3 Card 2: Blue Daisy Watering Can
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

  // Reference Image 3 Card 3: Curled Sleeping Orange Tabby Cat
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
      '....kYyyyyyyk................... ',
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

const PET_SPECS: Record<'cat' | 'dog' | 'capybara', PixelMatrixSpec> = {
  // Reference Image 2 Left: Cute Sitting Orange-and-White Tabby Cat
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
      r: '#D94356'
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
      '.....kkkkkwwwwwwwwwwwwkkkkkkkwwk',
      '.........kkkkkkkkkkkkkkk....kkkk',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ].map((r) => r.replace(/K/g, 'k'))
  },

  // Reference Image 2 Middle: Cute Sitting Golden-Tan Floppy-Eared Puppy
  dog: {
    label: 'Pixel Golden Puppy Companion',
    palette: {
      k: '#1A1412',
      t: '#E6AE67',
      T: '#F5CB8C',
      d: '#BE7F3B',
      e: '#54331A',
      E: '#734827',
      c: '#F9E3BE'
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
      '.......kkkdddkccckdddkkk........',
      '..........kkkkkkkkkkk...........',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................'
    ].map((r) => r.replace(/K/g, 'k'))
  },

  // PRD-Compliant 3rd Companion: Cute Chill Capybara with Yuzu on head (NO Bear!)
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
      p: '#E88585'
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
      '.....kkkkkbbkbbbbkbbkkkkk.......',
      '.........kkkk....kkkk...........',
      '................................',
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

export function PetIllustration({
  species,
  size = 112,
  className = ''
}: {
  species: 'cat' | 'dog' | 'capybara';
  size?: number;
  className?: string;
}) {
  const spec = PET_SPECS[species];
  return <PixelMatrix spec={spec} size={size} className={className} />;
}

// ============================================================================
// 4. 4 RICH PIXEL-ART GARDEN THEME SHOWCASE BANNERS (REFERENCE IMAGE 4)
// ============================================================================

export function GardenThemePreviewBanner({
  theme,
  className = ''
}: {
  theme: string;
  className?: string;
}) {
  if (theme === 'autumn_grove') {
    return (
      <svg
        viewBox="0 0 320 160"
        shapeRendering="crispEdges"
        className={`pixel-art h-full w-full ${className}`}
        role="img"
        aria-label="Autumn Garden Showcase"
      >
        {/* Warm Autumn Earth & Golden Grass */}
        <rect width="320" height="160" fill="#B59858" />
        <rect x="0" y="0" width="320" height="44" fill="#9A7E45" />
        <rect x="118" y="34" width="128" height="72" fill="#CFA674" />
        {/* Greenhouse / Shed (top-right like ref image 4) */}
        <polygon points="154,0 320,0 320,66 154,66" fill="#8C5934" />
        <rect x="166" y="4" width="144" height="52" fill="#DFBE92" />
        <rect x="172" y="8" width="24" height="16" fill="#9BC89B" />
        <rect x="204" y="8" width="24" height="16" fill="#9BC89B" />
        <rect x="236" y="8" width="24" height="16" fill="#9BC89B" />
        <rect x="268" y="8" width="36" height="20" fill="#A96E42" />
        {/* Rustic Shed Door (top-left) */}
        <polygon points="0,0 74,0 74,40 0,40" fill="#6F5B42" />
        <rect x="0" y="0" width="68" height="22" fill="#5D6F5A" />
        <rect x="14" y="24" width="24" height="24" fill="#7D4C2D" />
        <rect x="44" y="26" width="18" height="18" fill="#E38B44" />
        {/* Raised Wooden Beds & Pumpkins */}
        <rect x="22" y="72" width="66" height="34" fill="#804E2A" />
        <rect x="26" y="76" width="58" height="26" fill="#9E6236" />
        <circle cx="40" cy="92" r="8" fill="#EA7B26" />
        <circle cx="58" cy="84" r="9" fill="#C4DFC3" />
        <circle cx="72" cy="94" r="6" fill="#EA7B26" />
        <rect x="116" y="42" width="62" height="22" fill="#804E2A" />
        <rect x="120" y="46" width="54" height="14" fill="#6B9E44" />
        {/* Cobblestone Diagonal Path */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i}>
            <rect x={160 + i * 16} y={76 + i * 10} width="24" height="14" rx="2" fill="#D5CCB8" />
            <rect x={164 + i * 16} y={78 + i * 10} width="16" height="8" fill="#E6DFCE" />
          </g>
        ))}
        {/* Fiery Gold, Amber, and Crimson Autumn Trees */}
        {[
          { cx: 52, cy: 132, c1: '#E59A2B', c2: '#F6C749', c3: '#C85A21' },
          { cx: 108, cy: 138, c1: '#ECA433', c2: '#FFD45E', c3: '#BD5621' },
          { cx: 158, cy: 146, c1: '#D24E23', c2: '#EE7B34', c3: '#963116' },
          { cx: 280, cy: 110, c1: '#E39A30', c2: '#F5C44E', c3: '#B35F22' }
        ].map((tree, idx) => (
          <g key={idx}>
            <rect x={tree.cx - 4} y={tree.cy + 14} width="8" height="16" fill="#6D4124" />
            <circle cx={tree.cx - 12} cy={tree.cy + 2} r="18" fill={tree.c3} />
            <circle cx={tree.cx + 12} cy={tree.cy + 4} r="17" fill={tree.c1} />
            <circle cx={tree.cx} cy={tree.cy - 6} r="20" fill={tree.c2} />
            <circle cx={tree.cx - 6} cy={tree.cy - 10} r="10" fill="#FFE47E" />
          </g>
        ))}
      </svg>
    );
  }

  if (theme === 'winter_sanctuary') {
    return (
      <svg
        viewBox="0 0 320 160"
        shapeRendering="crispEdges"
        className={`pixel-art h-full w-full ${className}`}
        role="img"
        aria-label="Winter Garden Showcase"
      >
        {/* Crisp Winter Sky & Blue Mountains */}
        <rect width="320" height="160" fill="#D8EAFE" />
        <rect x="0" y="0" width="320" height="44" fill="#3C54B8" />
        <polygon points="104,44 156,8 214,44" fill="#5D77D8" />
        <polygon points="178,44 238,4 304,44" fill="#4961C4" />
        <polygon points="146,16 156,8 168,18" fill="#EEF6FF" />
        <polygon points="228,12 238,4 250,14" fill="#EEF6FF" />
        {/* Stone Wall Divider */}
        <rect x="0" y="42" width="320" height="10" fill="#A5BCD8" />
        {/* Snow-Dusted Pine Trees */}
        {[24, 52, 134].map((px, i) => (
          <g key={i}>
            <polygon points={`${px},4 ${px - 20},40 ${px + 20},40`} fill="#4D7759" />
            <polygon points={`${px},4 ${px - 12},24 ${px + 12},24`} fill="#CBE4F7" />
          </g>
        ))}
        {/* Snowy Farm Crop Rows */}
        {[72, 102, 132].map((ry, rIdx) => (
          <g key={rIdx}>
            <rect x="150" y={ry} width="150" height="12" fill="#8C674E" />
            {[0, 1, 2, 3, 4, 5, 6].map((cIdx) => (
              <g key={cIdx}>
                <circle cx={162 + cIdx * 20} cy={ry + 4} r="5" fill="#54824E" />
                <circle cx={161 + cIdx * 20} cy={ry + 2} r="2" fill="#EBF6FF" />
              </g>
            ))}
          </g>
        ))}
        {/* Cozy Lit Log Cabin (bottom-left matching ref image 4) */}
        <polygon points="30,68 78,24 126,68" fill="#80493B" />
        <polygon points="36,68 78,30 120,68" fill="#9E5B49" />
        <rect x="94" y="24" width="12" height="24" fill="#784B3C" />
        <rect x="38" y="68" width="80" height="58" fill="#6F462D" />
        <rect x="44" y="76" width="68" height="44" fill="#875838" />
        {/* Warm Glowing Porch Lamp + Window */}
        <circle cx="78" cy="76" r="5" fill="#FFE67A" />
        <rect x="66" y="88" width="24" height="32" fill="#53321E" />
        <rect x="48" y="88" width="14" height="14" fill="#FFCE5C" />
        <rect x="94" y="88" width="14" height="14" fill="#FFCE5C" />
        {/* Snowy Porch & Stone Path */}
        <rect x="34" y="124" width="88" height="10" fill="#B57A4B" />
        <rect x="62" y="134" width="32" height="26" fill="#C4DBF4" />
        <rect x="20" y="128" width="12" height="12" fill="#D49558" />
      </svg>
    );
  }

  if (theme === 'magical_garden') {
    return (
      <svg
        viewBox="0 0 320 160"
        shapeRendering="crispEdges"
        className={`pixel-art h-full w-full ${className}`}
        role="img"
        aria-label="Starlight Magical Garden Showcase"
      >
        {/* Deep Teal & Midnight Bioluminescent Soil */}
        <rect width="320" height="160" fill="#0B202C" />
        <rect x="0" y="0" width="320" height="60" fill="#081620" />
        {/* Glowing Nebula Mist Patches */}
        <ellipse cx="96" cy="52" rx="76" ry="30" fill="#183A52" />
        <ellipse cx="220" cy="108" rx="92" ry="38" fill="#11465C" />
        {/* Violet & Indigo Stepping Pads */}
        {[
          [28, 76],
          [74, 96],
          [116, 118],
          [156, 72],
          [242, 46]
        ].map(([px, py], i) => (
          <rect key={i} x={px} y={py} width="38" height="18" fill="#3B2E6E" />
        ))}
        {/* Giant Bioluminescent Magenta Mushroom Cluster (Left) */}
        <rect x="66" y="42" width="10" height="46" fill="#E8C7FF" />
        <ellipse cx="71" cy="36" rx="28" ry="18" fill="#D946EF" />
        <ellipse cx="71" cy="32" rx="18" ry="11" fill="#F9A8D4" />
        <rect x="36" y="68" width="6" height="24" fill="#D8B4FE" />
        <ellipse cx="39" cy="64" rx="15" ry="10" fill="#F472B6" />
        <rect x="110" y="54" width="6" height="22" fill="#E9D5FF" />
        <ellipse cx="113" cy="50" rx="14" ry="9" fill="#E879F9" />
        {/* Hero Glowing Neon Cyan Mushroom (Foreground Right-Center like Ref 4) */}
        <rect x="196" y="88" width="12" height="58" fill="#7CF3FF" />
        <polygon points="154,96 202,52 250,96 232,108 172,108" fill="#38BDF8" />
        <polygon points="168,90 202,58 236,90 218,98 186,98" fill="#A5F3FC" />
        <circle cx="192" cy="80" r="5" fill="#ECFEFF" />
        <rect x="228" y="114" width="6" height="28" fill="#67E8F9" />
        <ellipse cx="231" cy="110" rx="14" ry="10" fill="#22D3EE" />
        {/* Floating Twinkling Fireflies & Starlight Motes */}
        {[
          [42, 22, '#F472B6'],
          [124, 18, '#67E8F9'],
          [168, 32, '#FDE047'],
          [268, 24, '#E879F9'],
          [294, 84, '#67E8F9'],
          [142, 134, '#A78BFA']
        ].map(([sx, sy, sc], i) => (
          <g key={i}>
            <rect x={Number(sx)} y={Number(sy)} width="4" height="4" fill={String(sc)} />
            <rect x={Number(sx) - 2} y={Number(sy) + 1} width="8" height="2" fill={String(sc)} />
          </g>
        ))}
      </svg>
    );
  }

  // Default: spring_meadow (Khu vườn mùa xuân matching Ref Image 4 top-left)
  return (
    <svg
      viewBox="0 0 320 160"
      shapeRendering="crispEdges"
      className={`pixel-art h-full w-full ${className}`}
      role="img"
      aria-label="Spring Garden Showcase"
    >
      {/* Sky + Soft Spring Clouds + Fence */}
      <rect width="320" height="160" fill="#9BD162" />
      <rect x="0" y="0" width="320" height="32" fill="#BAE2FA" />
      <rect x="20" y="8" width="44" height="12" fill="#FFFFFF" />
      <rect x="236" y="6" width="54" height="14" fill="#FFFFFF" />
      {[12, 34, 56, 78, 100, 222, 244, 266, 288].map((fx) => (
        <rect key={fx} x={fx} y="20" width="8" height="18" fill="#B68052" />
      ))}
      <rect x="0" y="26" width="320" height="4" fill="#9B673C" />
      {/* Cozy Spring Cottage */}
      <polygon points="118,46 154,18 190,46" fill="#C96448" />
      <rect x="128" y="46" width="52" height="34" fill="#FAF0DC" />
      <rect x="148" y="56" width="14" height="24" fill="#8C5835" />
      <rect x="132" y="54" width="10" height="10" fill="#88C8F2" />
      {/* Cobblestone Winding Flower Path */}
      {[0, 1, 2, 3, 4, 5].map((s) => (
        <rect key={s} x={142 - s * 5} y={84 + s * 12} width="26" height="9" fill="#E7DECD" />
      ))}
      {/* Giant Sunflowers (left-mid & bottom-right) */}
      {[
        [68, 60],
        [92, 54],
        [78, 80],
        [248, 114],
        [274, 122]
      ].map(([sx, sy], i) => (
        <g key={i}>
          <rect x={sx - 2} y={sy + 8} width="4" height="14" fill="#4B8B3B" />
          <circle cx={sx} cy={sy} r="10" fill="#F6C53B" />
          <circle cx={sx} cy={sy} r="5" fill="#7D4928" />
        </g>
      ))}
      {/* Lush Pink Cherry Blossom Trees */}
      <rect x="196" y="34" width="12" height="24" fill="#7D4D33" />
      <circle cx="204" cy="18" r="24" fill="#F496B6" />
      <circle cx="222" cy="22" r="22" fill="#F8B4CD" />
      <circle cx="188" cy="24" r="18" fill="#E8779F" />
      <rect x="242" y="66" width="12" height="26" fill="#7D4D33" />
      <circle cx="250" cy="54" r="26" fill="#F496B6" />
      <circle cx="268" cy="60" r="22" fill="#F9C1D7" />
      <circle cx="234" cy="58" r="18" fill="#E4719A" />
      {/* Lavender & Tulips Along Path */}
      <circle cx="44" cy="116" r="16" fill="#529443" />
      <circle cx="96" cy="96" r="14" fill="#A27BEA" />
      <circle cx="206" cy="128" r="14" fill="#EC6E9B" />
      <circle cx="224" cy="134" r="12" fill="#8B5CF6" />
    </svg>
  );
}
