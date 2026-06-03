import { render, screen, within } from '@testing-library/react';
import Home from '@/app/page';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
}));

describe('Home (landing page)', () => {
  beforeEach(() => {
    render(<Home />);
  });

  describe('heading', () => {
    it('should render the main heading', () => {
      expect(screen.getByRole('heading', { name: /ZX Spectrum Graphics Editor/i })).toBeInTheDocument();
    });

    it('should render the tagline', () => {
      expect(screen.getByText(/browser-based suite for authoring ZX Spectrum graphics/i)).toBeInTheDocument();
    });
  });

  describe('editor cards', () => {
    let main: HTMLElement;

    beforeEach(() => {
      main = screen.getByRole('main');
    });

    function cardLink(name: string): HTMLElement {
      const heading = within(main).getByRole('heading', { name, level: 2 });
      return heading.closest('a') as HTMLElement;
    }

    it('should render a card for every editor', () => {
      expect(cardLink('UDG Editor')).toBeInTheDocument();
      expect(cardLink('Player Sprite Editor')).toBeInTheDocument();
      expect(cardLink('Scene Editor')).toBeInTheDocument();
      expect(cardLink('Tile Editor')).toBeInTheDocument();
      expect(cardLink('Level Editor')).toBeInTheDocument();
      expect(cardLink('Charset Editor')).toBeInTheDocument();
    });

    it('should link UDG Editor card to /sprite_editor', () => {
      expect(cardLink('UDG Editor')).toHaveAttribute('href', '/sprite_editor');
    });

    it('should link Player Sprite Editor card to /player_sprite_editor', () => {
      expect(cardLink('Player Sprite Editor')).toHaveAttribute('href', '/player_sprite_editor');
    });

    it('should link Scene Editor card to /scene_editor', () => {
      expect(cardLink('Scene Editor')).toHaveAttribute('href', '/scene_editor');
    });

    it('should link Tile Editor card to /tile_editor', () => {
      expect(cardLink('Tile Editor')).toHaveAttribute('href', '/tile_editor');
    });

    it('should link Level Editor card to /level_editor', () => {
      expect(cardLink('Level Editor')).toHaveAttribute('href', '/level_editor');
    });

    it('should link Charset Editor card to /charset_editor', () => {
      expect(cardLink('Charset Editor')).toHaveAttribute('href', '/charset_editor');
    });
  });

  describe('badge labels', () => {
    it('should render all editor badge labels', () => {
      expect(screen.getByText('UDG')).toBeInTheDocument();
      expect(screen.getByText('SPR')).toBeInTheDocument();
      expect(screen.getByText('SCR')).toBeInTheDocument();
      expect(screen.getByText('TILE')).toBeInTheDocument();
      expect(screen.getByText('LVL')).toBeInTheDocument();
      expect(screen.getByText('CHR')).toBeInTheDocument();
    });
  });

  describe('navbar', () => {
    it('should render the NorbSoft logo linking to /', () => {
      const logos = screen.getAllByRole('link', { name: 'NorbSoft' });
      expect(logos[0]).toHaveAttribute('href', '/');
    });

    it('should render the editor nav links', () => {
      expect(screen.getByRole('link', { name: 'UDG Editor' })).toBeInTheDocument();
    });
  });
});
