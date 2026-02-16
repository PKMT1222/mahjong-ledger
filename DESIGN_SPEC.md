# Mahjong Score Tracker - UI Design Specification

## 1. Design System Overview

### Color Palette

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| **Primary** | Teal | `#0D9488` | Headers, buttons, active states |
| **Primary Light** | Light Teal | `#14B8A6` | Hover states, highlights |
| **Primary Dark** | Dark Teal | `#0F766E` | Pressed states, shadows |
| **Background** | Slate 50 | `#F8FAFC` | App background |
| **Surface** | White | `#FFFFFF` | Cards, modals |
| **Text Primary** | Slate 800 | `#1E293B` | Main text |
| **Text Secondary** | Slate 500 | `#64748B` | Labels, meta text |
| **Text Muted** | Slate 400 | `#94A3B8` | Placeholders |
| **Win** | Emerald 600 | `#059669` | Positive scores |
| **Loss** | Red 600 | `#DC2626` | Negative scores |
| **Win Light** | Emerald 100 | `#D1FAE5` | Win badges |
| **Loss Light** | Red 100 | `#FEE2E2` | Loss badges |

### Player Colors (Distinct & Accessible)

| Player | Color | Hex |
|--------|-------|-----|
| Player 1 | Teal | `#0D9488` |
| Player 2 | Violet | `#7C3AED` |
| Player 3 | Orange | `#EA580C` |
| Player 4 | Cyan | `#0891B2` |

### Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Title**: 1.25rem, font-weight: 700
- **Subtitle**: 1rem, font-weight: 600
- **Body**: 0.875rem, font-weight: 400
- **Caption**: 0.75rem, font-weight: 500
- **Score**: 2rem, font-weight: 800, tabular-nums

### Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight spacing |
| `--space-sm` | 8px | Icon gaps |
| `--space-md` | 12px | Element gaps |
| `--space-lg` | 16px | Card padding |
| `--space-xl` | 24px | Section gaps |
| `--space-2xl` | 32px | Screen padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, inputs |
| `--radius-md` | 10px | Cards |
| `--radius-lg` | 16px | Large cards |
| `--radius-xl` | 24px | Modals |
| `--radius-full` | 9999px | Avatars, FAB |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05) | Subtle elevation |
| `--shadow-md` | 0 4px 6px -1px rgba(0,0,0,0.1) | Cards |
| `--shadow-lg` | 0 10px 15px -3px rgba(0,0,0,0.1) | Elevated cards |
| `--shadow-xl` | 0 20px 25px -5px rgba(0,0,0,0.1) | FAB, modals |

---

## 2. Component Library

### Button

```tsx
// Primary Button
<button className="btn btn-primary">
  <span>🀄</span> 新增對局
</button>

// Secondary Button
<button className="btn btn-secondary">取消</button>

// Icon Button
<button className="btn btn-icon">
  <SettingsIcon />
</button>

// Ghost Button
<button className="btn btn-ghost">返回</button>
```

**States:**
- Default: bg-primary, shadow-md
- Hover: translateY(-1px), shadow-lg
- Active: translateY(0), scale(0.98)
- Disabled: opacity-50, cursor-not-allowed

### Card

```tsx
// Game Card
<div className="game-card">
  <div className="game-card-header">
    <h3 className="game-card-title">遊戲名稱</h3>
    <button className="delete-btn"><TrashIcon /></button>
  </div>
  <div className="game-card-meta">香港麻雀 · 東圈</div>
  <div className="game-card-players">
    <div className="player-avatar-small" style={{background: player.color}}>
      {player.initial}
    </div>
  </div>
</div>

// Player Card
<div className="player-card player-card-selected">
  <div className="player-avatar" style={{background: player.color}}>
    {player.initial}
  </div>
  <div className="player-info">
    <div className="player-name">{player.name}</div>
    <div className="player-meta">莊家 · 3連莊</div>
  </div>
  <div className="score score-positive">+240</div>
</div>

// Stat Card
<div className="stat-card">
  <div className="stat-value">128</div>
  <div className="stat-label">總對局數</div>
</div>
```

