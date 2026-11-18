export type PixelIconName =
  | 'timer'
  | 'garden'
  | 'tasks'
  | 'goals'
  | 'achievements'
  | 'collection'
  | 'pets'
  | 'music'
  | 'statistics'
  | 'settings'
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'reset'
  | 'flame'
  | 'sparkles'
  | 'lock'
  | 'trash'
  | 'plus'
  | 'move'
  | 'eraser'
  | 'zoom'
  | 'gift'
  | 'check'
  | 'close'
  | 'volume'
  | 'shuffle'
  | 'calendar'
  | 'pencil'
  | 'refresh'
  | 'save'
  | 'database'
  | 'heart'
  | 'trophy'
  | 'shop'
  | 'alert'
  | 'shield';

interface PixelRun {
  x: number;
  y: number;
  width: number;
}

const ICON_GRIDS: Record<PixelIconName, readonly string[]> = {
  timer: [
    '.....XXXXXX.....',
    '.......XX.......',
    '....XXXXXXXX....',
    '...XX......XX...',
    '..XX...XX...XX..',
    '..X....XX....X..',
    '.XX....XX.....X.',
    '.X.....XXXX...X.',
    '.X............X.',
    '.XX..........XX.',
    '..X..........X..',
    '..XX........XX..',
    '...XX......XX...',
    '....XXXXXXXX....',
    '................',
    '................'
  ],
  garden: [
    '.......XX.......',
    '.....XXXXXX.....',
    '....XX....XX....',
    '....X..XX..X....',
    '...XX.XXXX.XX...',
    '....X..XX..X....',
    '....XX....XX....',
    '.....XXXXXX.....',
    '..XX...XX...XX..',
    '.XXXX..XX..XXXX.',
    '..XXXX.XX.XXXX..',
    '....XXXXXXXX....',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '.....XXXXXX.....',
    '................'
  ],
  tasks: [
    '..XXXXXXXXXXXX..',
    '.XX..........XX.',
    '.X............X.',
    '.X..XX........X.',
    '.X.XXXX.XXXXX.X.',
    '.X..XX........X.',
    '.X............X.',
    '.X..XX........X.',
    '.X.XXXX.XXXXX.X.',
    '.X..XX........X.',
    '.X............X.',
    '.X.XXXXXXXXXX.X.',
    '.X............X.',
    '.XX..........XX.',
    '..XXXXXXXXXXXX..',
    '................'
  ],
  goals: [
    '.....XXXXXX.....',
    '...XXXXXXXXXX...',
    '..XX........XX..',
    '.XX...XXXX...XX.',
    '.X...XX..XX...X.',
    '.X..XX....XX..X.',
    'XX..X..XX..X..XX',
    'XX..X..XX..X..XX',
    'XX..X......X..XX',
    '.X..XX....XX..X.',
    '.X...XX..XX...X.',
    '.XX...XXXX...XX.',
    '..XX........XX..',
    '...XXXXXXXXXX...',
    '.....XXXXXX.....',
    '................'
  ],
  achievements: [
    '................',
    '..XXXXXXXXXXXX..',
    '.XX..XXXXXX..XX.',
    'XX.XX.XXXX.XX.XX',
    'XX.XX.XXXX.XX.XX',
    '.XX...XXXX...XX.',
    '..XXXX.XX.XXXX..',
    '......XXXX......',
    '.......XX.......',
    '.......XX.......',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '................',
    '................',
    '................'
  ],
  collection: [
    '.XXXXXXXXXXXXX..',
    '.XX.........XXX.',
    '.X.XX..XXXX..XX.',
    '.X.XX........XX.',
    '.X.XX..XXXX..XX.',
    '.X.XX........XX.',
    '.X.XX..XXXX..XX.',
    '.X.XX........XX.',
    '.X.XX........XX.',
    '.X.XX........XX.',
    '.X.XX..XXXX..XX.',
    '.X.XX........XX.',
    '.XX.........XXX.',
    '.XXXXXXXXXXXXX..',
    '................',
    '................'
  ],
  pets: [
    '..XXX......XXX..',
    '..X.XX....XX.X..',
    '..X..XXXXXX..X..',
    '..X..........X..',
    '.XX..XX..XX..XX.',
    '.X............X.',
    '.X.X...XX...X.X.',
    '.XX..........XX.',
    '..XX..XXXX..XX..',
    '...XXXXXXXXXX...',
    '..XX........XX..',
    '..X..........X..',
    '..X..X....X..X..',
    '..XXXXXXXXXXXX..',
    '................',
    '................'
  ],
  music: [
    '.......XXXXXXXX.',
    '.......XXXXXXXX.',
    '.......XX....XX.',
    '.......XX....XX.',
    '.......XX....XX.',
    '.......XX....XX.',
    '.......XX....XX.',
    '....XXXXX..XXXX.',
    '...XXXXXX.XXXXX.',
    '...XXXXXX.XXXXX.',
    '...XXXXX..XXXX..',
    '....XXX....XX...',
    '................',
    '................',
    '................',
    '................'
  ],
  statistics: [
    '...........XXX..',
    '...........XXX..',
    '...........XXX..',
    '......XXX..XXX..',
    '......XXX..XXX..',
    '......XXX..XXX..',
    '.XXX..XXX..XXX..',
    '.XXX..XXX..XXX..',
    '.XXX..XXX..XXX..',
    '.XXX..XXX..XXX..',
    '.XXX..XXX..XXX..',
    '.XXX..XXX..XXX..',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................'
  ],
  settings: [
    '......XXXX......',
    '..XX..XXXX..XX..',
    '.XXXX.XXXX.XXXX.',
    '..XXXXXXXXXXXX..',
    '...XXXX..XXXX...',
    'XXXXXX....XXXXXX',
    'XXXXX......XXXXX',
    'XXXXX......XXXXX',
    'XXXXXX....XXXXXX',
    '...XXXX..XXXX...',
    '..XXXXXXXXXXXX..',
    '.XXXX.XXXX.XXXX.',
    '..XX..XXXX..XX..',
    '......XXXX......',
    '................',
    '................'
  ],
  play: [
    '................',
    '...XX...........',
    '...XXXX.........',
    '...XXXXXX.......',
    '...XXXXXXXX.....',
    '...XXXXXXXXXX...',
    '...XXXXXXXXXXXX.',
    '...XXXXXXXXXXXX.',
    '...XXXXXXXXXX...',
    '...XXXXXXXX.....',
    '...XXXXXX.......',
    '...XXXX.........',
    '...XX...........',
    '................',
    '................',
    '................'
  ],
  pause: [
    '................',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '...XXXX..XXXX...',
    '................',
    '................',
    '................'
  ],
  stop: [
    '................',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '................',
    '................',
    '................'
  ],
  skip: [
    '................',
    '..XX.......XXX..',
    '..XXXX.....XXX..',
    '..XXXXXX...XXX..',
    '..XXXXXXXX.XXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXX.XXX..',
    '..XXXXXX...XXX..',
    '..XXXX.....XXX..',
    '..XX.......XXX..',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  reset: [
    '......XXXXXX....',
    '....XXXXXXXXXX..',
    '...XXX......XXX.',
    '..XX..........XX',
    '.XX............X',
    '.XXXX..........X',
    'XXXXX..........X',
    'XXXXXX..........',
    '.XX............X',
    '..XX..........XX',
    '...XXX......XXX.',
    '....XXXXXXXXXX..',
    '......XXXXXX....',
    '................',
    '................',
    '................'
  ],
  flame: [
    '.......XX.......',
    '......XXXX......',
    '......XXXXX.....',
    '.....XXXXXX.....',
    '....XXX.XXXX....',
    '...XXXX..XXXX...',
    '...XXXX..XXXXX..',
    '..XXXX....XXXX..',
    '..XXXX....XXXX..',
    '..XXXX.XX.XXXX..',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '................',
    '................'
  ],
  sparkles: [
    '.......XX.......',
    '.......XX.......',
    '......XXXX......',
    '....XXXXXXXX....',
    '..XXXXXXXXXXXX..',
    '....XXXXXXXX....',
    '......XXXX......',
    '.......XX....XX.',
    '.......XX...XXXX',
    '..XX.........XX.',
    '.XXXX...........',
    '..XX............',
    '................',
    '................',
    '................',
    '................'
  ],
  lock: [
    '.....XXXXXX.....',
    '....XX....XX....',
    '....XX....XX....',
    '....XX....XX....',
    '....XX....XX....',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '................',
    '................',
    '................'
  ],
  trash: [
    '.....XXXXXX.....',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '...XX......XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX.XXXX.XX...',
    '...XX......XX...',
    '....XXXXXXXX....',
    '................',
    '................',
    '................'
  ],
  plus: [
    '................',
    '......XXXX......',
    '......XXXX......',
    '......XXXX......',
    '......XXXX......',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '......XXXX......',
    '......XXXX......',
    '......XXXX......',
    '......XXXX......',
    '................',
    '................',
    '................',
    '................'
  ],
  move: [
    '.......XX.......',
    '......XXXX......',
    '.....XXXXXX.....',
    '.......XX.......',
    '..XX...XX...XX..',
    '.XXX...XX...XXX.',
    'XXXXXXXXXXXXXXXX',
    '.XXX...XX...XXX.',
    '..XX...XX...XX..',
    '.......XX.......',
    '.....XXXXXX.....',
    '......XXXX......',
    '.......XX.......',
    '................',
    '................',
    '................'
  ],
  eraser: [
    '........XXXXXX..',
    '.......XXXXXXXX.',
    '......XXXXXXXXXX',
    '.....XXXXXXX..XX',
    '....XXXXXXX..XX.',
    '...XXXXXXX..XX..',
    '..XXXXXXX..XX...',
    '.XXXXXXX..XX....',
    '.XX......XX.....',
    '.XX.....XX......',
    '..XXXXXXX.......',
    '...XXXXXX.......',
    '................',
    '................',
    '................',
    '................'
  ],
  zoom: [
    '....XXXXXX......',
    '..XX......XX....',
    '.XX...XX...XX...',
    '.X....XX....X...',
    'XX..XXXXXX..XX..',
    'XX..XXXXXX..XX..',
    '.X....XX....X...',
    '.XX...XX...XX...',
    '..XX......XXXX..',
    '....XXXXXX.XXXX.',
    '...........XXXX.',
    '............XXXX',
    '.............XX.',
    '................',
    '................',
    '................'
  ],
  gift: [
    '...XXXX..XXXX...',
    '..XX..XXXX..XX..',
    '...XXXXXXXXXX...',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXX..XXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '................',
    '................',
    '................'
  ],
  check: [
    '................',
    '.............XX.',
    '............XXX.',
    '...........XXXX.',
    '..........XXXX..',
    '.XX......XXXX...',
    '.XXX....XXXX....',
    '..XXX..XXXX.....',
    '...XXXXXXX......',
    '....XXXXX.......',
    '.....XXX........',
    '......X.........',
    '................',
    '................',
    '................',
    '................'
  ],
  close: [
    '................',
    '..XX........XX..',
    '..XXX......XXX..',
    '...XXX....XXX...',
    '....XXX..XXX....',
    '.....XXXXXX.....',
    '......XXXX......',
    '.....XXXXXX.....',
    '....XXX..XXX....',
    '...XXX....XXX...',
    '..XXX......XXX..',
    '..XX........XX..',
    '................',
    '................',
    '................',
    '................'
  ],
  volume: [
    '........XX......',
    '......XXXX..XX..',
    '....XXXXXX...XX.',
    '..XXXXXXXX....XX',
    '.XXXXXXXXX.XX.XX',
    '.XXXXXXXXX..XXXX',
    '.XXXXXXXXX..XXXX',
    '.XXXXXXXXX.XX.XX',
    '..XXXXXXXX....XX',
    '....XXXXXX...XX.',
    '......XXXX..XX..',
    '........XX......',
    '................',
    '................',
    '................',
    '................'
  ],
  shuffle: [
    '................',
    '.........XXXXX..',
    '.XXXX....XXXXXXX',
    '....XX..XX...XXX',
    '.....XXXX.......',
    '......XX........',
    '.....XXXX.......',
    '....XX..XX...XXX',
    '.XXXX....XXXXXXX',
    '.........XXXXX..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  calendar: [
    '...XX......XX...',
    '..XXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XX..........XX.',
    '.XX.XX.XX.XX.XX.',
    '.XX..........XX.',
    '.XX.XX.XX.XX.XX.',
    '.XX..........XX.',
    '.XX.XX.XX.XX.XX.',
    '.XX..........XX.',
    '.XXXXXXXXXXXXXX.',
    '................',
    '................',
    '................',
    '................'
  ],
  pencil: [
    '...........XXXX.',
    '..........XXXXX.',
    '.........XXXXX..',
    '........XXXXX...',
    '.......XXXXX....',
    '......XXXXX.....',
    '.....XXXXX......',
    '....XXXXX.......',
    '...XXXXX........',
    '..XXXXX.........',
    '..XXXX..........',
    '.XXXX...........',
    '.XX.............',
    '................',
    '................',
    '................'
  ],
  refresh: [
    '.....XXXXXXXX...',
    '...XXXXXXXXXXXX.',
    '..XXX.......XXXX',
    '.XX.........XXXX',
    '.XX.............',
    '................',
    '.............XX.',
    'XXXX.........XX.',
    'XXXX.......XXX..',
    '.XXXXXXXXXXXX...',
    '...XXXXXXXX.....',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  save: [
    '.XXXXXXXXXXXX...',
    '.XX..XXXX..XXX..',
    '.XX..XXXX..XXXX.',
    '.XX..XXXX..XXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XX..........XX.',
    '.XX.XXXXXXXX.XX.',
    '.XX.XXXXXXXX.XX.',
    '.XX.XXXXXXXX.XX.',
    '.XX..........XX.',
    '.XXXXXXXXXXXXXX.',
    '................',
    '................',
    '................',
    '................'
  ],
  database: [
    '...XXXXXXXXXX...',
    '.XXXXXXXXXXXXXX.',
    '.XX..........XX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXX..',
    '.XX..........XX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXX..',
    '.XX..........XX.',
    '.XXXXXXXXXXXXXX.',
    '...XXXXXXXXXX...',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  heart: [
    '................',
    '..XXXX....XXXX..',
    '.XXXXXX..XXXXXX.',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '......XXXX......',
    '.......XX.......',
    '................',
    '................',
    '................'
  ],
  trophy: [
    '..XXXXXXXXXXXX..',
    'XXXXXXXXXXXXXXXX',
    'XX.XXXXXXXXXX.XX',
    'XX.XXXXXXXXXX.XX',
    '.XXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXX..',
    '....XXXXXXXX....',
    '......XXXX......',
    '......XXXX......',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '................',
    '................',
    '................',
    '................'
  ],
  shop: [
    '.XXXXXXXXXXXXXX.',
    'XXXXXXXXXXXXXXXX',
    'XX.XX.XXXX.XX.XX',
    'XXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXX.',
    '..XX........XX..',
    '..XX.XXXXXX.XX..',
    '..XX.XX..XX.XX..',
    '..XX.XX..XX.XX..',
    '..XX........XX..',
    '..XXXXXXXXXXXX..',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  alert: [
    '......XXXX......',
    '.....XXXXXX.....',
    '....XXX..XXX....',
    '...XXXX..XXXX...',
    '..XXXXX..XXXXX..',
    '..XXXXX..XXXXX..',
    '.XXXXXX..XXXXXX.',
    '.XXXXXX..XXXXXX.',
    '.XXXXXXXXXXXXXX.',
    'XXXXXXX..XXXXXXX',
    'XXXXXXX..XXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '................',
    '................',
    '................',
    '................'
  ],
  shield: [
    '..XXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXX..XXXXXX.',
    '.XXXXX....XXXXX.',
    '.XXXX.XXXX.XXXX.',
    '.XXXX.XXXX.XXXX.',
    '.XXXXXX..XXXXXX.',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '....XXXXXXXX....',
    '.....XXXXXX.....',
    '......XXXX......',
    '.......XX.......',
    '................',
    '................',
    '................'
  ]
};

function compileRuns(grid: readonly string[]): PixelRun[] {
  const runs: PixelRun[] = [];
  for (let y = 0; y < grid.length; y += 1) {
    const row = grid[y] ?? '';
    let x = 0;
    while (x < row.length) {
      if (row[x] !== 'X') {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < row.length && row[end] === 'X') {
        end += 1;
      }
      runs.push({ x, y, width: end - x });
      x = end;
    }
  }
  return runs;
}

const COMPILED_CACHE = new Map<PixelIconName, PixelRun[]>();

function getRunsForIcon(name: PixelIconName): PixelRun[] {
  let cached = COMPILED_CACHE.get(name);
  if (!cached) {
    cached = compileRuns(ICON_GRIDS[name] ?? ICON_GRIDS.sparkles);
    COMPILED_CACHE.set(name, cached);
  }
  return cached;
}

export function PixelIcon({
  name,
  size = 16,
  className = ''
}: {
  name: PixelIconName;
  size?: number;
  className?: string;
}) {
  const runs = getRunsForIcon(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={`pixel-art shrink-0 select-none ${className}`}
    >
      {runs.map((run, idx) => (
        <rect key={`${run.y}-${run.x}-${idx}`} x={run.x} y={run.y} width={run.width} height={1} />
      ))}
    </svg>
  );
}

