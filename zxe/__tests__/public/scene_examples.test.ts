import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(
  path.join(__dirname, '..', '..', 'public', 'scene_examples.html'),
  'utf-8'
);

describe('scene_examples.html', () => {
  describe('page structure', () => {
    it('has a top-level Scene ASM Example heading', () => {
      expect(html).toMatch(/<h1>Scene ASM Example<\/h1>/);
    });

    it('has the correct page title', () => {
      expect(html).toContain('<title>Scene ASM Example: Displaying an Exported .scr File on Z80 Hardware</title>');
    });

    it('has an introduction section', () => {
      expect(html).toMatch(/<section id="introduction">/);
    });

    it('links back to the Z80 Assembly Introduction', () => {
      expect(html).toContain('href="/z80_book.html"');
    });

    it('has the scene example section', () => {
      expect(html).toMatch(/<section id="scene-example">/);
      expect(html).toMatch(/<h1>Scene: Loading an Exported \.scr File<\/h1>/);
    });
  });

  describe('sidebar navigation', () => {
    it('links to asm_examples.html for the UDG page', () => {
      expect(html).toContain('<a href="/asm_examples.html">UDG</a>');
    });

    it('links to player_sprite_examples.html for the Player Sprite page', () => {
      expect(html).toContain('<a href="/player_sprite_examples.html">Player Sprite</a>');
    });

    it('links to scene_examples.html for the Scene page', () => {
      expect(html).toContain('<a href="/scene_examples.html">Scene</a>');
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

  describe('scene example sub-sections', () => {
    const expectedHeadingIds = [
      'scene-incbin',
      'scene-copy',
      'scene-source',
      'scene-running',
    ];

    it.each(expectedHeadingIds)('includes the %s sub-section', (id) => {
      expect(html).toContain(`id="${id}"`);
    });
  });

  describe('INCBIN explanation', () => {
    it('includes the incbin directive referencing myscreen.scr', () => {
      expect(html).toMatch(/<span class="directive">incbin<\/span>\s*<span class="string">"myscreen\.scr"<\/span>/);
    });

    it('includes the screen_data label', () => {
      expect(html).toMatch(/<span class="label">screen_data<\/span>/);
    });
  });

  describe('source (scene_viewer.asm)', () => {
    it('includes a heading naming the viewer source file', () => {
      expect(html).toMatch(/<h2 id="scene-source">Source: scene_viewer\.asm<\/h2>/);
    });

    it('includes the org directive at $8000', () => {
      expect(html).toMatch(/org\s*<\/span>\s*<span class="number">\$8000<\/span>/);
    });

    it('includes the ldir copies to display and attribute memory', () => {
      expect(html).toContain('de, $4000');
      expect(html).toContain('de, $5800');
      expect(html).toMatch(/<span class="keyword">ldir<\/span>/g);
    });

    it('includes the halt loop', () => {
      expect(html).toMatch(/<span class="label">halt_loop<\/span>/);
      expect(html).toMatch(/<span class="keyword">halt<\/span>/);
    });

    it('includes the end directive', () => {
      expect(html).toMatch(/<span class="directive">end<\/span>\s*start/);
    });
  });

  describe('assembling and running instructions', () => {
    it('shows the pasmo and fuse commands', () => {
      expect(html).toContain('pasmo --tapbas scene_viewer.asm scene_viewer.tap');
      expect(html).toContain('fuse --tape scene_viewer.tap --auto-load');
    });
  });
});
