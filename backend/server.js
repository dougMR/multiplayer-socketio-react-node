/*

https://www.geeksforgeeks.org/how-to-manage-users-in-socket-io-in-node-js/
https://www.youtube.com/watch?v=djMy4QsPWiI

*/

import express from "express";
import cors from "cors";
const app = express();
app.use(cors());

// socket.io setup
import http from "http";
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server, {
    // frontend should ping every 2 secs
    pingInterval: 2000,
    // if we don't hear from client in 5 secs, time out
    pingTimeout: 5000,
    cors: {
        // origin: "http://localhost:3000",
        // origin: "https://socket-shooter.netlify.app"
        methods: ["GET", "POST"],
    },
});

// import { addUser, removeUser, getUser, getUsersInRoom } from "./users.js";
import { getCos, getSin } from "./sinCos.js";
import {
    players,
    removePlayer,
    addPlayer,
    damagePlayer,
    postionPlayersAtStart,
    // clearPlayers,
} from "./players.js";

//
//     ^ IMPORTS AND SETUP ^
//
//////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
//
//     v INIT VARIABLES v
//

let gameOver = false;

let broadcastInterval;
let broadcastIntervalRunning = false;

const bullets = [];
const readyPlayers = [];

const obstacles = [
    { t: 29, r: 55, b: 32, l: 25 },
    { t: 68, r: 75, b: 71, l: 45 },
];

const playerWidth = 1;

/////////////////////////
//    v GAME v
////////////////////////

const checkGameOver = () => {
    if (Object.keys(players).length === 1) {
        console.log("GAME OVER");
        // Game Over
        gameOver = true;
        stopBulletsInterval();
        bullets.length = 0;
        readyPlayers.length = 0;
        // clearPlayers();
        io.emit("endGame", Object.keys(players)[0]);
        // console.log('players: ');
        // for(const key in players){
        //     console.log(key);
        // }
    }
};

const startGame = () => {
    console.log("START GAME");
    // Unmark players ready
    readyPlayers.length = 0;
    // Put connected players in game
    console.log("players: ");
    for (const key in players) {
        console.log(key);
    }
    // Start Music
    io.emit("startGame");
    // Start Game
    gameOver = false;
    io.emit("updatePlayers", players);
};

