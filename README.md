# Vilkolakis - Multiplayer Werewolf Card Game

## Introduction

Vilkolakis is a multiplayer online card game that puts a digital twist on the classic party game "Werewolves." This project was developed as part of a web development course during my bachelor's degree, offering an exciting multiplayer gaming experience for friends and fellow players.

### Features

- **Real-Time Multiplayer:** Play with friends and other players in real time.
- **Role-Based Gameplay:** Assume one of the classic "Werewolves" roles, such as a villager, hunter, witch, seer, or werewolf.
- **Automated Game Master:** No need for a game moderator; the game master role is automated.
- **Immersive UI:** Enjoy a feature-rich user interface with a self-made design.
- **Node.js and WebSockets:** Built with Node.js and utilizes the Socket.IO library for real-time communication.

### Implemented Roles
-   **Villager:** Work with other villagers to identify and eliminate the werewolves.
-   **Hunter:** Use your special ability to target a player before being eliminated.
-   **Witch:** Use your potions wisely to save or eliminate players during the night.
-   **Seer:** Discover the true nature of other players, helping the villagers.
-   **Werewolf:** Work in secrecy with fellow werewolves to eliminate villagers without getting caught.


![Alt text](/public/css/images/readme1.png)

![Alt text](/public/css/images/readme2.png)




## Getting Started

### Quick Start with Docker (Recommended)

The easiest way to run Vilkolakis is using Docker. This method automatically sets up both the database and the game server.

**Prerequisites:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running

**Steps:**

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/vilkolakis.git
   cd vilkolakis
   ```

2. **Start Everything with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Open Your Browser:**
   ```
   http://localhost:2000
   ```

That's it! The game is ready to play.

**Docker Commands:**

```bash
# Start the game
docker-compose up -d

# Stop the game
docker-compose down

# View logs
docker-compose logs -f

# Restart the game
docker-compose restart

# Stop and remove all data (fresh start)
docker-compose down -v
```

---

### Manual Installation (Alternative)

If you prefer to run the game without Docker, follow these steps:

#### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v12.0.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify installation: `node --version`

- **MongoDB** (Community Edition)
  - **macOS**: `brew tap mongodb/brew && brew install mongodb-community`
  - **Windows**: Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
  - **Linux**: Follow instructions at [mongodb.com/docs/manual/installation/](https://docs.mongodb.com/manual/installation/)

#### Installation Steps

Follow these steps to get Vilkolakis up and running manually:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/vilkolakis.git
   cd vilkolakis
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Start MongoDB:**

   Open a new terminal window and start the MongoDB server:

   **macOS/Linux:**
   ```bash
   mongod --dbpath ~/data/db
   ```

   **Or using Homebrew (macOS):**
   ```bash
   brew services start mongodb-community
   ```

   **Windows:**
   ```bash
   "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath="C:\data\db"
   ```

   Note: You may need to create the data directory first:
   ```bash
   mkdir -p ~/data/db
   ```

4. **Start the Game Server:**
   ```bash
   npm start
   ```

   You should see:
   ```
   Server started.
   ```

5. **Play the Game:**

   Open your web browser and navigate to:
   ```
   http://localhost:2000
   ```

### Game Requirements

- Minimum 4 players recommended
- Maximum 8 players per game
- All players must be connected before starting the game

### How to Play

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Lobby**: Wait for other players to join (4-8 players)
3. **Start Game**: Once enough players have joined, one player can start the game
4. **Roles Assigned**: Players are randomly assigned roles (Villagers, Werewolves, Witch, Hunter)
5. **Night Phase**: Werewolves choose their victim, Witch can use potions
6. **Day Phase**: All players vote to eliminate a suspected werewolf
7. **Win Condition**:
   - Villagers win if all werewolves are eliminated
   - Werewolves win if they equal or outnumber the villagers

### Troubleshooting

**MongoDB Connection Issues:**
- Ensure MongoDB is running before starting the game server
- Check that MongoDB is running on the default port `27017`
- Verify the database connection in `app.js:2`

**Port Already in Use:**
- The game runs on port `2000` by default
- If this port is in use, modify line 18 in `app.js`

**Players Can't Connect:**
- Ensure all players are on the same network
- Check firewall settings allow connections on port 2000

### Development

To run in development mode:
```bash
npm run dev
```

### Project Structure

```
VilkulakisGame/
├── app.js                 # Main server file
├── client/                # HTML pages
│   ├── index.html        # Landing page
│   ├── login.html        # Login/signup page
│   ├── game.html         # Main game interface
│   └── end*.html         # Game ending pages
├── public/               # Static assets
│   ├── css/             # Stylesheets and images
│   ├── js/              # Client-side JavaScript
│   └── media/           # Audio and video files
└── package.json         # Project dependencies
```

### Technologies Used

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.IO
- **Database**: MongoDB with mongojs
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
