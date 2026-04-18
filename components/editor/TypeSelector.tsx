'use client';

import { Layout, GitFork, Palette, Code2 } from 'lucide-react';
import { BlueprintType, BLUEPRINT_TYPES } from '@/lib/types';

const ICONS = {
  'wireframe':       Layout,
  'system-diagram':  GitFork,
  'visual-design':   Palette,
  'code-blueprint':  Code2,
};

const COLORS: Record<BlueprintType, string> = {
  'wireframe':       '#58a6ff',
  'system-diagram':  '#a371f7',
  'visual-design':   '#3fb950',
  'code-blueprint':  '#d29922',
};

interface Props {
  value: BlueprintType;
  onChange: (type: BlueprintType) => void;
  disabled?: boolean;
}

export default function TypeSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BLUEPRINT_TYPES.map((type) => {
        const Icon = ICONS[type.id];
        const color = COLORS[type.id];
        const selected = value === type.id;

        return (
          <button
            key={type.id}
            onClick={() => !disabled && onChange(type.id)}
            disabled={disabled}
            style={{
              backgroundColor: selected ? `${color}12` : 'transparent',
              border: `1px solid ${selected ? color : '#30363d'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              textAlign: 'left',
              transition: 'all 0.1s',
            }}
            className={!disabled && !selected ? 'hover:border-[#484f58] hover:bg-[#21262d20]' : ''}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon style={{ color: selected ? color : '#8b949e', width: '14px', height: '14px' }} />
              <span
                style={{
                  color: selected ? color : '#e6edf3',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {type.label}
              </span>
            </div>
            <p style={{ color: '#6e7681', fontSize: '11px', lineHeight: '1.4' }}>
              {type.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
