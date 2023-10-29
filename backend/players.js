import { getCos, getSin } from "./sinCos.js";

let gameInSession = false;
const setGameInSession = (value) => {
    console.log('setGameInSesstion(',value,')')
    gameInSession = value;
};

const players = {};
const positionPlayersAtStart = () => {
    const playerKeys = Object.keys(players);
    const numPlayers = playerKeys.length;
    console.log("positionPlayersAtStart(),", numPlayers);
    const degStep = 360 / numPlayers;
    for (let pnum = 0; pnum < numPlayers; pnum++) {
        const player = players[playerKeys[pnum]];
        const degrees = degStep * pnum - 90;
        const x = 50 + getCos(degrees) * 48;
        const y = 50 + getSin(degrees) * 48;
        console.log('xy',x,y);
        const facing = degrees + 180;
        player.position.x = x;
        player.position.y = y;
        player.position.degrees = facing;
        console.log('player',player);
    }
};
const addPlayer = (playerID) => {
    console.log("addPlayer(" + playerID + ")");
    const playerExists = players[playerID] !== undefined;
    if (playerExists) {
        // send back existing player of this id
        // return { error: `Player ${playerID} already in game.` };
        positionPlayersAtStart();
        return { player: players[playerID] };
    }

    const newPlayer = {
        name: "Player Name",
        color: "yellow",
        position: {
            x: 50,
            y: 50,
            degrees: 0,
        },
        hp: 10,
        score: 0,
        isReady: false,
        isJoined: true,
        isAlive: false
    };

    players[playerID] = newPlayer;
    positionPlayersAtStart();
    return { player: newPlayer };
};

const playerReady = (playerID, not) => {
    // console.log('playerReady(',playerID,not!==false,')')
    players[playerID].isReady = not !== false;
    // console.log(players[playerID].isReady)
};
const clearReadyPlayers = () => {
    for (const id in players) {
        playerReady(id, false);
    }
};
const checkAllPlayersReady = () => {
    console.log("checkAllPlayersReady()");
    let ready = true;
    for (const key in players) {
        console.log(key);
        console.log(players[key]);
        if (!players[key].isReady) {
            // return false;
            ready = false;
        }
    }
    return ready;
    // return true;
};

const playerJoined = (playerID, not) => {
    players[playerID].isJoined = not !== false;
};
const playerAlive = (playerID, not) => {
    players[playerID].isAlive = not !== false;
};

const killPlayer = (playerID) => {
    players[playerID].isAlive = false;
}

const damagePlayer = (playerId, damage) => {
    const player = players[playerId];
    if (player) {
        player.hp -= damage;
        if (player.hp <= 0) {
            killPlayer(playerId);
            // removePlayer(playerId);
        }
    }
};

const removePlayer = (playerID) => {
    console.log(`removePlayer(${playerID})`);
    // console.log('socket',socket);
    if (players[playerID]) {
        delete players[playerID];
    }
    // socket.disconnect();
    if (!gameInSession) {
        positionPlayersAtStart();
    }
};

// const clearPlayers = () => {
//     for(const key in players){
//         delete players[key];
//     }
// }

export {
    players,
    removePlayer,
    addPlayer,
    damagePlayer,
    positionPlayersAtStart,
    // clearPlayers,
    setGameInSession,
    playerReady,
    playerJoined,
    playerAlive,
    clearReadyPlayers,
    checkAllPlayersReady
};
