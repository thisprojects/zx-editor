'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/sprite_editor', label: 'UDG Editor' },
  { href: '/player_sprite_editor', label: 'Player Sprite' },
  { href: '/scene_editor', label: 'Scene Editor' },
  { href: '/tile_editor', label: 'Tile Editor' },
  { href: '/level_editor', label: 'Level Editor' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 h-10 bg-gray-800 border-b border-gray-700 z-50 flex items-center px-4">
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
