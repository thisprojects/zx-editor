export type Tool = 'pencil' | 'line' | 'rubber' | 'bucket';

// Attribute byte structure (per 8x8 character cell)
export interface Attribute {
  ink: number;    // 0-7
  paper: number;  // 0-7
  bright: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawBounds {
  minCharX: number;
  minCharY: number;
  maxCharX: number;
  maxCharY: number;
  width: number;
  height: number;
}

export interface ProjectData {
  version: number;
  charsWidth: number;
  charsHeight: number;
  pixels: boolean[][];
  attributes: Attribute[][];
}

// Tile Editor types
export type TileSize = 8 | 16 | 24;

export interface TileSizeConfig {
  pixels: number;       // 8, 16, or 24
  chars: number;        // 1, 2, or 3 (characters per dimension)
  totalChars: number;   // 1, 4, or 9 (total character cells)
  label: string;        // Display label: "8×8", "16×16", "24×24"
}

export interface TileProjectData {
  version: number;
  type: 'tile';
  tileSize: TileSize;
  pixels: boolean[][];
  attributes: Attribute[][];
}

// Level Editor types
export interface TileData {
  id: string;                         // Unique tile ID
  name: string;                       // Display name
  pixels: boolean[][];                // Pixel data
  attributes: Attribute[][];          // Color data
}

export interface ScreenData {
  name: string;                       // Screen name (e.g., "Screen 1")
  map: (number | null)[][];           // Grid of tile indices (null = empty)
}

export interface LevelProjectData {
  version: number;                    // 1
  type: 'level';                      // File type identifier
  tileSize: TileSize;                 // 8, 16, or 24 (consistent across level)
  tileLibrary: TileData[];            // Loaded tiles (indexed 0-N)
  screens: ScreenData[];              // Array of level screens
  currentScreenIndex: number;         // Active screen
}
