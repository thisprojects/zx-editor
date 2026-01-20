import { render, screen, fireEvent } from '@testing-library/react';
import { FileNameModal } from '@/components/FileNameModal';

describe('FileNameModal component', () => {
  const defaultProps = {
    isOpen: true,
    action: 'save' as const,
    fileName: 'test',
    onFileNameChange: jest.fn(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should render when isOpen is true', () => {
      render(<FileNameModal {...defaultProps} isOpen={true} />);
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<FileNameModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('save mode', () => {
    it('should show "Save Project" title when action is save', () => {
      render(<FileNameModal {...defaultProps} action="save" />);
      expect(screen.getByText('Save Project')).toBeInTheDocument();
    });

    it('should show .json extension when action is save', () => {
      render(<FileNameModal {...defaultProps} action="save" />);
      expect(screen.getByText('.json')).toBeInTheDocument();
    });

    it('should show "Save" button when action is save', () => {
      render(<FileNameModal {...defaultProps} action="save" />);
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });

  describe('export mode', () => {
    it('should show "Export ASM" title when action is export', () => {
      render(<FileNameModal {...defaultProps} action="export" />);
      expect(screen.getByText('Export ASM')).toBeInTheDocument();
    });

    it('should show .asm extension when action is export', () => {
      render(<FileNameModal {...defaultProps} action="export" />);
      expect(screen.getByText('.asm')).toBeInTheDocument();
    });

    it('should show "Export" button when action is export', () => {
      render(<FileNameModal {...defaultProps} action="export" />);
      expect(screen.getByRole('button', { name: 'Export' })).toBeInTheDocument();
    });
  });

  describe('file name input', () => {
    it('should display current fileName', () => {
      render(<FileNameModal {...defaultProps} fileName="my_sprite" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('my_sprite');
    });

    it('should call onFileNameChange when input changes', () => {
      render(<FileNameModal {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new_name' } });
      expect(defaultProps.onFileNameChange).toHaveBeenCalledWith('new_name');
    });

    it('should have autofocus on input', () => {
      render(<FileNameModal {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveFocus();
    });

    it('should show Filename label', () => {
      render(<FileNameModal {...defaultProps} />);
      expect(screen.getByText('Filename')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(<FileNameModal {...defaultProps} action="save" />);
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', () => {
      render(<FileNameModal {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('should call onConfirm when Enter is pressed in input', () => {
      render(<FileNameModal {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    it('should call onCancel when Escape is pressed in input', () => {
      render(<FileNameModal {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Escape' });
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('should not call handlers for other keys', () => {
      render(<FileNameModal {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'a' });
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('null action', () => {
    it('should handle null action gracefully', () => {
      render(<FileNameModal {...defaultProps} action={null} />);
      // Should not crash, title shows "Export ASM" for non-save
      expect(screen.getByText('Export ASM')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have overlay background', () => {
      render(<FileNameModal {...defaultProps} />);
      const overlay = screen.getByRole('heading').closest('.fixed');
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-50');
    });

    it('should have Cancel button with gray styling', () => {
      render(<FileNameModal {...defaultProps} />);
      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      expect(cancelButton).toHaveClass('bg-gray-600');
    });

    it('should have confirm button with blue styling', () => {
      render(<FileNameModal {...defaultProps} action="save" />);
      const saveButton = screen.getByRole('button', { name: 'Save' });
      expect(saveButton).toHaveClass('bg-blue-600');
    });
  });
});
