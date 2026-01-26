import { render, screen, fireEvent } from '@testing-library/react';
import { LevelToolbarContent } from '@/components/LevelToolbarContent';
import { TileData, ScreenData } from '@/types';

// Mock window.confirm
const mockConfirm = jest.fn();
window.confirm = mockConfirm;

describe('LevelToolbarContent', () => {
  const createMockTile = (id: string, name: string): TileData => ({
    id,
    name,
    pixels: Array(8).fill(null).map(() => Array(8).fill(false)),
    attributes: [[{ ink: 7, paper: 0, bright: true }]],
  });

  const createDefaultProps = () => ({
    tileSize: 8 as const,
    onTileSizeChange: jest.fn(),
    tileLibrary: [] as TileData[],
    selectedTileIndex: null as number | null,
    onSelectTile: jest.fn(),
    onRemoveTile: jest.fn(),
    onLoadTile: jest.fn(),
    screens: [{ name: 'Screen 1', map: [[null]] }] as ScreenData[],
    currentScreenIndex: 0,
    onSelectScreen: jest.fn(),
    onAddScreen: jest.fn(),
    onRemoveScreen: jest.fn(),
    onRenameScreen: jest.fn(),
    showGrid: true,
    onToggleGrid: jest.fn(),
    pixelSize: 3,
    onPixelSizeChange: jest.fn(),
    onLoad: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onClearScreen: jest.fn(),
    onClearAll: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('tile size selector', () => {
    it('should render all three tile size buttons', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      expect(screen.getByText('8×8')).toBeInTheDocument();
      expect(screen.getByText('16×16')).toBeInTheDocument();
      expect(screen.getByText('24×24')).toBeInTheDocument();
    });

    it('should highlight the currently selected tile size', () => {
      const props = createDefaultProps();
      props.tileSize = 16;
      render(<LevelToolbarContent {...props} />);

      const button16 = screen.getByText('16×16');
      expect(button16).toHaveClass('bg-blue-600');
    });

    it('should call onTileSizeChange when clicking different size', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('16×16'));

      expect(props.onTileSizeChange).toHaveBeenCalledWith(16);
    });

    it('should show confirmation when changing size with tiles loaded', () => {
      const props = createDefaultProps();
      props.tileLibrary = [createMockTile('tile1', 'Test')];
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('16×16'));

      expect(mockConfirm).toHaveBeenCalled();
    });

    it('should not change size if user cancels confirmation', () => {
      const props = createDefaultProps();
      props.tileLibrary = [createMockTile('tile1', 'Test')];
      mockConfirm.mockReturnValue(false);
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('16×16'));

      expect(props.onTileSizeChange).not.toHaveBeenCalled();
    });
  });

  describe('tile library', () => {
    it('should show empty state when no tiles', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      expect(screen.getByText(/No tiles loaded/)).toBeInTheDocument();
    });

    it('should display tile count', () => {
      const props = createDefaultProps();
      props.tileLibrary = [
        createMockTile('tile1', 'Tile 1'),
        createMockTile('tile2', 'Tile 2'),
      ];
      render(<LevelToolbarContent {...props} />);

      expect(screen.getByText('Tile Library (2)')).toBeInTheDocument();
    });

    it('should call onLoadTile when Add clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Load tile from file'));

      expect(props.onLoadTile).toHaveBeenCalled();
    });

    it('should call onSelectTile when tile clicked', () => {
      const props = createDefaultProps();
      props.tileLibrary = [createMockTile('tile1', 'Test Tile')];
      render(<LevelToolbarContent {...props} />);

      const tileElement = screen.getByText('Test Tile').closest('div[class*="cursor-pointer"]');
      fireEvent.click(tileElement!);

      expect(props.onSelectTile).toHaveBeenCalled();
    });

    it('should deselect tile when clicking selected tile', () => {
      const props = createDefaultProps();
      props.tileLibrary = [createMockTile('tile1', 'Test Tile')];
      props.selectedTileIndex = 0;
      render(<LevelToolbarContent {...props} />);

      const tileElement = screen.getByText('Test Tile').closest('div[class*="cursor-pointer"]');
      fireEvent.click(tileElement!);

      expect(props.onSelectTile).toHaveBeenCalledWith(null);
    });
  });

  describe('screen navigation', () => {
    it('should display screen count', () => {
      const props = createDefaultProps();
      props.screens = [
        { name: 'Screen 1', map: [[null]] },
        { name: 'Screen 2', map: [[null]] },
      ];
      render(<LevelToolbarContent {...props} />);

      expect(screen.getByText('Screens (2)')).toBeInTheDocument();
    });

    it('should call onAddScreen when Add clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Add new screen'));

      expect(props.onAddScreen).toHaveBeenCalled();
    });

    it('should call onSelectScreen when screen clicked', () => {
      const props = createDefaultProps();
      props.screens = [
        { name: 'Screen 1', map: [[null]] },
        { name: 'Screen 2', map: [[null]] },
      ];
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Screen 2'));

      expect(props.onSelectScreen).toHaveBeenCalledWith(1);
    });

    it('should highlight current screen', () => {
      const props = createDefaultProps();
      props.screens = [
        { name: 'Screen 1', map: [[null]] },
        { name: 'Screen 2', map: [[null]] },
      ];
      props.currentScreenIndex = 1;
      render(<LevelToolbarContent {...props} />);

      const screen2 = screen.getByText('Screen 2').closest('div[class*="cursor-pointer"]');
      expect(screen2).toHaveClass('bg-blue-600');
    });

    it('should call onRemoveScreen when delete clicked', () => {
      const props = createDefaultProps();
      props.screens = [
        { name: 'Screen 1', map: [[null]] },
        { name: 'Screen 2', map: [[null]] },
      ];
      render(<LevelToolbarContent {...props} />);

      const deleteButton = screen.getAllByTitle('Delete screen')[0];
      fireEvent.click(deleteButton);

      expect(props.onRemoveScreen).toHaveBeenCalled();
    });

    it('should not show delete button when only one screen', () => {
      const props = createDefaultProps();
      props.screens = [{ name: 'Screen 1', map: [[null]] }];
      render(<LevelToolbarContent {...props} />);

      expect(screen.queryByTitle('Delete screen')).not.toBeInTheDocument();
    });
  });

  describe('screen renaming', () => {
    it('should enter edit mode when rename clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Rename screen'));

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should call onRenameScreen on blur', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Rename screen'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.blur(input);

      expect(props.onRenameScreen).toHaveBeenCalledWith(0, 'New Name');
    });

    it('should call onRenameScreen on Enter', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Rename screen'));
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'New Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(props.onRenameScreen).toHaveBeenCalledWith(0, 'New Name');
    });

    it('should cancel rename on Escape', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Rename screen'));
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(props.onRenameScreen).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('view controls', () => {
    it('should call onToggleGrid when grid toggle clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByTitle('Toggle grid'));

      expect(props.onToggleGrid).toHaveBeenCalled();
    });

    it('should show grid toggle as active when showGrid is true', () => {
      const props = createDefaultProps();
      props.showGrid = true;
      render(<LevelToolbarContent {...props} />);

      const toggle = screen.getByTitle('Toggle grid');
      expect(toggle).toHaveClass('bg-blue-500');
    });

    it('should call onPixelSizeChange when scale slider changed', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '5' } });

      expect(props.onPixelSizeChange).toHaveBeenCalledWith(5);
    });

    it('should display current scale value', () => {
      const props = createDefaultProps();
      props.pixelSize = 5;
      render(<LevelToolbarContent {...props} />);

      expect(screen.getByText('5x')).toBeInTheDocument();
    });
  });

  describe('file operations', () => {
    it('should call onLoad when Load Level clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load Level'));

      expect(props.onLoad).toHaveBeenCalled();
    });

    it('should call onSave when Save Level clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Save Level'));

      expect(props.onSave).toHaveBeenCalled();
    });

    it('should call onExport when Export ASM clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Export ASM'));

      expect(props.onExport).toHaveBeenCalled();
    });

    it('should call onClearScreen with confirmation when Clear Screen clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear Screen'));

      expect(mockConfirm).toHaveBeenCalled();
      expect(props.onClearScreen).toHaveBeenCalled();
    });

    it('should not clear screen if user cancels', () => {
      const props = createDefaultProps();
      mockConfirm.mockReturnValue(false);
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear Screen'));

      expect(props.onClearScreen).not.toHaveBeenCalled();
    });

    it('should call onClearAll with confirmation when Clear All clicked', () => {
      const props = createDefaultProps();
      render(<LevelToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear All'));

      expect(mockConfirm).toHaveBeenCalled();
      expect(props.onClearAll).toHaveBeenCalled();
    });
  });
});
