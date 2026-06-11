import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(
  path.join(__dirname, '..', '..', 'public', 'charset_examples.html'),
  'utf-8'
);

describe('charset_examples.html', () => {
  describe('page structure', () => {
    it('has a top-level Charset ASM Example heading', () => {
      expect(html).toMatch(/<h1>Charset ASM Example<\/h1>/);
    });

    it('has an introduction section explaining the page', () => {
      expect(html).toMatch(/<section id="introduction">/);
      expect(html).toMatch(/Charset Editor lets you redesign/);
    });

    it('links back to the Z80 Assembly Introduction', () => {
      expect(html).toContain('href="/z80_book.html"');
    });

    it('has a charset example section', () => {
      expect(html).toMatch(/<section id="charset-example">/);
      expect(html).toMatch(/<h1>Charset: Displaying an Exported Font<\/h1>/);
    });
  });

  describe('sidebar navigation', () => {
    it('links to charset_examples.html for the Charset page', () => {
      expect(html).toContain('<a href="/charset_examples.html">Charset</a>');
    });

    it('links to the other example pages', () => {
      expect(html).toContain('<a href="/asm_examples.html">UDG</a>');
      expect(html).toContain('<a href="/player_sprite_examples.html">Player Sprite</a>');
      expect(html).toContain('<a href="/scene_examples.html">Scene</a>');
    });

    it('renders the collapsible examples menu controls', () => {
      expect(html).toContain('id="examples-toggle"');
      expect(html).toContain('id="examples-list"');
      expect(html).toContain('toggleExamplesMenu');
    });

    it('defines the toggleExamplesMenu script that flips aria-expanded and the arrow glyph', () => {
      expect(html).toMatch(/function toggleExamplesMenu\(\)/);
      expect(html).toContain("btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false')");
    });
  });

  describe('charset example sub-sections', () => {
    const expectedHeadingIds = [
      'charset-loading',
      'charset-clearing',
      'charset-draw-loop',
      'charset-border-flags',
      'charset-source',
      'charset-running',
    ];

    it.each(expectedHeadingIds)('includes the %s sub-section', (id) => {
      expect(html).toContain(`id="${id}"`);
    });
  });

  describe('CHR vs ASM export guidance', () => {
    it('tells the reader to use Export CHR, not Export ASM', () => {
      expect(html).toMatch(/use <strong>Export CHR<\/strong>/);
      expect(html).toMatch(/not the ASM export/);
    });

    it('explains the viewer uses incbin for raw bytes', () => {
      expect(html).toContain('incbin');
    });
  });

  describe('viewer source example (charset_viewer.asm)', () => {
    it('includes a heading naming the viewer source file', () => {
      expect(html).toMatch(/<h2 id="charset-source">Source: charset_viewer\.asm<\/h2>/);
    });

    it('includes the complete viewer with org, incbin and end directives', () => {
      expect(html).toMatch(/org\s*<\/span>\s*<span class="number">\$8000<\/span>/);
      expect(html).toContain('incbin');
      expect(html).toContain('"myfont.chr"');
      expect(html).toMatch(/<span class="directive">end<\/span>\s*start/);
    });

    it('tells the reader to rename myfont.chr to match their export', () => {
      expect(html).toMatch(/rename <code>myfont\.chr<\/code>/);
      expect(html).toMatch(/to match whatever filename your own exported charset was saved as/);
    });

    it('includes the load, clear and draw-loop logic', () => {
      expect(html).toContain('chr_buf');
      expect(html).toContain('chr_data');
      expect(html).toContain('draw_loop');
      expect(html).toContain('halt_loop');
    });

    it('includes the border flag colour-change instructions', () => {
      expect(html).toMatch(/<span class="keyword">out<\/span>\s*\(254\), a/);
      expect(html).toContain('Red border = code is running');
      expect(html).toContain('White border = display ready');
    });
  });

  describe('assembling and running instructions', () => {
    it('shows the pasmo and fuse commands referenced elsewhere on the page', () => {
      expect(html).toContain('pasmo --tapbas charset_viewer.asm charset_viewer.tap');
      expect(html).toContain('fuse --tape charset_viewer.tap --auto-load');
    });

    it('tells the reader to edit the incbin line to match their own export', () => {
      expect(html).toMatch(/edit the <code>incbin<\/code> line/);
      expect(html).toMatch(/to match whatever filename your export was saved as/);
    });
  });
});
