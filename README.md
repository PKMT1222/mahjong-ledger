# 🀄 麻將計數機 (Mahjong Ledger)

A comprehensive Mahjong scoring web application supporting multiple variants with full game tracking, statistics, and settlement calculation.

## 🎯 Features

### Supported Variants (5 Types)
1. **台灣麻將 (Taiwan Mahjong)** - 16 tiles, classic Taiwanese rules
2. **日本麻雀 (Japanese/Riichi Mahjong)** - With riichi, uma points, tenpai penalties
3. **香港麻雀 (Hong Kong Mahjong)** - 13 tiles, full/half liability
4. **港式台灣麻雀 (HK-Style Taiwan)** - Hybrid rules
5. **跑馬仔 (Pao Ma Zai)** - Running horse variant

### Core Features
- ✅ **Multi-variant support** with variant-specific scoring
- ✅ **One-click scoring** - Easy interface, no manual number input
- ✅ **Undo/Redo** - Cancel last round if entered incorrectly
- ✅ **Special cases**:
  - 包自摸 (Bao Zimo) - Liability for self-draw
  - 一炮多響 (Multiple wins from one discard)
  - 連莊拉莊 (Dealer repeat/rotation)
  - 立直 (Riichi) - Japanese mahjong
  - 荒牌流局 (Exhaustive draw)
- ✅ **3-8 player support** with position swapping
- ✅ **Settlement calculator (找數)** - Final payment calculation
- ✅ **Game statistics & player titles**:
  - 🏆 食糊王 (Winning King)
  - 🎯 自摸王 (Self-Draw King)
  - 💥 出統王 (Deal-in King)
- ✅ **Results sharing** - Export game results

### Variant-Specific Rules

#### Taiwan Mahjong
- 底/台 (Base/Tai) scoring
- 連莊拉莊 (Dealer repeat bonus)
- 罰台/詐胡 (Penalty for false wins)
- 門骰加倍 (Door dice doubling)
- 40+ hand types supported

#### Japanese Mahjong
- 原點/返點/馬點/不聽罰符 (Start/Return/Uma/Noten points)
- 立直 (Riichi) tracking
- 延長賽 (Extended games/West round)
- 荒牌流局/途中流局/流局滿貫 (Draw variants)
- 50+ hand types (役/Yaku)

#### Hong Kong Mahjong
- 全銃/半銃 (Full/Half liability)
- Jackpot support
- Custom self-draw multiplier
- 20+ hand types

#### HK-Style Taiwan
- Automatic 拉/踢半 score calculation
- 投降 (Surrender) support
- 擲圍骰/槓 (Dice/Kong bonuses)

#### Pao Ma Zai
- 獎馬 (Bonus horses)
- 包自摸 (Liability)
- 富貴莊 (Rich dealer)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (we recommend Railway)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/PKMT1222/mahjong-ledger.git
   cd mahjong-ledger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create `.env.local`:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   ```

4. **Initialize database**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Click "初始化資料庫" (Initialize Database)
   ```

5. **Start playing!**

## 📱 Usage Guide

### 1. Create Players
- Add player names on the home screen
- Players persist across games
- Statistics tracked per player

### 2. Start a Game
- Select 3-8 players
- Choose mahjong variant
- Configure settings (optional)

### 3. During the Game
- **Score Tab**: Record each round
  - Select dealer
  - Choose winner(s) - supports multiple winners
  - Select hand types (台/番)
  - Mark special conditions (自摸, 包自摸, 立直, etc.)
- **History Tab**: View all recorded rounds
- **Stats Tab**: See real-time statistics and titles

### 4. End Game
- Click "結束牌局" to finish
- View final settlement
- Share results

### 5. Undo Mistakes
- Click "還原" to undo the last round
- Scores automatically recalculated

## 🗄️ Database Schema

### Tables
- `players` - Player profiles
- `games` - Game sessions with variant/settings
- `game_players` - Player participation with scores/stats
- `rounds` - Individual round records
- `round_hands` - Detailed hand types per round
- `transactions` - Settlement records
- `game_history` - Undo/audit log
- `player_stats` - Cross-game statistics

## 🔌 API Endpoints

### Players
- `GET /api/players` - List all players with stats
- `POST /api/players` - Create new player

### Games
- `GET /api/games` - List all games
- `POST /api/games` - Create new game
- `PUT /api/games` - Update game status

### Rounds
- `GET /api/games/[id]/rounds` - Get game rounds
- `POST /api/games/[id]/rounds` - Add round

### Other
- `POST /api/init` - Initialize database
- `POST /api/games/[id]/undo` - Undo last round
- `GET /api/games/[id]/settlement` - Calculate final settlement
- `GET /api/hand-types?variant=` - Get hand types for variant
- `GET /api/stats` - Get player statistics

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## 🌐 Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Connect repo on [Vercel](https://vercel.com)
3. Add `DATABASE_URL` environment variable
4. Deploy!

### Database Setup (Railway)
1. Create PostgreSQL database on [Railway](https://railway.app)
2. Copy connection string
3. Add to Vercel environment variables

## 📸 Screenshots

*Coming soon*

## 📝 License

MIT License

## 🙏 Credits

Inspired by the iOS app "麻將計數機" (Mahjong Counter)

---

Made with ❤️ for mahjong enthusiasts everywhere
