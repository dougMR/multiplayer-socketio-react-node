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
    setGameInSession,
    playerReady,
    playerJoined,
    checkAllPlayersReady
} from "./players.js";
import { setGameIO,addBullet,startGame,obstacles } from "./game.js";

//
//     ^ IMPORTS AND SETUP ^
//
//////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
//
//     v INIT VARIABLES v
//

setGameIO(io);

////////////////////////
// v SOCKET FUNCTIONS v
////////////////////////
const getSocketById = (id) => {
    return io.sockets.sockets.get(id);
};
const disconnectUser = (id) => {
    getSocketById(id).disconnect();
};

// Log Out Socket IDs
const getSockets = async () => {
    const sockets = await io.fetchSockets();
    // console.log("\nsockets... ");
    for (const sock of sockets) {
        // console.log(sock.id);
    }
    // console.log("\n");
};

// take stock of current players
const listPlayers = () => {
    console.log("");
    console.log("players list: ");
    for (const id in players) {
        console.log(id);
    }
    console.log("");
};

const joinGame = (socket) => {
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
    playerJoined(socket.id);
    // broadcast to all players
    io.emit("updatePlayers", players);
    io.emit("setObstacles",obstacles);
    listPlayers();
};

//////////////////////////////////////////////////////////////////////
// v SOCKET LISTENERS v
////////////////////////

io.on("connection", (socket) => {
    console.log(`\n\rUser Connected: ${socket.id}`);

    // const handshake = socket.handshake;
    // console.log('');
    // console.log('--------------------------------------');
    // console.log("handshake ", handshake);
    // console.log('--------------------------------------');
    // console.log('');
    // console.log(
    //     "New connection from origin " +
    //         handshake.headers.origin +
    //         ". Referer" +
    //         handshake.headers.referer
    // );
    // console.log("socket.handshake.address:", socket.handshake.address);

    socket.emit("message", `connection noted for player ID ${socket.id}`);

    // const originalId = socket.id;
    // console.log("originalId:", originalId);

    socket.on("connect_error", (err) => {
        console.log(`\nconnect_error due to ${err.message}\n`);
    });

    socket.on("join_game", () => {
        // Manual join
        joinGame(socket);
    });

    // Auto join when connect
    joinGame(socket);

    socket.on("player_ready", (isReady, callback) => {
        if (!players[socket.id]) {
            addPlayer(socket.id);
        }
        playerReady(socket.id);
        callback(players[socket.id].isReady);

        // if all players ready, start game
        if (checkAllPlayersReady()) {
            startGame();
        }

        io.emit("updatePlayers", players);
    });

    socket.on("update_player", (clientPlayer) => {
        players[socket.id] = { ...clientPlayer };
        // to all players except socket sender
        socket.broadcast.emit("updatePlayer", socket.id, clientPlayer);
    });

    socket.on("fire_bullet", () => {
        // Add Bullet
        addBullet(socket.id);
        socket.broadcast.emit("playShoot");
    });

    socket.on("disconnect", (reason) => {
        // this gets called automatically when client disconnects
        console.log("\n\rDISCONNECT");
        console.log("reason: ", reason);
        socket.emit("message", `disconnected from player ID ${socket.id}`);
        removePlayer(socket.id);
        io.emit("updatePlayers", players);
        listPlayers();
    });

    socket.on("disconnect_client", (clientUser) => {
        // this is a manual disconnect request
        console.log("disconnect_client", socket.id);
        removePlayer(socket.id);
        disconnectUser(socket.id);
        io.emit("updatePlayers", players);
        listPlayers();

    });
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