const checkAllPlayersReady = () => {
    console.log("checkAllPlayersReady()");
    console.log("players: ");
    for (const key in players) {
        console.log(key);
    }
    if (readyPlayers.length <= 1) return false;
    for (const key in players) {
        if (readyPlayers.indexOf(key) === -1) {
            return false;
        }
    }
    return true;
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

// const rooms = [];

// Log Out Socket IDs
const getSockets = async () => {
    const sockets = await io.fetchSockets();
    // console.log("\nsockets... ");
    for (const sock of sockets) {
        // console.log(sock.id);
    }
    // console.log("\n");
};

//////////////////////////////////////////////////////////////////////
// v SOCKET LISTENERS v
////////////////////////

io.on("connection", (socket) => {
    console.log(`\n\rUser Connected: ${socket.id}`);

    // io.emit("setObstacles", obstacles);
    socket.emit("setObstacles", obstacles);

    
    const originalId = socket.id;
// console.log("originalId:", originalId);

    socket.on("connect_error", (err) => {
        console.log(`\nconnect_error due to ${err.message}\n`);
      });


    
    // const { error } = addPlayer(socket.id);
    // if (error) return callback(error);
    // if (error) console.log("error:", error);
    // console.log('callback: ',callback);

    // Test Connection to Client
    // socket.emit("checkConnection", {message:"Hello from the server!",id:socket.id}, (ack) => {
    //     console.log("\nMessage received by client!\n"+ack.message,"ID",ack.id);
    //     console.log("IDs Match: ",ack.id === originalId)
    //     console.log(ack.id,'vs',socket.id,'vs',originalId)
    //     if(ack.id === originalId){
    //         const { error } = addPlayer(socket.id);
    //         if (error) {
    //             console.log("error joining: ", error);
    //             socket.emit("setJoined", false);
    //         } else {
    //             socket.emit("setJoined", true, (answer) => {
    //                 console.log("\nANSWER:", answer, "\n");
    //             });
    //         }
    //     }
    // });

    // setTimeout(() => {
    //     io.to(originalId).emit("checkConnection", (answer) => {
    //         console.log("checked connection with ", originalId, ":\n", answer,"\n");
    //     });
    // }, 1000);

    // broadcast to all players
    // if (!gameOver) {
    // io.emit("updatePlayers", players);
    // }

    // getSockets();

    // io.to(socketId).emit(/* ... */);

    socket.on("join_game", () => {
        console.log("\n\rjoin_game", socket.id);
        // console.log("original id: ", originalId);
        const { error } = addPlayer(socket.id);
        if (error) {
            console.log("error joining: ", error);
            socket.emit("setJoined", false);
        } else {
            socket.emit("setJoined", true, (answer) => {
                console.log("\nANSWER:", answer, "\n");
            });
        }
        // broadcast to all players
        // io.emit("updatePlayers", players);
    });

    socket.on("player_ready", (callback) => {
        console.log("\n\rplayer_ready", socket.id);
        // console.log("original id: ", originalId);
        if (!players[socket.id]) {
            addPlayer(socket.id);
        }
        readyPlayers.push(socket.id);
        // if all players ready, start game
        console.log("readyPlayers:[", readyPlayers, "]");
        console.log("allPlayersReady", checkAllPlayersReady());
        if (checkAllPlayersReady()) {
            startGame();
        }
        callback(true);
        socket.emit("updatePlayers", players);
    });

    socket.on("update_player", (clientPlayer) => {
        players[socket.id] = { ...clientPlayer };
        // to all players except socket sender
        // socket.broadcast.emit("updatePlayers", players);
        socket.broadcast.emit("updatePlayer",socket.id, clientPlayer);
    });

    socket.on("fire_bullet", () => {
        // console.log("\nFire Bullet");
        // Add Bullet
        addBullet(socket.id);
        socket.broadcast.emit("playShoot");
    });

    // socket.on("disconnect", async () => {

    //   });

    socket.on("disconnect", (reason) => {
        console.log("\n\rDISCONNECT");
        console.log("reason: ", reason);
        removePlayer(socket.id);
        io.emit("updatePlayers", players);
        console.log("players.length:", Object.keys(players).length);
        // console.log("Users: ", getUsersInRoom(user?.room));
        // const user = removeUser(clientUser.name);
        // if (user) {
        //     io.to(user.room).emit("message", {
        //         user: "admin",
        //         text: `${user.name} had left`,
        //     });
        // }
    });

    // socket.on("join_room", ({ name, room }, callback) => {
    //     console.log("join_room()", socket.id);

    //     const { error, user } = addUser({ id: socket.id, name, room });

    //     if (error) return callback(error);

    //     socket.join(user.room);

    //     // Broadcast to everyone in the room,
    //     // including the client who called this action
    //     console.log("send update_users", "[" + user.room + "]");
    //     io.in(user.room).emit("update_users", getUsersInRoom(user.room));

    //     callback();
    // });

    // socket.on("send_message", (message, callback) => {
    //     const user = getUser(socket.id);
    //     console.log("send_message", socket.id);
    //     // console.log('users:',users);
    //     console.log("user", user);
    //     io.to(user.room).emit("message", { user: user.name, text: message });

    //     io.to(user.room).emit("roomData", {
    //         room: user.room,
    //         users: getUsersInRoom(user.room),
    //     });
    //     callback();
    // });
    // socket.on("disconnect_client", (clientUser) => {
    //     console.log("disconnect_client, id:",clientUser.id);
    //     const user = removeUser(clientUser.name);
    //     console.log("Users: ", getUsersInRoom(user?.room));
    // });

    // socket.on("move_user", (clientUser) => {
    //     console.log("move_user", clientUser);
    //     console.log("USERS: ", getUsersInRoom(clientUser.room));
    //     const user = getUser(clientUser.name);
    //     console.log("user:", user);
    //     if (user) {
    //         // update user's position
    //         user.position = { ...clientUser.position };
    //         console.log("users updated", getUsersInRoom(user.room));
    //         // user.position = position;
    //         // io.to(user.room).emit("move_other", user );
    //         // socket.broadcast.to(user.room).emit("move_other", user);
    //         io.in(user.room).emit("update_users", getUsersInRoom(user.room));
    //     }
    // });
});

app.get("/", (req, res) => {
    res.send({ hello: "world" });
});

// server.listen(3011, () => {
//     console.log("Server is running on port 3011");
// });
server.listen(3000, () => {
    console.log("server running!  It Lives!");
});
