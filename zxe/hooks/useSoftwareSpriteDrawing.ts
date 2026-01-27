import { useState, useCallback, useEffect, useRef } from 'react';
import { Tool, Attribute, Point, SoftwareSpriteWidth, SoftwareSpriteHeight, SoftwareSpriteFrame } from '@/types';
import {
  CHAR_SIZE,
  SOFTWARE_SPRITE_SIZES,
  DEFAULT_SOFTWARE_SPRITE_WIDTH,
  DEFAULT_SOFTWARE_SPRITE_HEIGHT,
  DEFAULT_ANIMATION_FPS,
  DEFAULT_FRAME_DURATION,
  MAX_ANIMATION_FRAMES,
} from '@/constants';
import { getLinePoints, createEmptyPixels } from '@/utils/drawing';

interface UseSoftwareSpriteDrawingProps {
  initialWidth?: SoftwareSpriteWidth;
  initialHeight?: SoftwareSpriteHeight;
}

function generateFrameId(): string {
  return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyFrame(
  width: number,
  height: number,
  widthChars: number,
  heightChars: number,
  name: string,
  ink: number = 7,
  bright: boolean = true
): SoftwareSpriteFrame {
  return {
    id: generateFrameId(),
    name,
    pixels: createEmptyPixels(width, height),
    attributes: Array(heightChars)
      .fill(null)
      .map(() =>
        Array(widthChars)
          .fill(null)
          .map(() => ({ ink, paper: 0, bright }))
      ),
    duration: DEFAULT_FRAME_DURATION,
  };
}

export function useSoftwareSpriteDrawing({
  initialWidth = DEFAULT_SOFTWARE_SPRITE_WIDTH,
  initialHeight = DEFAULT_SOFTWARE_SPRITE_HEIGHT,
}: UseSoftwareSpriteDrawingProps = {}) {
  const [spriteWidth, setSpriteWidthState] = useState<SoftwareSpriteWidth>(initialWidth);
  const [spriteHeight, setSpriteHeightState] = useState<SoftwareSpriteHeight>(initialHeight);

  // Derive dimensions from sprite size
  const sizeKey = `${spriteWidth}x${spriteHeight}`;
  const sizeConfig = SOFTWARE_SPRITE_SIZES[sizeKey] || SOFTWARE_SPRITE_SIZES['16x16'];
  const widthChars = sizeConfig.widthChars;
  const heightChars = sizeConfig.heightChars;
  const canvasWidth = sizeConfig.widthPixels;
  const canvasHeight = sizeConfig.heightPixels;

  // Frame management
  const [frames, setFrames] = useState<SoftwareSpriteFrame[]>(() => [
    createEmptyFrame(canvasWidth, canvasHeight, widthChars, heightChars, 'Frame 1'),
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFps, setAnimationFps] = useState(DEFAULT_ANIMATION_FPS);
  const [loopAnimation, setLoopAnimation] = useState(true);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Onion skinning
  const [onionSkinEnabled, setOnionSkinEnabled] = useState(false);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);

  // Drawing state
  const [currentInk, setCurrentInk] = useState(7);
  const [currentBright, setCurrentBright] = useState(true);
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<Point | null>(null);
  const [linePreview, setLinePreview] = useState<Point | null>(null);

  // Current frame data (derived)
  const currentFrame = frames[currentFrameIndex] || frames[0];
  const pixels = currentFrame?.pixels || createEmptyPixels(canvasWidth, canvasHeight);
  const attributes = currentFrame?.attributes || [];

  // Previous frame for onion skinning
  const previousFramePixels = currentFrameIndex > 0 ? frames[currentFrameIndex - 1]?.pixels : null;

  // Animation playback
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      const interval = 1000 / animationFps;
      animationRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          const next = prev + 1;
          if (next >= frames.length) {
            if (loopAnimation) {
              return 0;
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          return next;
        });
      }, interval);
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, animationFps, frames.length, loopAnimation]);

  // Set a pixel and update the character's attribute
  const setPixel = useCallback((x: number, y: number, isInk: boolean) => {
    if (isPlaying) return; // Don't allow drawing while playing

    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setFrames((prev) => {
      const newFrames = [...prev];
      const frame = { ...newFrames[currentFrameIndex] };

      // Update pixels
      if (y >= 0 && y < frame.pixels.length && x >= 0 && x < (frame.pixels[0]?.length || 0)) {
        const newPixels = frame.pixels.map((row) => [...row]);
        newPixels[y][x] = isInk;
        frame.pixels = newPixels;
      }

      // Update attribute for this character cell when drawing (not erasing)
      if (isInk && charY >= 0 && charY < frame.attributes.length &&
          charX >= 0 && charX < (frame.attributes[0]?.length || 0)) {
        const newAttrs = frame.attributes.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ...newAttrs[charY][charX],
          ink: currentInk,
          bright: currentBright,
        };
        frame.attributes = newAttrs;
      }

      newFrames[currentFrameIndex] = frame;
      return newFrames;
    });
  }, [currentFrameIndex, currentInk, currentBright, isPlaying]);

  // Draw a line between two points
  const drawLine = useCallback((start: Point, end: Point) => {
    if (isPlaying) return;

    const points = getLinePoints(start.x, start.y, end.x, end.y);
    const affectedCells = new Set<string>();

    setFrames((prev) => {
      const newFrames = [...prev];
      const frame = { ...newFrames[currentFrameIndex] };
      const newPixels = frame.pixels.map((row) => [...row]);

      for (const point of points) {
        if (point.y >= 0 && point.y < newPixels.length &&
            point.x >= 0 && point.x < (newPixels[0]?.length || 0)) {
          newPixels[point.y][point.x] = true;
          const charX = Math.floor(point.x / CHAR_SIZE);
          const charY = Math.floor(point.y / CHAR_SIZE);
          affectedCells.add(`${charX},${charY}`);
        }
      }
      frame.pixels = newPixels;

      // Update attributes for all affected cells
      const newAttrs = frame.attributes.map((row) => row.map((attr) => ({ ...attr })));
      affectedCells.forEach((key) => {
        const [charX, charY] = key.split(',').map(Number);
        if (charY >= 0 && charY < newAttrs.length &&
            charX >= 0 && charX < (newAttrs[0]?.length || 0)) {
          newAttrs[charY][charX] = {
            ...newAttrs[charY][charX],
            ink: currentInk,
            bright: currentBright,
          };
        }
      });
      frame.attributes = newAttrs;

      newFrames[currentFrameIndex] = frame;
      return newFrames;
    });
  }, [currentFrameIndex, currentInk, currentBright, isPlaying]);

  // Bucket fill: set paper colour for the 8x8 cell at given pixel coordinates
  const bucketFill = useCallback((x: number, y: number) => {
    if (isPlaying) return;

    const charX = Math.floor(x / CHAR_SIZE);
    const charY = Math.floor(y / CHAR_SIZE);

    setFrames((prev) => {
      const newFrames = [...prev];
      const frame = { ...newFrames[currentFrameIndex] };

      if (charY >= 0 && charY < frame.attributes.length &&
          charX >= 0 && charX < (frame.attributes[0]?.length || 0)) {
        const newAttrs = frame.attributes.map((row) => row.map((attr) => ({ ...attr })));
        newAttrs[charY][charX] = {
          ...newAttrs[charY][charX],
          paper: currentInk,
          bright: currentBright,
        };
        frame.attributes = newAttrs;
        newFrames[currentFrameIndex] = frame;
      }

      return newFrames;
    });
  }, [currentFrameIndex, currentInk, currentBright, isPlaying]);

  // Select a tool
  const selectTool = useCallback((tool: Tool) => {
    setCurrentTool(tool);
    setLineStart(null);
    setLinePreview(null);
  }, []);

  // Clear current frame
  const clearFrame = useCallback(() => {
    if (isPlaying) return;

    setFrames((prev) => {
      const newFrames = [...prev];
      newFrames[currentFrameIndex] = createEmptyFrame(
        canvasWidth,
        canvasHeight,
        widthChars,
        heightChars,
        newFrames[currentFrameIndex].name,
        currentInk,
        currentBright
      );
      newFrames[currentFrameIndex].id = prev[currentFrameIndex].id; // Keep same ID
      return newFrames;
    });
    setLineStart(null);
    setLinePreview(null);
  }, [currentFrameIndex, canvasWidth, canvasHeight, widthChars, heightChars, isPlaying, currentInk, currentBright]);

  // Clear all frames
  const clearAllFrames = useCallback(() => {
    if (isPlaying) return;

    setFrames([createEmptyFrame(canvasWidth, canvasHeight, widthChars, heightChars, 'Frame 1', currentInk, currentBright)]);
    setCurrentFrameIndex(0);
    setLineStart(null);
    setLinePreview(null);
  }, [canvasWidth, canvasHeight, widthChars, heightChars, isPlaying, currentInk, currentBright]);

  // Add new frame
  const addFrame = useCallback(() => {
    if (frames.length >= MAX_ANIMATION_FRAMES) return;
    if (isPlaying) return;

    setFrames((prev) => [
      ...prev,
      createEmptyFrame(canvasWidth, canvasHeight, widthChars, heightChars, `Frame ${prev.length + 1}`, currentInk, currentBright),
    ]);
    setCurrentFrameIndex(frames.length);
  }, [frames.length, canvasWidth, canvasHeight, widthChars, heightChars, isPlaying, currentInk, currentBright]);

  // Duplicate current frame
  const duplicateFrame = useCallback(() => {
    if (frames.length >= MAX_ANIMATION_FRAMES) return;
    if (isPlaying) return;

    const frameToDuplicate = frames[currentFrameIndex];
    const newFrame: SoftwareSpriteFrame = {
      id: generateFrameId(),
      name: `${frameToDuplicate.name} (copy)`,
      pixels: frameToDuplicate.pixels.map((row) => [...row]),
      attributes: frameToDuplicate.attributes.map((row) => row.map((attr) => ({ ...attr }))),
      duration: frameToDuplicate.duration,
    };

    setFrames((prev) => {
      const newFrames = [...prev];
      newFrames.splice(currentFrameIndex + 1, 0, newFrame);
      return newFrames;
    });
    setCurrentFrameIndex(currentFrameIndex + 1);
  }, [frames, currentFrameIndex, isPlaying]);

  // Delete current frame
  const deleteFrame = useCallback(() => {
    if (frames.length <= 1) return;
    if (isPlaying) return;

    setFrames((prev) => {
      const newFrames = prev.filter((_, i) => i !== currentFrameIndex);
      return newFrames;
    });
    setCurrentFrameIndex((prev) => Math.min(prev, frames.length - 2));
  }, [frames.length, currentFrameIndex, isPlaying]);

  // Reorder frames
  const reorderFrames = useCallback((fromIndex: number, toIndex: number) => {
    if (isPlaying) return;

    setFrames((prev) => {
      const newFrames = [...prev];
      const [movedFrame] = newFrames.splice(fromIndex, 1);
      newFrames.splice(toIndex, 0, movedFrame);
      return newFrames;
    });

    // Adjust current frame index if needed
    if (currentFrameIndex === fromIndex) {
      setCurrentFrameIndex(toIndex);
    } else if (fromIndex < currentFrameIndex && toIndex >= currentFrameIndex) {
      setCurrentFrameIndex((prev) => prev - 1);
    } else if (fromIndex > currentFrameIndex && toIndex <= currentFrameIndex) {
      setCurrentFrameIndex((prev) => prev + 1);
    }
  }, [currentFrameIndex, isPlaying]);

  // Rename frame
  const renameFrame = useCallback((index: number, newName: string) => {
    setFrames((prev) => {
      const newFrames = [...prev];
      newFrames[index] = { ...newFrames[index], name: newName };
      return newFrames;
    });
  }, []);

  // Update frame duration
  const setFrameDuration = useCallback((index: number, duration: number) => {
    setFrames((prev) => {
      const newFrames = [...prev];
      newFrames[index] = { ...newFrames[index], duration };
      return newFrames;
    });
  }, []);

  // Change sprite size (clears all frames)
  const setSpriteSize = useCallback((width: SoftwareSpriteWidth, height: SoftwareSpriteHeight) => {
    const newSizeKey = `${width}x${height}`;
    const newConfig = SOFTWARE_SPRITE_SIZES[newSizeKey];
    if (!newConfig) return;

    setSpriteWidthState(width);
    setSpriteHeightState(height);
    setFrames([createEmptyFrame(
      newConfig.widthPixels,
      newConfig.heightPixels,
      newConfig.widthChars,
      newConfig.heightChars,
      'Frame 1',
      currentInk,
      currentBright
    )]);
    setCurrentFrameIndex(0);
    setLineStart(null);
    setLinePreview(null);
    setIsPlaying(false);
  }, [currentInk, currentBright]);

  // Toggle animation playback
  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Stop playback
  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  }, []);

  // Load project data
  const loadProjectData = useCallback((
    loadedWidth: SoftwareSpriteWidth,
    loadedHeight: SoftwareSpriteHeight,
    loadedFrames: SoftwareSpriteFrame[],
    loadedFrameIndex: number,
    loadedFps: number,
    loadedLoop: boolean
  ) => {
    setSpriteWidthState(loadedWidth);
    setSpriteHeightState(loadedHeight);
    setFrames(loadedFrames);
    setCurrentFrameIndex(Math.min(loadedFrameIndex, loadedFrames.length - 1));
    setAnimationFps(loadedFps);
    setLoopAnimation(loadedLoop);
    setLineStart(null);
    setLinePreview(null);
    setIsPlaying(false);
  }, []);

  return {
    // Sprite size
    spriteWidth,
    spriteHeight,
    setSpriteSize,

    // Canvas dimensions (derived from sprite size)
    widthChars,
    heightChars,
    canvasWidth,
    canvasHeight,
    sizeConfig,

    // Frame management
    frames,
    currentFrameIndex,
    setCurrentFrameIndex,
    currentFrame,
    addFrame,
    duplicateFrame,
    deleteFrame,
    reorderFrames,
    renameFrame,
    setFrameDuration,

    // Current frame data
    pixels,
    attributes,

    // Onion skinning
    onionSkinEnabled,
    setOnionSkinEnabled,
    onionSkinOpacity,
    setOnionSkinOpacity,
    previousFramePixels,

    // Animation
    isPlaying,
    animationFps,
    setAnimationFps,
    loopAnimation,
    setLoopAnimation,
    togglePlayback,
    stopPlayback,

    // Current drawing state
    currentInk,
    setCurrentInk,
    currentBright,
    setCurrentBright,
    currentTool,
    selectTool,

    // Drawing state
    isDrawing,
    setIsDrawing,
    lineStart,
    setLineStart,
    linePreview,
    setLinePreview,

    // Actions
    setPixel,
    drawLine,
    bucketFill,
    clearFrame,
    clearAllFrames,
    loadProjectData,
  };
}
