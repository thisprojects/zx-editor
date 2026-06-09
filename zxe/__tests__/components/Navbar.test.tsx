import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '@/components/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

const mockUsePathname = usePathname as jest.Mock;

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render all navigation links', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByText('UDG Editor')).toBeInTheDocument();
      expect(screen.getByText('Player Sprite')).toBeInTheDocument();
      expect(screen.getByText('Scene Editor')).toBeInTheDocument();
      expect(screen.getByText('Tile Editor')).toBeInTheDocument();
      expect(screen.getByText('Level Editor')).toBeInTheDocument();
      expect(screen.getByText('Charset Editor')).toBeInTheDocument();
    });

    it('should render links with correct hrefs', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'UDG Editor' })).toHaveAttribute('href', '/sprite_editor');
      expect(screen.getByRole('link', { name: 'Player Sprite' })).toHaveAttribute('href', '/player_sprite_editor');
      expect(screen.getByRole('link', { name: 'Scene Editor' })).toHaveAttribute('href', '/scene_editor');
      expect(screen.getByRole('link', { name: 'Tile Editor' })).toHaveAttribute('href', '/tile_editor');
      expect(screen.getByRole('link', { name: 'Level Editor' })).toHaveAttribute('href', '/level_editor');
      expect(screen.getByRole('link', { name: 'Charset Editor' })).toHaveAttribute('href', '/charset_editor');
    });
  });

  describe('active state', () => {
    it('should highlight UDG Editor when on sprite_editor page', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const udgLink = screen.getByRole('link', { name: 'UDG Editor' });
      const playerLink = screen.getByRole('link', { name: 'Player Sprite' });
      const sceneLink = screen.getByRole('link', { name: 'Scene Editor' });

      expect(udgLink).toHaveClass('bg-blue-600');
      expect(playerLink).not.toHaveClass('bg-blue-600');
      expect(sceneLink).not.toHaveClass('bg-blue-600');
    });

    it('should highlight Player Sprite when on player_sprite_editor page', () => {
      mockUsePathname.mockReturnValue('/player_sprite_editor');
      render(<Navbar />);

      const udgLink = screen.getByRole('link', { name: 'UDG Editor' });
      const playerLink = screen.getByRole('link', { name: 'Player Sprite' });
      const sceneLink = screen.getByRole('link', { name: 'Scene Editor' });

      expect(udgLink).not.toHaveClass('bg-blue-600');
      expect(playerLink).toHaveClass('bg-blue-600');
      expect(sceneLink).not.toHaveClass('bg-blue-600');
    });

    it('should highlight Scene Editor when on scene_editor page', () => {
      mockUsePathname.mockReturnValue('/scene_editor');
      render(<Navbar />);

      const udgLink = screen.getByRole('link', { name: 'UDG Editor' });
      const sceneLink = screen.getByRole('link', { name: 'Scene Editor' });
      const tileLink = screen.getByRole('link', { name: 'Tile Editor' });

      expect(udgLink).not.toHaveClass('bg-blue-600');
      expect(sceneLink).toHaveClass('bg-blue-600');
      expect(tileLink).not.toHaveClass('bg-blue-600');
    });

    it('should highlight Tile Editor when on tile_editor page', () => {
      mockUsePathname.mockReturnValue('/tile_editor');
      render(<Navbar />);

      const udgLink = screen.getByRole('link', { name: 'UDG Editor' });
      const sceneLink = screen.getByRole('link', { name: 'Scene Editor' });
      const tileLink = screen.getByRole('link', { name: 'Tile Editor' });

      expect(udgLink).not.toHaveClass('bg-blue-600');
      expect(sceneLink).not.toHaveClass('bg-blue-600');
      expect(tileLink).toHaveClass('bg-blue-600');
    });

    it('should highlight Level Editor when on level_editor page', () => {
      mockUsePathname.mockReturnValue('/level_editor');
      render(<Navbar />);

      const tileLink = screen.getByRole('link', { name: 'Tile Editor' });
      const levelLink = screen.getByRole('link', { name: 'Level Editor' });

      expect(tileLink).not.toHaveClass('bg-blue-600');
      expect(levelLink).toHaveClass('bg-blue-600');
    });

    it('should highlight Charset Editor when on charset_editor page', () => {
      mockUsePathname.mockReturnValue('/charset_editor');
      render(<Navbar />);

      const charsetLink = screen.getByRole('link', { name: 'Charset Editor' });
      const tileLink = screen.getByRole('link', { name: 'Tile Editor' });

      expect(charsetLink).toHaveClass('bg-blue-600');
      expect(tileLink).not.toHaveClass('bg-blue-600');
    });

    it('should not highlight any link when on unknown page', () => {
      mockUsePathname.mockReturnValue('/unknown');
      render(<Navbar />);

      const udgLink = screen.getByRole('link', { name: 'UDG Editor' });
      const playerLink = screen.getByRole('link', { name: 'Player Sprite' });
      const sceneLink = screen.getByRole('link', { name: 'Scene Editor' });
      const tileLink = screen.getByRole('link', { name: 'Tile Editor' });
      const levelLink = screen.getByRole('link', { name: 'Level Editor' });

      expect(udgLink).not.toHaveClass('bg-blue-600');
      expect(playerLink).not.toHaveClass('bg-blue-600');
      expect(sceneLink).not.toHaveClass('bg-blue-600');
      expect(tileLink).not.toHaveClass('bg-blue-600');
      expect(levelLink).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Documentation dropdown', () => {
    it('should render the Documentation button', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByRole('button', { name: /documentation/i })).toBeInTheDocument();
    });

    it('should not show doc links before the dropdown is opened', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.queryByText('Z80 Assembly Introduction')).not.toBeInTheDocument();
      expect(screen.queryByText('ASM Example: UDG')).not.toBeInTheDocument();
      expect(screen.queryByText('ASM Example: Player Sprite')).not.toBeInTheDocument();
    });

    it('should show all doc links when the dropdown is opened', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));

      expect(screen.getByText('Z80 Assembly Introduction')).toBeInTheDocument();
      expect(screen.getByText('ASM Example: UDG')).toBeInTheDocument();
      expect(screen.getByText('ASM Example: Player Sprite')).toBeInTheDocument();
    });

    it('should hide doc links when the dropdown is toggled closed', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const button = screen.getByRole('button', { name: /documentation/i });
      fireEvent.click(button);
      fireEvent.click(button);

      expect(screen.queryByText('Z80 Assembly Introduction')).not.toBeInTheDocument();
    });

    it('should link to the z80 book with correct href', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));

      const link = screen.getByRole('link', { name: 'Z80 Assembly Introduction' });
      expect(link).toHaveAttribute('href', '/z80_book.html');
    });

    it('should link to the UDG ASM example with correct href', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));

      const link = screen.getByRole('link', { name: 'ASM Example: UDG' });
      expect(link).toHaveAttribute('href', '/asm_examples.html');
    });

    it('should link to the Player Sprite ASM example with correct href', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));

      const link = screen.getByRole('link', { name: 'ASM Example: Player Sprite' });
      expect(link).toHaveAttribute('href', '/player_sprite_examples.html');
    });

    it('should open doc links in a new tab', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));

      for (const name of ['Z80 Assembly Introduction', 'ASM Example: UDG', 'ASM Example: Player Sprite']) {
        expect(screen.getByRole('link', { name })).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('link', { name })).toHaveAttribute('rel', 'noopener noreferrer');
      }
    });

    it('should close the dropdown when a doc link is clicked', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
      fireEvent.click(screen.getByText('Z80 Assembly Introduction'));

      expect(screen.queryByText('Z80 Assembly Introduction')).not.toBeInTheDocument();
    });

    it('should close the dropdown when the UDG example link is clicked', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
      fireEvent.click(screen.getByText('ASM Example: UDG'));

      expect(screen.queryByText('ASM Example: UDG')).not.toBeInTheDocument();
    });

    it('should close the dropdown when the Player Sprite example link is clicked', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
      fireEvent.click(screen.getByText('ASM Example: Player Sprite'));

      expect(screen.queryByText('ASM Example: Player Sprite')).not.toBeInTheDocument();
    });

    it('should close the dropdown when clicking outside', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
      expect(screen.getByText('Z80 Assembly Introduction')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Z80 Assembly Introduction')).not.toBeInTheDocument();
    });

    it('should not close the dropdown when clicking inside it', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      fireEvent.click(screen.getByRole('button', { name: /documentation/i }));
      fireEvent.mouseDown(screen.getByText('Z80 Assembly Introduction'));

      expect(screen.getByText('Z80 Assembly Introduction')).toBeInTheDocument();
    });
  });

  describe('NorbSoft logo', () => {
    it('should render the NorbSoft logo', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'NorbSoft' })).toBeInTheDocument();
    });

    it('should link to the home page', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'NorbSoft' })).toHaveAttribute('href', '/');
    });

    it('should use the VT323 terminal font variable', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const logo = screen.getByRole('link', { name: 'NorbSoft' });
      expect(logo).toHaveStyle({ fontFamily: 'var(--font-vt323)' });
    });

    it('should render before the editor nav links', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const nav = screen.getByRole('navigation');
      const links = nav.querySelectorAll('a');
      expect(links[0]).toHaveAttribute('href', '/');
    });
  });

  describe('styling', () => {
    it('should have fixed positioning', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('fixed');
    });

    it('should have correct z-index', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('z-50');
    });
  });
});
