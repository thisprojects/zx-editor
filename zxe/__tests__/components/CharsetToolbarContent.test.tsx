import { render, screen, fireEvent } from '@testing-library/react';
import { CharsetToolbarContent } from '@/components/CharsetToolbarContent';

const createDefaultProps = () => ({
  currentTool: 'pencil' as const,
  onSelectTool: jest.fn(),
  pixelSize: 20,
  onPixelSizeChange: jest.fn(),
  onUndo: jest.fn(),
  onRedo: jest.fn(),
  canUndo: false,
  canRedo: false,
  historyIndex: 1,
  selectedChar: 0,
  fileName: 'charset',
  onFileNameChange: jest.fn(),
  onLoad: jest.fn(),
  onLoadChr: jest.fn(),
  onSave: jest.fn(),
  onExportAsm: jest.fn(),
  onExportChr: jest.fn(),
  onClearChar: jest.fn(),
  onClearAll: jest.fn(),
});

describe('CharsetToolbarContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selected char info', () => {
    it('should display selected char index', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('#0')).toBeInTheDocument();
    });

    it('should display ASCII code', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('ASCII 32')).toBeInTheDocument();
    });

    it('should show SPC for space character (selectedChar=0)', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText("'SPC'")).toBeInTheDocument();
    });

    it('should show glyph for printable characters', () => {
      const props = createDefaultProps();
      props.selectedChar = 33; // ASCII 65 = 'A'
      render(<CharsetToolbarContent {...props} />);
      expect(screen.getByText('#33')).toBeInTheDocument();
      expect(screen.getByText('ASCII 65')).toBeInTheDocument();
      expect(screen.getByText("'A'")).toBeInTheDocument();
    });

    it('should show correct info for last character (selectedChar=95)', () => {
      const props = createDefaultProps();
      props.selectedChar = 95; // ASCII 127 = DEL (not printable)
      render(<CharsetToolbarContent {...props} />);
      expect(screen.getByText('#95')).toBeInTheDocument();
      expect(screen.getByText('ASCII 127')).toBeInTheDocument();
    });
  });

  describe('tools', () => {
    it('should render all three tool buttons', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Pencil')).toBeInTheDocument();
      expect(screen.getByText('Line')).toBeInTheDocument();
      expect(screen.getByText('Rubber')).toBeInTheDocument();
    });

    it('should highlight the active tool', () => {
      const props = createDefaultProps();
      props.currentTool = 'pencil';
      render(<CharsetToolbarContent {...props} />);

      const pencilBtn = screen.getByText('Pencil').closest('button');
      const lineBtn = screen.getByText('Line').closest('button');
      expect(pencilBtn).toHaveClass('bg-blue-600');
      expect(lineBtn).not.toHaveClass('bg-blue-600');
    });

    it('should highlight the line tool when active', () => {
      const props = createDefaultProps();
      props.currentTool = 'line';
      render(<CharsetToolbarContent {...props} />);

      const lineBtn = screen.getByText('Line').closest('button');
      expect(lineBtn).toHaveClass('bg-blue-600');
    });

    it('should highlight the rubber tool when active', () => {
      const props = createDefaultProps();
      props.currentTool = 'rubber';
      render(<CharsetToolbarContent {...props} />);

      const rubberBtn = screen.getByText('Rubber').closest('button');
      expect(rubberBtn).toHaveClass('bg-blue-600');
    });

    it('should call onSelectTool with pencil', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Pencil'));
      expect(props.onSelectTool).toHaveBeenCalledWith('pencil');
    });

    it('should call onSelectTool with line', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Line'));
      expect(props.onSelectTool).toHaveBeenCalledWith('line');
    });

    it('should call onSelectTool with rubber', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Rubber'));
      expect(props.onSelectTool).toHaveBeenCalledWith('rubber');
    });
  });

  describe('scale slider', () => {
    it('should render the scale slider', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should display the current pixel size', () => {
      const props = createDefaultProps();
      props.pixelSize = 28;
      render(<CharsetToolbarContent {...props} />);
      expect(screen.getByText('28×')).toBeInTheDocument();
    });

    it('should call onPixelSizeChange when slider changes', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '32' } });
      expect(props.onPixelSizeChange).toHaveBeenCalledWith(32);
    });
  });

  describe('edit buttons', () => {
    it('should render Clear Char button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Clear Char')).toBeInTheDocument();
    });

    it('should render Clear All button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('should call onClearChar when Clear Char is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear Char'));
      expect(props.onClearChar).toHaveBeenCalledTimes(1);
    });

    it('should call onClearAll when Clear All is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Clear All'));
      expect(props.onClearAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('file controls', () => {
    it('should render the filename input', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      const input = screen.getByDisplayValue('charset');
      expect(input).toBeInTheDocument();
    });

    it('should call onFileNameChange when filename input changes', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      const input = screen.getByDisplayValue('charset');
      fireEvent.change(input, { target: { value: 'myfont' } });
      expect(props.onFileNameChange).toHaveBeenCalledWith('myfont');
    });

    it('should render Load JSON button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Load JSON')).toBeInTheDocument();
    });

    it('should render Load CHR button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Load CHR')).toBeInTheDocument();
    });

    it('should render Save JSON button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Save JSON')).toBeInTheDocument();
    });

    it('should render Export ASM button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Export ASM')).toBeInTheDocument();
    });

    it('should render Export CHR button', () => {
      render(<CharsetToolbarContent {...createDefaultProps()} />);
      expect(screen.getByText('Export CHR')).toBeInTheDocument();
    });

    it('should call onLoad when Load JSON is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load JSON'));
      expect(props.onLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onLoadChr when Load CHR is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Load CHR'));
      expect(props.onLoadChr).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when Save JSON is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Save JSON'));
      expect(props.onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onExportAsm when Export ASM is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Export ASM'));
      expect(props.onExportAsm).toHaveBeenCalledTimes(1);
    });

    it('should call onExportChr when Export CHR is clicked', () => {
      const props = createDefaultProps();
      render(<CharsetToolbarContent {...props} />);

      fireEvent.click(screen.getByText('Export CHR'));
      expect(props.onExportChr).toHaveBeenCalledTimes(1);
    });
  });
});
