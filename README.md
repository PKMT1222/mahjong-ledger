# 🀄 Mahjong Ledger

A full-stack Mahjong score tracking application built with Next.js and PostgreSQL.

## Features

- 🎮 **Game Management**: Create and manage multiple mahjong games
- 👥 **Player Profiles**: Track players across games
- 📝 **Round Recording**: Log each round with dealer, winner, loser, hand type, and points
- 📊 **Live Scoreboard**: Real-time score updates as rounds are added
- 🗄️ **Persistent Storage**: PostgreSQL database for data persistence

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Railway)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/PKMT1222/mahjong-ledger.git
   cd mahjong-ledger
   npm install
   ```

2. **Environment Setup**
   Create `.env.local`:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```

3. **Initialize Database**
   ```bash
   npm run dev
   # Then click "Initialize Database" button on the homepage
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Database Schema

- **players**: Player profiles
- **games**: Game sessions
- **game_players**: Many-to-many relationship
- **rounds**: Individual round records
- **transactions**: Point transfers (optional extension)

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/init` | Initialize database tables |
| GET | `/api/players` | List all players |
| POST | `/api/players` | Create new player |
| GET | `/api/games` | List all games |
| POST | `/api/games` | Create new game |
| GET | `/api/games/[id]/rounds` | Get game rounds |
| POST | `/api/games/[id]/rounds` | Add round to game |

## Usage Flow

1. Click "Initialize Database" to set up tables
2. Add players on the homepage
3. Create a new game and select players
4. Click on a game to open it
5. Add rounds with dealer, winner, loser, and points
6. Watch scores update automatically!

## Future Enhancements

- [ ] Multiple hand types with auto-calculated points
- [ ] Game history and statistics
- [ ] Export to CSV/PDF
- [ ] Multi-language support
- [ ] Mobile app

---

Built with ❤️ for mahjong enthusiasts
