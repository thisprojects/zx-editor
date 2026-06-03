import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const editors = [
  {
    href: '/sprite_editor',
    label: 'UDG Editor',
    badge: 'UDG',
    badgeColor: 'bg-yellow-500',
    summary: 'Design User Defined Graphics — the 21 custom character slots built into ZX Spectrum hardware.',
    details: [
      'Each UDG is an 8×8 pixel sprite with its own ink and paper colour.',
      'Canvas holds up to 21 cells (the hardware limit).',
      'Exports as Z80 assembly with pixel data, attribute data, and load routines.',
    ],
  },
  {
    href: '/player_sprite_editor',
    label: 'Player Sprite Editor',
    badge: 'SPR',
    badgeColor: 'bg-green-500',
    summary: 'Create software sprites that are drawn pixel-accurately into screen memory — not bound to the character grid.',
    details: [
      'Monochrome pixel data; colour is applied at runtime.',
      'Supports multiple animation frames with onion skinning.',
      'Generates masks and pre-shifted variants for smooth horizontal movement.',
    ],
  },
  {
    href: '/scene_editor',
    label: 'Scene Editor',
    badge: 'SCR',
    badgeColor: 'bg-blue-500',
    summary: 'Paint a full 256×192 ZX Spectrum screen with ink and paper colours obeying the 8×8 colour-clash constraint.',
    details: [
      'Pencil and line tools place foreground (ink) pixels.',
      'Bucket fill sets the background (paper) colour of whole 8×8 squares.',
      'Exports the native 6912-byte .scr binary — load straight to $4000.',
    ],
  },
  {
    href: '/tile_editor',
    label: 'Tile Editor',
    badge: 'TILE',
    badgeColor: 'bg-purple-500',
    summary: 'Design reusable tiles — walls, floors, platforms — in 8×8, 16×16, or 24×24 pixel sizes.',
    details: [
      'Each 8×8 block within a tile has its own independent ink and paper colour.',
      'Save tiles as .json files to reuse across multiple levels.',
      'Exports pixel and attribute data as Z80 assembly with print routines.',
    ],
  },
  {
    href: '/level_editor',
    label: 'Level Editor',
    badge: 'LVL',
    badgeColor: 'bg-orange-500',
    summary: 'Assemble full game screens by placing tiles on a grid. Build an entire multi-screen game world in one project.',
    details: [
      'Each screen is a standard 256×192 ZX Spectrum display.',
      'Load tiles from the Tile Editor and paint them onto the canvas.',
      'Exports screen maps, tile data, lookup tables, and a draw_screen routine.',
    ],
  },
  {
    href: '/charset_editor',
    label: 'Charset Editor',
    badge: 'CHR',
    badgeColor: 'bg-red-500',
    summary: 'Redesign all 96 ASCII characters (32–127) to create a fully custom font for your game or demo.',
    details: [
      'Click any character in the overview grid to edit its 8×8 pixel shape.',
      'Pixel shape only — ink and paper are applied at runtime by your program.',
      'Exports as a compact .chr binary or readable DEFB assembly source.',
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            ZX Spectrum Graphics Editor
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A browser-based suite for authoring ZX Spectrum graphics and exporting
            ready-to-use Z80 assembly. Pick an editor below to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {editors.map((ed) => (
            <Link
              key={ed.href}
              href={ed.href}
              className="group flex flex-col bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-gray-500 hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`${ed.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded font-mono`}>
                  {ed.badge}
                </span>
                <h2 className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                  {ed.label}
                </h2>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{ed.summary}</p>
              <ul className="mt-auto space-y-1.5">
                {ed.details.map((d, i) => (
                  <li key={i} className="flex gap-2 text-xs text-gray-500">
                    <span className="mt-0.5 shrink-0 w-1 h-1 rounded-full bg-gray-600 mt-1.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
