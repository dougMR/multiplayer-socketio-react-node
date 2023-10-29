import { getCos, getSin } from "./sinCos.js";

import {
    players,
    clearReadyPlayers,
    setGameInSession,
    playerAlive,
    damagePlayer,
    positionPlayersAtStart
} from "./players.js";
let gameOver = false;

let broadcastInterval;
let broadcastIntervalRunning = false;

const bullets = [];
// const readyPlayers = [];

const obstacles = [
    { t: 25, r: 55, b: 31, l: 25 },
    { t: 69, r: 75, b: 75, l: 45 },
    { t: 25, r: 75, b: 55, l: 69 },
    { t: 45, r: 31, b: 75, l: 25 },
];

const playerWidth = 1;

let io;

const setGameIO = (gameIO) => {
    io = gameIO;
};

/////////////////////////
//    v GAME v
////////////////////////

const checkGameOver = () => {
    // only 1 alive?
    console.log("players values", Object.values(players));
    const alivePlayers = Object.keys(players).filter((k) => players[k].isAlive);
    console.log("alivePlayers", alivePlayers);
    if (alivePlayers.length <= 1) {
        const winnerID = alivePlayers[0];
        // Game Over
        console.log("GAME OVER");
        gameOver = true;
        stopBulletsInterval();
        bullets.length = 0;
        clearReadyPlayers();
        setGameInSession(false);
        io.emit("endGame", winnerID);
    }
};

const startGame = () => {
    console.log("START GAME");
    // Unmark players ready
    clearReadyPlayers();
    // Put connected players in game
    for (const key in players) {
        playerAlive(key);
    }
    // Start Music
    io.emit("startGame");
    // Start Game
    gameOver = false;
    
    setGameInSession(true);
    positionPlayersAtStart();
    io.emit("updatePlayers", players);
};

//////////////////////////////
//    BULLETS LOOP
//////////////////////////////

const startBulletsInterval = () => {
    if (!broadcastIntervalRunning) {
        broadcastIntervalRunning = true;
        broadcastInterval = setInterval(bulletsLoop, 30);
    }
};
const stopBulletsInterval = () => {
    broadcastIntervalRunning = false;
    clearInterval(broadcastInterval);
};

// Main Game Loop / Broadcast Interval function
// Move bullets and players while there are at least 1 of each
const bulletsLoop = () => {
    if (Object.keys(players).length === 0 || bullets.length === 0) {
        // Exit Game Loop
        stopBulletsInterval();
    } else {
        if (bullets.length > 0) {
            let hits = 0;
            // move bullets
            for (let bullet of bullets) {
                bullet.x += getCos(bullet.degrees) * bullet.speed;
                bullet.y += getSin(bullet.degrees) * bullet.speed;
                bullet.movesTaken++;
            }
            checkBulletsHitObstacles();
            if (checkBulletsHitPlayers()) {
                hits++;
            }
            const keepBullets = bullets.filter((b) => b.movesTaken < 20);
            bullets.length = 0;
            bullets.push(...keepBullets);

            io.emit("updateBullets", bullets);
            if (hits > 0) {
                io.emit("playHit");
                io.emit("updatePlayers", players);
            }
        }
    }
};

/////////////////////////
//    v BULLETS v
////////////////////////

const addBullet = (playerId) => {
    if (!players[playerId]) return;
    const position = players[playerId].position;
    const bullet = {
        x: position.x + getCos(position.degrees) * 1,
        y: position.y + getSin(position.degrees) * 1,
        degrees: position.degrees,
        speed: 3,
        movesTaken: 0,
        ownerId: playerId,
    };
    bullets.push(bullet);

    // Start Game Main Loop !! THIS DOESN'T BELONG HERE
    startBulletsInterval();
};

const checkBulletTouchingPlayer = (bullet, player) => {
    // for now, just simple check of touching at this frame
    const xDiff = bullet.x - player.position.x;
    const yDiff = bullet.y - player.position.y;
    const closeEnoughToTouch = 3; // <-- this is percentage of boardwidth / height
    const hypotenuse = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return hypotenuse < closeEnoughToTouch;
};

const checkBulletsHitPlayers = () => {
    // console.log('checkBulletsHitPlayers()');
    let hit = false;
    // for each bullet
    for (const bullet of bullets) {
        // check each player
        for (const playerId in players) {
            const player = players[playerId];
            // if contact, and
            // if not bullet owner
            if (
                playerId !== bullet.ownerId &&
                checkBulletTouchingPlayer(bullet, player)
            ) {
                console.log("\n!!!!!!!!!BULLET HIT!!!!!!!!!!\n");
                hit = true;

                // add to bullet owner's score
                if (players[bullet.ownerId]) {
                    players[bullet.ownerId].score++;
                }

                // remove bullet
                bullets.splice(bullets.indexOf(bullet), 1);

                // remove player
                damagePlayer(playerId, 10);

                // check game over
                checkGameOver();
                break;
            }
        }
        if (gameOver) {
            break;
        }
    }
    return hit;
};

const checkBulletTouchingObstacle = (bullet, obstacle) => {
    return (
        bullet.x >= obstacle.l &&
        bullet.x <= obstacle.r &&
        bullet.y >= obstacle.t &&
        bullet.y <= obstacle.b
    );
};

const checkBulletsHitObstacles = () => {
    // console.log('checkBulletsHitObstacles()');
    let hit = false;
    // for each bullet
    for (const bullet of bullets) {
        // check each player
        for (const obstacle of obstacles) {
            // if contact, and
            if (checkBulletTouchingObstacle(bullet, obstacle)) {
                console.log("\n!!!!!!!!!BULLET HIT!!!!!!!!!!\n");
                hit = true;

                // remove bullet
                bullets.splice(bullets.indexOf(bullet), 1);

                break;
            }
        }
        if (hit) {
            break;
        }
    }
    return hit;
};

export { setGameIO, clearReadyPlayers, startGame, addBullet, obstacles };
