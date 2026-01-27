import { render, screen } from '@testing-library/react';
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
    });

    it('should render links with correct hrefs', () => {
      mockUsePathname.mockReturnValue('/sprite_editor');
      render(<Navbar />);

      expect(screen.getByRole('link', { name: 'UDG Editor' })).toHaveAttribute('href', '/sprite_editor');
      expect(screen.getByRole('link', { name: 'Player Sprite' })).toHaveAttribute('href', '/player_sprite_editor');
      expect(screen.getByRole('link', { name: 'Scene Editor' })).toHaveAttribute('href', '/scene_editor');
      expect(screen.getByRole('link', { name: 'Tile Editor' })).toHaveAttribute('href', '/tile_editor');
      expect(screen.getByRole('link', { name: 'Level Editor' })).toHaveAttribute('href', '/level_editor');
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
