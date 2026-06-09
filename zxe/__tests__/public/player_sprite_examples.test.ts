import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(
  path.join(__dirname, '..', '..', 'public', 'player_sprite_examples.html'),
  'utf-8'
);

describe('player_sprite_examples.html', () => {
  describe('page structure', () => {
    it('has a top-level Player Sprite ASM Example heading', () => {
      expect(html).toMatch(/<h1>Player Sprite ASM Example<\/h1>/);
    });

    it('has the correct page title', () => {
      expect(html).toContain('<title>Player Sprite ASM Example: Animating Exported Data on Z80 Hardware</title>');
    });

    it('has an introduction section', () => {
      expect(html).toMatch(/<section id="introduction">/);
    });

    it('links back to the UDG ASM example from the intro', () => {
      expect(html).toContain('href="/asm_examples.html"');
    });

    it('links back to the Z80 Assembly Introduction', () => {
      expect(html).toContain('href="/z80_book.html"');
    });

    it('has the player sprite example section', () => {
      expect(html).toMatch(/<section id="player-example">/);
      expect(html).toMatch(/<h1>Player Sprite: Animating a Software Sprite<\/h1>/);
    });

    it('does not contain the UDG example section', () => {
      expect(html).not.toContain('id="udg-example"');
    });
  });

  describe('sidebar navigation', () => {
    it('links to asm_examples.html for the UDG page', () => {
      expect(html).toContain('<a href="/asm_examples.html">UDG</a>');
    });

    it('links to player_sprite_examples.html for the Player Sprite page', () => {
      expect(html).toContain('<a href="/player_sprite_examples.html">Player Sprite</a>');
    });

    it('does not use anchor links for sidebar navigation', () => {
      expect(html).not.toContain('href="#udg-example"');
      expect(html).not.toContain('href="#player-example"');
    });

    it('renders the collapsible examples menu controls', () => {
      expect(html).toContain('id="examples-toggle"');
      expect(html).toContain('id="examples-list"');
      expect(html).toContain('toggleExamplesMenu');
    });

    it('defines the toggleExamplesMenu script', () => {
      expect(html).toMatch(/function toggleExamplesMenu\(\)/);
      expect(html).toContain("btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')");
    });
  });

  describe('player sprite example sub-sections', () => {
    const expectedHeadingIds = [
      'player-exported',
      'player-masks',
      'player-addressing',
      'player-blitters',
      'player-pointer',
      'player-loop',
      'player-source',
      'player-running',
    ];

    it.each(expectedHeadingIds)('includes the %s sub-section', (id) => {
      expect(html).toContain(`id="${id}"`);
    });
  });

  describe('exported data file (mr_soft_sprite.asm)', () => {
    it('includes a heading naming the exported data file', () => {
      expect(html).toMatch(/<h2 id="player-exported">The Exported Data: mr_soft_sprite\.asm<\/h2>/);
    });

    it('includes the full sprite data for all 5 frames', () => {
      expect(html).toMatch(/<span class="label">mr_soft_frame0_shift0<\/span>/);
      expect(html).toMatch(/<span class="label">mr_soft_frame1_shift0<\/span>/);
      expect(html).toMatch(/<span class="label">mr_soft_frame2_shift0<\/span>/);
      expect(html).toMatch(/<span class="label">mr_soft_frame3_shift0<\/span>/);
      expect(html).toMatch(/<span class="label">mr_soft_frame4_shift0<\/span>/);
    });

    it('includes the frame shift lookup tables', () => {
      expect(html).toMatch(/<span class="label">mr_soft_frame0_shifts<\/span>/);
      expect(html).toMatch(/<span class="label">mr_soft_frame4_shifts<\/span>/);
    });

    it('includes the attribute data label', () => {
      expect(html).toMatch(/<span class="label">mr_soft_attr<\/span>/);
    });

    it('includes defb and defw directives from the data file', () => {
      expect(html).toMatch(/<span class="directive">defb<\/span>/);
      expect(html).toMatch(/<span class="directive">defw<\/span>/);
    });
  });

  describe('demo source (mr_soft_demo.asm)', () => {
    it('includes a heading naming the demo source file', () => {
      expect(html).toMatch(/<h2 id="player-source">Source: mr_soft_demo\.asm<\/h2>/);
    });

    it('includes the org directive at $8000', () => {
      expect(html).toMatch(/org\s*<\/span>\s*<span class="number">\$8000<\/span>/);
    });

    it('includes the main loop entry point', () => {
      expect(html).toMatch(/<span class="label">MAIN_LOOP<\/span>/);
    });

    it('includes the halt instruction for 50Hz sync', () => {
      expect(html).toMatch(/<span class="keyword">halt<\/span>/);
    });

    it('includes the draw and erase routines', () => {
      expect(html).toMatch(/<span class="label">DRAW_SPRITE<\/span>/);
      expect(html).toMatch(/<span class="label">ERASE_SPRITE<\/span>/);
    });

    it('includes the two blitter routines', () => {
      expect(html).toMatch(/<span class="label">BLIT_PAIR_SECTION<\/span>/);
      expect(html).toMatch(/<span class="label">BLIT_QUAD_SECTION<\/span>/);
    });

    it('includes the include directive referencing the sprite data file', () => {
      expect(html).toMatch(/<span class="directive">include<\/span> <span class="string">"mr_soft_sprite\.asm"<\/span>/);
    });

    it('includes the end directive', () => {
      expect(html).toMatch(/<span class="directive">end<\/span>\s*START/);
    });
  });

  describe('assembling and running instructions', () => {
    it('shows the pasmo and fuse commands', () => {
      expect(html).toContain('pasmo --tapbas mr_soft_demo.asm mr_soft_demo.tap');
      expect(html).toContain('fuse --tape mr_soft_demo.tap --auto-load');
    });
  });
});