### Modal (Bottom Sheet)

```tsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2 className="modal-title">記錄分數</h2>
      <button className="modal-close">✕</button>
    </div>
    {/* Modal content */}
  </div>
</div>
```

### Floating Action Button (FAB)

```tsx
<button className="fab">
  <PlusIcon size={24} />
</button>
```

**Position:** Fixed, bottom: 24px, right: 24px
**Animation:** Hover scale(1.1) rotate(90deg)

### Tab Bar

```tsx
<div className="tab-bar">
  <button className="tab tab-active">記分</button>
  <button className="tab">紀錄</button>
  <button className="tab">統計</button>
</div>
```

### Score Display

```tsx
// Large Score
<div className="score score-positive text-4xl">+240</div>

// Badge
<span className="score-badge score-badge-win">+12</span>
<span className="score-badge score-badge-loss">-36</span>
```

---

## 3. Screen Designs

### Home Screen (Ongoing Games)

```
┌─────────────────────────────┐
│  🀄 Mahjong Ledger    ⚙️    │  ← Header (Teal gradient)
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ 🀄 新開對局              ││  ← Primary Button
│  └─────────────────────────┘│
├─────────────────────────────┤
│  進行中對局                   │
│  ┌─────────────────────────┐│
│  │ 週末大戰        [🗑️]   ││  ← Game Card
│  │ 香港麻雀 · 東圈 · 第3局  ││
│  │ 👤👤👤👤 +12 more      ││  ← Player avatars
│  └─────────────────────────┘│
│  ┌─────────────────────────┐│
│  │ 家庭聚會        [🗑️]   ││
│  │ 台灣麻將 · 南圈 · 第8局  ││
│  │ 👤👤👤👤              ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  最近完成                     │
│  ┌─────────────────────────┐│
│  │ 朋友聚會           +240 ││  ← Completed game
│  │ 已完成 · 2小時前         ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Active Game Screen

```
┌─────────────────────────────┐
│  ← 週末大戰           ⋮      │  ← Toolbar
├─────────────────────────────┤
│  ┌────┬────┬────┬────┐     │
│  │東  │南  │西  │北  │     │  ← Wind indicators
│  │莊  │    │    │    │     │
│  ├────┼────┼────┼────┤     │
│  │陳 │李 │張 │王 │     │  ← Player names
│  │+240│-80 │-80 │-80 │     │  ← Scores (colored)
│  │🏆5🎯2│...│...│...│     │  ← Stats
│  └────┴────┴────┴────┘     │
├─────────────────────────────┤
│  [記分] [紀錄] [統計]       │  ← Tab bar
├─────────────────────────────┤
│                             │
│                             │
│                             │
│                             │
│              ┌────┐         │
│              │  + │         │  ← FAB
│              └────┘         │
└─────────────────────────────┘
```

### Scoring Modal (Bottom Sheet)

```
┌─────────────────────────────┐
│         ⬤                  │  ← Drag handle
│ 記錄分數              ✕     │  ← Title + Close
├─────────────────────────────┤
│ 番數                          │
│ [1] [2] [3✓] [4] [5]...    │  ← Horizontal scroll chips
├─────────────────────────────┤
│ 食糊玩家                      │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│ │陳✓│ │ 李 │ │ 張 │ │ 王 │    │  ← Player selection
│ └───┘ └───┘ └───┘ └───┘    │
├─────────────────────────────┤
│ 自摸 ☐  包自摸 ☐            │  ← Toggles
├─────────────────────────────┤
│ 預覽: 3番 × 1.5 = 12分       │  ← Preview
├─────────────────────────────┤
│ [   取消   ] [  確認 (12分)  ]│  ← Actions
└─────────────────────────────┘
```

### Statistics Screen

```
┌─────────────────────────────┐
│  ← 統計中心        [2025▼]   │
├─────────────────────────────┤
│ [全局統計] [玩家統計]        │  ← Tabs
├─────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│ │128│ │450│ │+12│ │ 4 │    │  ← Stat cards
│ │對局│ │手數│ │贏錢│ │玩家│    │
│ └───┘ └───┘ └───┘ └───┘    │
├─────────────────────────────┤
│ 熱門牌型                      │
│      ┌────┐                 │
│     /  雞胡  \               │  ← Doughnut chart
│    │   45%   │              │
│     \  碰碰胡 /              │
│      └────┘                 │
├─────────────────────────────┤
│ 👑 玩家排行榜                 │
│ 🥇 陳大文    +12,450        │
│ 🥈 李小明    +8,320         │
│ 🥉 張小華    -2,100         │
└─────────────────────────────┘
```

---

## 4. Interaction Design

### Touch Targets

All interactive elements must be at least **44×44px**.

### Animations

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Button press | 150ms | ease-out | All buttons |
| Card lift | 200ms | ease-out | Hover effects |
| Modal slide | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Bottom sheet |
| Card delete | 300ms | ease-out | Swipe to delete |
| Page transition | 200ms | ease-out | Navigation |
| FAB rotate | 200ms | ease-out | Hover effect |

### Micro-interactions

1. **Button Press**
   - Scale to 0.98
   - Slight opacity change
   - Ripple effect on buttons

2. **Card Hover**
   - translateY(-2px)
   - Shadow increases
   - Border color change

3. **Score Change**
   - Number animation (count up)
   - Color pulse for positive/negative

4. **Tab Switch**
   - Background slide animation
   - Text color transition

---

## 5. Accessibility

### Color Contrast

- All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Interactive elements have focus indicators
- Color is not the only means of conveying information

### Touch Targets

- Minimum 44×44px
- Adequate spacing between elements

### Screen Readers

- Semantic HTML structure
- ARIA labels for icons
- Alt text for images

### Reduced Motion

- Respect `prefers-reduced-motion`
- Disable animations for users who prefer reduced motion

---

## 6. Implementation Notes

### CSS Framework Recommendation

Use **Tailwind CSS** with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          light: '#14B8A6',
          dark: '#0F766E',
          50: '#F0FDFA',
        },
        surface: '#FFFFFF',
        background: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      },
    },
  },
}
```

