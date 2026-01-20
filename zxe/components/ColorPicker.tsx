'use client';

import { ZX_COLOURS } from '@/constants';

interface ColorPickerProps {
  label: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  bright: boolean;
}

export function ColorPicker({ label, selectedIndex, onSelect, bright }: ColorPickerProps) {
  return (
    <div>
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="flex gap-1 flex-wrap">
        {ZX_COLOURS.map((colour, index) => (
          <button
            key={`${label}-${index}`}
            onClick={() => onSelect(index)}
            className={`w-8 h-8 rounded border-2 ${
              selectedIndex === index ? 'border-white' : 'border-gray-600'
            }`}
            style={{ backgroundColor: bright ? colour.bright : colour.normal }}
            title={colour.name}
          />
        ))}
      </div>
    </div>
  );
}
