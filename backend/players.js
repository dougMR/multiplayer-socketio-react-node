import { getCos, getSin } from "./sinCos.js";



const players = {
    // sdafasdlkjlkj80: {
    //     x: 100,
    //     y: 100,
    //     color: yellow,
    //     degrees: 0,
    //     hp: 10
    // }
};
const postionPlayersAtStart = () => {
    const playerKeys = Object.keys(players);
    const numPlayers = playerKeys.length;
    const degStep = 360 / numPlayers;
    for (let pnum = 0; pnum < numPlayers; pnum++) {
        const player = players[playerKeys[pnum]];
        const degrees = degStep * pnum - 90;
        const x = 50 + getCos(degrees) * 48;
        const y = 50 + getSin(degrees) * 48;
        const facing = degrees + 180;
        player.position.x = x;
        player.position.y = y;
        player.position.degrees = facing;
    }
};
const addPlayer = (playerID) => {
    console.log("addPlayer(" + playerID + ")");
    const playerExists = players[playerID] !== undefined;
    if (playerExists) {
        // send back existing player of this id
        // return { error: `Player ${playerID} already in game.` };
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
    };

    players[playerID] = newPlayer;
    console.log("players.length:", Object.keys(players).length);
    postionPlayersAtStart();
    return { player: newPlayer };
};


const damagePlayer = (playerId, damage) => {
    const player = players[playerId];
    if (player) {
        player.hp -= damage;
        if (player.hp <= 0) {
            // killPlayer(playerId);
            removePlayer(playerId);
        }
    }
};


const removePlayer = (playerID) => {
    console.log(`removePlayer(${playerID})`);
    delete players[playerID];
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
    postionPlayersAtStart,
    // clearPlayers,
};