### Component Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Avatar.tsx
│   ├── game/
│   │   ├── PlayerCard.tsx
│   │   ├── ScoreBoard.tsx
│   │   ├── GameCard.tsx
│   │   └── ScoringModal.tsx
│   └── stats/
│       ├── StatCard.tsx
│       ├── Chart.tsx
│       └── PlayerRanking.tsx
├── styles/
│   ├── design-system.css
│   ├── components.css
│   └── globals.css
```

### Icon Library

Use **Lucide React** or **Heroicons** for consistent iconography.

---

## 7. Migration Plan

### Phase 1: Foundation (Done)
- [x] Create design system CSS
- [x] Define color palette and typography
- [x] Create component library

### Phase 2: Core Components
- [ ] Update Button component
- [ ] Update Card components
- [ ] Update Input components
- [ ] Create new Modal component

### Phase 3: Screen Updates
- [ ] Redesign Home screen
- [ ] Redesign Game screen
- [ ] Redesign Scoring modal
- [ ] Redesign Statistics screen

### Phase 4: Polish
- [ ] Add animations
- [ ] Test accessibility
- [ ] Responsive testing
- [ ] Performance optimization

---

## 8. Summary

This design system provides:

1. **Modern aesthetic** with teal primary color
2. **Consistent components** for all UI elements
3. **Mobile-first** responsive design
4. **Accessibility** compliance
5. **Smooth animations** for better UX
6. **Easy to maintain** with CSS variables

The design is inspired by modern mobile apps with:
- Clean cards with subtle shadows
- Clear typography hierarchy
- Intuitive touch targets
- Pleasant color scheme
- Smooth interactions
