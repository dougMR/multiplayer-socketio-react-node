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
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

import { addUser, removeUser, getUser, getUsersInRoom } from "./users.js";
import { getCos, getSin } from "./sinCos.js";

let broadcastInterval;
let broadcastIntervalRunning = false;

const startBroadcastInterval = () => {
    if (!broadcastIntervalRunning) {
        broadcastIntervalRunning = true;
        broadcastInterval = setInterval(broadcastLoop, 30);
    }
};
const stopBroadcastLoop = () => {
    broadcastIntervalRunning = false;
    clearInterval(broadcastInterval);
};

// Main Game Loop / Broadcast Interval function
const broadcastLoop = () => {
    if (Object.keys(players).length === 0 || bullets.length === 0) {
        // Exit Game Loop
        stopBroadcastLoop();
    } else {
        if (bullets.length > 0) {
            // move bullets
            for (let bullet of bullets) {
                bullet.x += getCos(bullet.degrees) * bullet.speed;
                bullet.y += getSin(bullet.degrees) * bullet.speed;
                bullet.movesTaken++;
            }
            checkBulletsHitPlayers();
            const keepBullets = bullets.filter((b) => b.movesTaken < 20);
            bullets.length = 0;
            bullets.push(...keepBullets);

            io.emit("updateBullets", bullets);
        }
        io.emit("updatePlayers", players);
    }
};

const checkBulletTouchingPlayer = (bullet, player) => {
    // for now, just simple check of touching at this frame
    const xDiff = bullet.x - player.position.x;
    const yDiff = bullet.y - player.position.y;
    const closeEnoughToTouch = 10;
    const hypotenuse = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    return hypotenuse < closeEnoughToTouch;
};

const checkBulletsHitPlayers = () => {
    // console.log('checkBulletsHitPlayers()');
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
                // add to bullet owner's score
                players[bullet.ownerId].score++;
                // remove bullet
                bullets.splice(bullets.indexOf(bullet), 1);
                // remove player
                delete players[playerId];
            }
        }
    }
};

const players = {
    // sdafasdlkjlkj80: {
    //     x: 100,
    //     y: 100,
    //     color: yellow,
    //     degrees: 0,
    //     hp: 10
    // }
};
const addPlayer = (playerID) => {
    console.log("addPlayer(" + playerID + ")");
    const playerExists = players[playerID] !== undefined;
    if (playerExists) {
        return { error: `Player ${playerID} already connected.` };
    }
    const playerX = Object.keys(players).length * 30;
    const newPlayer = {
        name: "Player Name",
        color: "yellow",
        position: {
            x: playerX,
            y: 100,
            degrees: 0,
        },
        hp: 10,
        score: 0,
    };

    players[playerID] = newPlayer;
    return { player: newPlayer };
};
const removePlayer = (playerID) => {
    console.log(`removePlayer(${playerID})`);
    delete players[playerID];
};
const updatePlayer = (player) => {
    players[play];
};

const bullets = [];

const addBullet = (playerId) => {
    const position = players[playerId].position;
    const bullet = {
        x: position.x + getCos(position.degrees) * 10,
        y: position.y + getSin(position.degrees) * 10,
        degrees: position.degrees,
        speed: 12,
        movesTaken: 0,
        ownerId: playerId,
    };
    bullets.push(bullet);
    // Start Game Main Loop
    startBroadcastInterval();
};

// const rooms = [];

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    startBroadcastInterval();
    // addPlayer(socket.id);
    const { error } = addPlayer(socket.id);
    console.log("players.length:", Object.keys(players).length);
    if (error) return callback(error);

    // broadcast to all players
    console.log("updatePlayers");
    io.emit("updatePlayers", players);

    socket.on("update_player", (clientPlayer) => {
        players[socket.id] = { ...clientPlayer };
        socket.broadcast.emit("updatePlayers", players);
    });

    socket.on("fire_bullet", () => {
        console.log("\nFire Bullet");
        // Add Bullet
        addBullet(socket.id);
    });

    socket.on("disconnect", (reason) => {
        console.log("DISCONNECT");
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

server.listen(3011, () => {
    console.log("Server is running on port 3011");
});
