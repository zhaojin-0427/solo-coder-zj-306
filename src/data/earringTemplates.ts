import type { EarringTemplate } from '@/types'

export const earringTemplates: EarringTemplate[] = [
  {
    id: 'stud-01',
    name: '珍珠耳钉',
    category: 'stud',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="14" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <circle cx="20" cy="24" r="8" fill="#f5f0e8" stroke="#d4a574" stroke-width="0.8"/>
      <ellipse cx="17" cy="21" rx="2" ry="3" fill="rgba(255,255,255,0.4)" transform="rotate(-15 17 21)"/>
      <circle cx="20" cy="14" r="2" fill="#e8c9a0"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 40,
    anchorPoint: { x: 20, y: 14 },
  },
  {
    id: 'stud-02',
    name: '钻石耳钉',
    category: 'stud',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
      <circle cx="20" cy="14" r="3" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <polygon points="20,16 24,24 20,32 16,24" fill="#e8e8f0" stroke="#c0c0d0" stroke-width="0.5"/>
      <polygon points="20,16 22,24 20,28 18,24" fill="rgba(255,255,255,0.3)"/>
      <line x1="16" y1="24" x2="24" y2="24" stroke="#c0c0d0" stroke-width="0.3"/>
      <line x1="20" y1="16" x2="20" y2="32" stroke="#c0c0d0" stroke-width="0.3"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 40,
    anchorPoint: { x: 20, y: 14 },
  },
  {
    id: 'stud-03',
    name: '花朵耳钉',
    category: 'stud',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">
      <circle cx="22" cy="14" r="3" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <ellipse cx="22" cy="18" rx="3" ry="6" fill="#b76e79" opacity="0.8"/>
      <ellipse cx="22" cy="18" rx="3" ry="6" fill="#b76e79" opacity="0.8" transform="rotate(72 22 24)"/>
      <ellipse cx="22" cy="18" rx="3" ry="6" fill="#b76e79" opacity="0.8" transform="rotate(144 22 24)"/>
      <ellipse cx="22" cy="18" rx="3" ry="6" fill="#b76e79" opacity="0.8" transform="rotate(216 22 24)"/>
      <ellipse cx="22" cy="18" rx="3" ry="6" fill="#b76e79" opacity="0.8" transform="rotate(288 22 24)"/>
      <circle cx="22" cy="24" r="3" fill="#d4a574"/>
    </svg>`,
    defaultWidth: 44,
    defaultHeight: 44,
    anchorPoint: { x: 22, y: 14 },
  },
  {
    id: 'drop-01',
    name: '水滴耳坠',
    category: 'drop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 80">
      <circle cx="18" cy="10" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <line x1="18" y1="14" x2="18" y2="28" stroke="#d4a574" stroke-width="1.2"/>
      <path d="M10,28 Q18,26 26,28 Q24,50 18,68 Q12,50 10,28Z" fill="#b76e79" stroke="#9a5a64" stroke-width="0.5" opacity="0.85"/>
      <path d="M14,32 Q18,30 20,34 Q18,52 16,48Z" fill="rgba(255,255,255,0.2)"/>
    </svg>`,
    defaultWidth: 36,
    defaultHeight: 80,
    anchorPoint: { x: 18, y: 10 },
  },
  {
    id: 'drop-02',
    name: '链条耳坠',
    category: 'drop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 90">
      <circle cx="15" cy="8" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <path d="M15,12 Q12,18 15,22 Q18,26 15,30 Q12,34 15,38 Q18,42 15,46 Q12,50 15,54 Q18,58 15,62 Q12,66 15,70 Q18,74 15,78" stroke="#d4a574" stroke-width="1.5" fill="none"/>
      <circle cx="15" cy="82" r="5" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <circle cx="15" cy="82" r="2.5" fill="#e8c9a0"/>
    </svg>`,
    defaultWidth: 30,
    defaultHeight: 90,
    anchorPoint: { x: 15, y: 8 },
  },
  {
    id: 'drop-03',
    name: '星月耳坠',
    category: 'drop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 80">
      <circle cx="20" cy="8" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <line x1="20" y1="12" x2="20" y2="30" stroke="#d4a574" stroke-width="1"/>
      <polygon points="20,30 22,36 28,36 23,40 25,46 20,42 15,46 17,40 12,36 18,36" fill="#e8c9a0" stroke="#d4a574" stroke-width="0.5"/>
      <path d="M16,52 Q20,48 24,52 Q22,58 20,62 Q18,58 16,52Z" fill="#d4a574" opacity="0.9"/>
      <circle cx="18" cy="54" r="1" fill="rgba(255,255,255,0.4)"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 80,
    anchorPoint: { x: 20, y: 8 },
  },
  {
    id: 'hoop-01',
    name: '经典金圈',
    category: 'hoop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 60">
      <circle cx="25" cy="8" r="3" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <circle cx="25" cy="36" r="22" fill="none" stroke="#d4a574" stroke-width="3"/>
      <circle cx="25" cy="36" r="22" fill="none" stroke="#e8c9a0" stroke-width="1" stroke-dasharray="2 4"/>
    </svg>`,
    defaultWidth: 50,
    defaultHeight: 60,
    anchorPoint: { x: 25, y: 8 },
  },
  {
    id: 'hoop-02',
    name: '细圈耳环',
    category: 'hoop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 52">
      <circle cx="22" cy="8" r="3" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <circle cx="22" cy="30" r="20" fill="none" stroke="#d4a574" stroke-width="1.5"/>
    </svg>`,
    defaultWidth: 44,
    defaultHeight: 52,
    anchorPoint: { x: 22, y: 8 },
  },
  {
    id: 'hoop-03',
    name: '双圈耳环',
    category: 'hoop',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 64">
      <circle cx="25" cy="8" r="3" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <circle cx="25" cy="26" r="16" fill="none" stroke="#d4a574" stroke-width="2"/>
      <circle cx="25" cy="42" r="16" fill="none" stroke="#b76e79" stroke-width="2"/>
      <line x1="25" y1="10" x2="25" y2="26" stroke="#d4a574" stroke-width="1"/>
    </svg>`,
    defaultWidth: 50,
    defaultHeight: 64,
    anchorPoint: { x: 25, y: 8 },
  },
  {
    id: 'tassel-01',
    name: '丝线流苏',
    category: 'tassel',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 100">
      <circle cx="20" cy="8" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <rect x="12" y="14" width="16" height="8" rx="2" fill="#b76e79"/>
      <line x1="14" y1="22" x2="14" y2="85" stroke="#d4a574" stroke-width="1" opacity="0.8"/>
      <line x1="17" y1="22" x2="17" y2="90" stroke="#d4a574" stroke-width="1" opacity="0.8"/>
      <line x1="20" y1="22" x2="20" y2="88" stroke="#d4a574" stroke-width="1" opacity="0.8"/>
      <line x1="23" y1="22" x2="23" y2="92" stroke="#d4a574" stroke-width="1" opacity="0.8"/>
      <line x1="26" y1="22" x2="26" y2="86" stroke="#d4a574" stroke-width="1" opacity="0.8"/>
      <circle cx="14" cy="85" r="1.5" fill="#d4a574"/>
      <circle cx="17" cy="90" r="1.5" fill="#d4a574"/>
      <circle cx="20" cy="88" r="1.5" fill="#d4a574"/>
      <circle cx="23" cy="92" r="1.5" fill="#d4a574"/>
      <circle cx="26" cy="86" r="1.5" fill="#d4a574"/>
    </svg>`,
    defaultWidth: 40,
    defaultHeight: 100,
    anchorPoint: { x: 20, y: 8 },
  },
  {
    id: 'tassel-02',
    name: '珠串流苏',
    category: 'tassel',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 96">
      <circle cx="22" cy="8" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <line x1="22" y1="12" x2="22" y2="22" stroke="#d4a574" stroke-width="1"/>
      <circle cx="22" cy="26" r="4" fill="#b76e79" opacity="0.8"/>
      <line x1="14" y1="30" x2="14" y2="70" stroke="#d4a574" stroke-width="0.8"/>
      <line x1="22" y1="30" x2="22" y2="75" stroke="#d4a574" stroke-width="0.8"/>
      <line x1="30" y1="30" x2="30" y2="68" stroke="#d4a574" stroke-width="0.8"/>
      <circle cx="14" cy="74" r="3" fill="#d4a574" opacity="0.6"/>
      <circle cx="22" cy="79" r="3" fill="#d4a574" opacity="0.6"/>
      <circle cx="30" cy="72" r="3" fill="#d4a574" opacity="0.6"/>
      <circle cx="14" cy="82" r="2" fill="#b76e79" opacity="0.5"/>
      <circle cx="22" cy="87" r="2" fill="#b76e79" opacity="0.5"/>
      <circle cx="30" cy="80" r="2" fill="#b76e79" opacity="0.5"/>
    </svg>`,
    defaultWidth: 44,
    defaultHeight: 96,
    anchorPoint: { x: 22, y: 8 },
  },
  {
    id: 'tassel-03',
    name: '扇形流苏',
    category: 'tassel',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 90">
      <circle cx="25" cy="8" r="4" fill="#d4a574" stroke="#b8864e" stroke-width="0.5"/>
      <line x1="25" y1="12" x2="25" y2="22" stroke="#d4a574" stroke-width="1"/>
      <path d="M15,22 Q25,18 35,22 L32,26 Q25,22 18,26Z" fill="#d4a574"/>
      <line x1="15" y1="26" x2="12" y2="78" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
      <line x1="19" y1="26" x2="17" y2="82" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
      <line x1="23" y1="26" x2="22" y2="84" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
      <line x1="27" y1="26" x2="28" y2="84" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
      <line x1="31" y1="26" x2="33" y2="82" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
      <line x1="35" y1="26" x2="38" y2="78" stroke="#d4a574" stroke-width="0.8" opacity="0.7"/>
    </svg>`,
    defaultWidth: 50,
    defaultHeight: 90,
    anchorPoint: { x: 25, y: 8 },
  },
]

export const categoryLabels: Record<string, string> = {
  stud: '耳钉',
  drop: '耳坠',
  hoop: '圈环',
  tassel: '流苏',
}
