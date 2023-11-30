
/*

https://www.geeksforgeeks.org/how-to-manage-users-in-socket-io-in-node-js/
https://www.youtube.com/watch?v=djMy4QsPWiI

*/
import "./App.css";
import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import serverURL from "./ServerURL";
import Player from "./Player";
import Bullet from "./Bullet";
import Obstacle from "./Obstacle";

import shotFired from "./audio/shoot.mp3";
import hitSrc from "./audio/pop.mp3";
import music from "./audio/muvibeat10_130bpm-14340mono.mp3";

import winImg from "./images/winner-ribbon.png";
import loseImg from "./images/skull-and-bones.png";

import {
    getEndPositionVectorToRect,
    simpleRectHitCheck,
} from "./collision-detection.js";

// What's the difference of putting functions & variables outside or inside component?
const fireShot = new Audio(shotFired);
const hit = new Audio(hitSrc);
const degreesToRadian = (deg) => deg * (Math.PI / 180);
const radiansToDegrees = (rad) => rad * (180 / Math.PI);
const sinTable = [];
const cosTable = [];
for (let deg = 0; deg < 360; deg++) {
    const rad = degreesToRadian(deg);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    // console.log("deg:", deg);
    // console.log("rad:", rad);
    // console.log("cos:", cos);
    // console.log("sin:", sin);
    sinTable[deg] = sin;
    cosTable[deg] = cos;
}
const getCos = (degrees) => {
    return cosTable[(Math.round(degrees) + 360) % 360];
};
const getSin = (degrees) => {
    return sinTable[(Math.round(degrees) + 360) % 360];
};

let socket;

let musicAudio;

let gameOver = true;

/*
const getSegmentsIntersectPoint = (pA1,pA2,pB1,pB2){
    // Get A,B of first line - points : pA1 to pA2
    const A1 = pA2.y-pA1.y;
    const B1 = pA1.x-pA2.x;
    // Get A,B of second line - points : pB1 to pB2
    const A2 = pB2.y-pB1.y;
    const B2 = pB1.x-pB2.x;

    // Get delta and check if the lines are parallel
    const delta = A1*B2 - A2*B1;
    if(delta == 0) return null;

    // Get C of first and second lines
    const C2 = A2*pB1.x+B2*pB1.y;
    const C1 = A1*pA1.x+B1*pA1.y;
    //invert delta to make division cheaper
    const invdelta = 1/delta;
    // now return the intersection point
    return {x: (B2*C1 - B1*C2)*invdelta, y:(A1*C2 - A2*C1)*invdelta };
}
const lineSegmentIntersectRectangle = (p1,p2,r1,r2,r3,r4) => {
    let intersection = null;
    intersection = getSegmentsIntersectPoint(p1,p2,r1,r2);
    if(intersection == null) intersection = getSegmentsIntersectPoint(p1,p2,r2,r3);
    if(intersection == null) intersection = getSegmentsIntersectPoint(p1,p2,r3,r4);
    if(intersection == null) intersection = getSegmentsIntersectPoint(p1,p2,r4,r1);
    return intersection;
}
*/

// Keep track of which user is this client

function App() {
    // !! Figure out where / how to set playerWidth
    const playerWidth = 1;

    // Players State
    const [players, _setPlayers] = useState({});
    // Players Ref
    const playersRef = useRef(null);

    // Bullets State
    const [bullets, setBullets] = useState([]);

    // Obstacles State
    const [obstacles, _setObstacles] = useState([]);
    // // Obstacles Ref
    const obstaclesRef = useRef([]);

    const setObstacles = (value) => {
        console.log("setObstacles()", value);
        _setObstacles(value);
        obstaclesRef.current = value;
    };

    // Alive State
    const [alive, _setAlive] = useState(false);
    const aliveRef = useRef(false);

    // Connected State
    const [connected, setConnected] = useState(false);
    // Joined State
    const [joined, setJoined] = useState(false);
    // Ready State
    const [ready, setReady] = useState(false);

    // Image State
    const [image, setImage] = useState(null);

    // KEYS
    let keyCheckInterval = null;

    const keys = [
        {
            name: ["ArrowLeft", "A", "a"],
            myFunction: () => {
                turn(-5);
            },
            frequency: 50,
        },
        {
            name: ["ArrowRight", "D", "d"],
            myFunction: () => {
                turn(5);
            },
            frequency: 50,
        },
        {
            name: ["ArrowUp", "w", "W"],
            myFunction: () => {
                move(0.7);
            },
            frequency: 30,
        },
        {
            name: ["ArrowDown", "s", "S"],
            myFunction: () => {
                move(-0.3);
            },
            frequency: 30,
        },
        {
            name: " ",
            myFunction: () => {
                // console.log("Fire!");
                shoot();
            },
            frequency: 500,
        },
    ];
    for (const key of keys) {
        key.lastTimePressed = 0;
        key.isDown = false;
    }

    useEffect(() => {
        console.log("alive just set to ", alive);
    }, [alive]);

    useEffect(() => {
        console.log("\n\n\nCOMPONENT'S\nFIRST MOUNT\n\n\n");
        connect();

        // v When Component Unmounts
        return () => {
            console.log("DISCONNECT");
            socket.emit("disconnect_client");
            // socket.emit("disconnect_client", {
            //     name,
            //     room,
            //     id: myId,
            //     position: { x, y, degrees },
            // });
            socket.off();
            setConnected(false);
        };
    }, []);

    // useEffect(() => {
    //     console.log("\nplayers set: ", Object.keys(players).length);
    //     console.log("...ref:", playersRef.current);
    // }, [players]);

    //////////////////////////////////
    //    v GAME MANAGEMENT v
    //////////////////////////////////

    const startGame = () => {
        console.log("startGame()");
        playMusic();
        setAlive(true);
        setImage(null);
        gameOver = false;

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
    };

    const die = () => {
        console.log("die()");
        // I died, but game may still be going on
        setAlive(false);
        stopKeyCheckInterval();
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
        for (const key of keys) {
            key.isDown = false;
        }
        showImage(loseImg);
        // socket.emit("player_die");
        // setTimeout(() => {
        //     alert(`You are out of the game.`);
        // }, 1000);
        // console.log(
        //     "\nI'm GONE from the game\n",
        //     "id:",
        //     socket.id,
        //     "\n",
        //     playersRef.current,
        //     "\n"
        // );
    };

    const endGame = (winnerID) => {
        // Everyone is done, not just me
        if (!gameOver) {
            console.log("\n\nGAME OVER\n\n");
            stopMusic();
            gameOver = true;
            // gameOver = false; // ?

            

            setTimeout(() => {
                alert(`\nGame Over\n${winnerID} \nWins!`);
            }, 100);
        }
    };

    //////////////////////////////////
    //    v MANAGE PLAYERS v
    //////////////////////////////////

    function setAlive(value){
        aliveRef.current = value;
        _setAlive(value);
    }

    function setPlayers(value) {
        // console.log("setPlayers()", value);
        playersRef.current = { ...value }; // Updates the ref
        // console.log("playersRef.current", playersRef.current);
        _setPlayers({ ...value });
    }
    const getMyPlayer = () => {
        const myPlayer = playersRef.current[socket?.id];
        return myPlayer;
    };

    const mapPlayers = () => {
        // Show Players in Template
        return Object.keys(players).map((key) => (
            <Player
                key={key}
                user={players[key]}
                myColor={
                    players[key].isAlive || players[key].isReady
                        ? key === socket?.id
                            ? "blue"
                            : "red"
                        : "rgba(200,200,200,0.3)"
                }
            />
        ));
    };

    //////////////////////////////////
    //    v SOCKET LISTENERS
    //////////////////////////////////

    const connect = () => {
        // socket = io.connect("http://localhost:3011");
        // socket = io.connect("http://localhost:3000");
        socket = io.connect(serverURL);
        socket.on("connect", () => {
            console.log("socket connected --> ID::", socket.id);
            setConnected(true);
        });

        // Receive a message from the server
        // socket.on("checkConnection", (fromServer, ack) => {
        //     console.log(`\n${fromServer.message} -- [${fromServer.id}]\n`); // "Hello from the server!"
        //     ack({ message: "Received", id: socket.id }); // Send an acknowledgment to the server
        // });

        // socket.on("checkConnection", (callback) => {
        //     console.log("checkConnection");
        //     // console.log(callback);
        //     callback("Client reached: " + socket.id);
        // });

        // Receive a message from the server
        // socket.on("message", (message, ack) => {
        socket.on("message", (message) => {
            console.log("message from server: ", message); // "Hello from the server!"
            // ack(); // Send an acknowledgment to the server
        });

        socket.on("setJoined", (value, callback) => {
            console.log("server says joined is ", value);
            setJoined(value);
            callback("hello from front end");
        });

        socket.on("endGame", (winnerId) => {
            console.log("endGame");
            console.log("winnerId vs socket.id", winnerId, socket.id);
            if (winnerId === socket.id) {
                // I WON!
                showImage(winImg);
                setAlive(true);
            } else {
                // I LOST.
                // showImage(crossBones);
                // showImage(loseImg);
                // setAlive(false);
            }
            setReady(false); // <-- this needs to come from server

            endGame(winnerId);
        });

        socket.on("startGame", () => {
            startGame();
        });

        socket.on("playShoot", () => {
            playSound(fireShot);
        });

        socket.on("playHit", () => {
            playSound(hit);
        });

        socket.on("updatePlayer", (id, backendPlayer) => {
            // console.log("updatePlayer", id, backendPlayer);
            const playerz = { ...playersRef.current };

            // console.log("playerz:", playerz);
            playerz[id] = { ...backendPlayer };

            // console.log("playerz", playerz);
            setPlayers({ ...playerz });
        });

        socket.on("updatePlayers", (backendPlayers) => {
            console.log("updatePlayers() ");
            if (backendPlayers.length !== 0) {
                const playerz = { ...playersRef.current };
                for (const id in backendPlayers) {
                    // if (!playerz[id]) {
                    playerz[id] = { ...backendPlayers[id] };
                    // }
                }
                for (const id in playerz) {
                    if (!backendPlayers[id]) {
                        delete playerz[id];
                    }
                }
                console.log('playerz[socket.id].isAlive:',playerz[socket.id].isAlive)
                console.log('alive:',aliveRef.current);
                if (!playerz[socket.id].isAlive && aliveRef.current) die();
               
                // console.log("playerz", playerz);
                setPlayers({ ...playerz });
            }
            // Am I still in the game?
            // if (getMyPlayer() && playersRef.current[socket.id].hp <= 0) {
            //     // I'm Out!
            //     die();
            // }
        });
        socket.on("updateBullets", (backendBullets) => {
            setBullets(backendBullets);
        });
        socket.on("setObstacles", (obstacles) => {
            // obstacles are axis-aligned rects, {t,r,b,l}
            setObstacles(obstacles);
        });
    };

    ///////////////////////////////
    //    v AUDIO v
    ///////////////////////////////

    const playSound = (sound) => {
        // new Audio(sound).play();
        sound.currentTime = 0;
        sound.play();
    };
    const playMusic = () => {
        if (!musicAudio) {
            musicAudio = new Audio(music);
            musicAudio.loop = true;
        }
        musicAudio.currentTime = 0;
        musicAudio.play();
    };
    const stopMusic = () => {
        if (!musicAudio?.paused) musicAudio?.pause();
    };

    //////////////////////////////////
    //    v DRIVE PLAYER (move / shoot) v
    //////////////////////////////////

    const checkHitObstacle = (x1, y1, x2, y2) => {
        console.log("checkHitObstacke()");
        console.log("#obstacles:", obstaclesRef.current.length);
        console.log("x1y1", x1, y1);
        console.log("x2y2", x2, y2);
        for (const o of obstaclesRef.current) {
            console.log("o:", o);
            // if (
            //     x >= obstacle.l - playerWidth &&
            //     x <= obstacle.r + playerWidth &&
            //     y >= obstacle.t - playerWidth &&
            //     y <= obstacle.b + playerWidth
            // ) {
            //     console.log("n------------HIT OBSTACLE---------------!!\n");
            //     return true;
            // }
            // const hitResult = getEndPositionVectorToRect(
            //     x1,
            //     y1,
            //     x2,
            //     y2,
            //     o.l,
            //     o.t,
            //     o.r,
            //     o.t,
            //     o.r,
            //     o.b,
            //     o.l,
            //     o.b
            // );
            const hitResult = simpleRectHitCheck(
                x1,
                y1,
                x2,
                y2,
                o.l,
                o.t,
                o.r,
                o.t,
                o.r,
                o.b,
                o.l,
                o.b
            );
            if (hitResult) {
                console.log("HITTTTTTTTTTTTTTTTTTTTTTTTTTTTTT");

                return hitResult;
            }
        }
        // didn't hit anything
        return { x: x2, y: y2 };
    };

    const move = (distance) => {
        console.log("\nmove()");
        // console.log("dist: ", distance);
        // console.log("degrees: ", degrees);
        const degrees = getMyPlayer()?.position.degrees;
        // console.log("player: ", getMyPlayer());
        // console.log('deg:',degrees)
        // console.log('cos:',getCos(degrees))
        const xDist = distance * getCos(degrees);
        const yDist = distance * getSin(degrees);
        const oldX = getMyPlayer()?.position.x;
        const oldY = getMyPlayer()?.position.y;
        let newX = Math.min(100, Math.max(0, oldX + xDist));
        let newY = Math.min(100, Math.max(0, oldY + yDist));
        // if (checkHitObstacle(newX, newY)) {
        //     newX = oldX;
        //     newY = oldY;
        // }
        let endPoint = checkHitObstacle(oldX, oldY, newX, newY);
        if (endPoint) {
            newX = endPoint.x;
            newY = endPoint.y;
        }
        // console.log("x: ", getMyPlayer()?.position.x, "-->", newX);
        const playerz = { ...playersRef.current };
        // console.log(
        //     "moving, players.length",
        //     Object.keys(playersRef.current).length
        // );

        playerz[socket.id].position.x = newX;
        playerz[socket.id].position.y = newY;

        setPlayers({ ...playerz });
        socket.emit("update_player", getMyPlayer());
    };

    const turn = (degChange) => {
        // console.log(`turn(${degChange})`);
        // setDegrees((deg) => Math.round(deg + degChange));
        const playerz = { ...playersRef.current };
        // console.log("playersRef.current: ", playersRef.current);
        if (playerz[socket.id]) {
            playerz[socket.id].position.degrees =
                (playerz[socket.id].position.degrees + degChange + 360) % 360;
            setPlayers({ ...playerz });
            socket.emit("update_player", getMyPlayer());
        }
    };

    const shoot = () => {
        socket.emit("fire_bullet");
        playSound(fireShot);
        // playMusic();
    };

    //////////////////////////////////
    //    v Keys and Key functions v
    //////////////////////////////////

    const handleKeyDown = (event) => {
        console.log(`\nThe key ${event.key} was pressed.`);
        // is this player legit?
        if (!playersRef.current[socket.id]) return;

        const keyObj = keys.find((key) => {
            return key.name === event.key || key.name.includes(event.key);
        });

        if (keyObj) {
            event.preventDefault();
            keyObj.lastTimePressed = performance.now();
            keyObj.myFunction();
            keyObj.isDown = true;
            startKeyCheckInterval();
        }
    };

    const handleKeyUp = (event) => {
        if (!playersRef.current[socket.id]) return;

        const keyObj = keys.find(
            (key) => key.name === event.key || key.name.includes(event.key)
        );
        if (keyObj) {
            event.preventDefault();
            keyObj.isDown = false;
        }

        const keyDown = keys.find((key) => key.isDown);
        if (!keyDown) {
            // no keys down, stop key listener interval
            stopKeyCheckInterval();
        }
    };

    const checkKeys = () => {
        for (const keyObj of keys) {
            if (
                keyObj.isDown &&
                keyObj?.lastTimePressed < performance.now() - keyObj?.frequency
            ) {
                keyObj.lastTimePressed = performance.now();
                keyObj.myFunction();
            }
        }
    };

    const startKeyCheckInterval = () => {
        // already running?
        if (keyCheckInterval) return;
        keyCheckInterval = setInterval(checkKeys, 17);
    };

    const stopKeyCheckInterval = () => {
        if (keyCheckInterval) {
            clearInterval(keyCheckInterval);
            keyCheckInterval = undefined;
        }
    };

    /////////////////////////////////////////
    //    v TEMPLATE INTERFACE v
    /////////////////////////////////////////

    const showImage = (img) => {
        setImage(img);
    };

    const showGameStatus = () => {
        if (alive && ready && !gameOver) {
            return "status: Playing";
        } else {
            if (joined) {
                if (ready) {
                    return "The game will begin when all players are ready.";
                } else {
                    // Show Ready button
                    return (
                        <>
                            Joined.
                            <br />
                            <button
                                onClick={() => {
                                    console.log("tell server I'm ready...");
                                    socket.emit(
                                        "player_ready",
                                        true,
                                        (response) => {
                                            console.log(
                                                "player_ready response",
                                                response
                                            );
                                            setReady(response);
                                        }
                                    );
                                }}
                            >
                                I’M READY TO START
                            </button>
                        </>
                    );
                }
            } else {
                // Show Join button
                // return "Waiting to Join...";
                return (
                    <button
                        onClick={() => {
                            console.log("try joining...");
                            socket.emit(
                                // "player_ready"
                                "join_game"
                            );
                        }}
                    >
                        JOIN
                    </button>
                );
            }
        }
    };

    return (
        <div className="App">
            <div className="instructions">
                <strong>Move:</strong> WASD / Arrows &nbsp;&nbsp; &nbsp;&nbsp; <strong>Shoot:</strong> SpaceBar
            </div>
            <div id="light" className={connected ? "on" : ""}></div>
            <div id="board">
                {/* <Bullet bullet={{ x: 2, y: 2, degrees: 30 }} /> */}
                {mapPlayers()}
                {bullets.map((bullet, index) => {
                    return <Bullet key={index} bullet={bullet} />;
                })}
                {obstacles.map((obs, index) => {
                    return <Obstacle key={index} limits={obs} />;
                })}
                <img id="board-image" src={image} alt="" />
            </div>
            <div className="game-text" style={{ textAlign: "left" }}>
                <p className="game-status">
                    <span id="player-color-dot"></span>
                    {showGameStatus()}
                </p>
                <div className="player-data">
                    {/* {console.log(socket?.id)} */}
                    <strong>my id:</strong> {socket?.id}
                    <br />
                    <ul className="states">
                        <li>
                            <div
                                className={"light " + (connected ? "on" : "")}
                                style={{ display: "inline-block" }}
                            ></div>{" "}
                            connected
                        </li>
                        <li>
                            <div
                                className={"light " + (joined ? "on" : "")}
                                style={{ display: "inline-block" }}
                            ></div>{" "}
                            joined
                        </li>
                        <li>
                            <div
                                className={"light " + (ready ? "on" : "")}
                                style={{ display: "inline-block" }}
                            ></div>{" "}
                            ready
                        </li>
                        <li>
                            <div
                                className={"light " + (alive ? "on" : "")}
                                style={{ display: "inline-block" }}
                            ></div>{" "}
                            alive
                        </li>
                    </ul>
                </div>

                <h4 style={{ marginBottom: 0 }}>Players In Game</h4>
                <ul
                    style={{
                        marginTop: 0,
                        padding: "0.75em",
                        listStyle: "none",
                    }}
                >
                    {Object.keys(players).map((k) => {
                        return (
                            <li
                                key={k}
                                style={{
                                    fontWeight:
                                        k === socket?.id ? "bold" : "normal",
                                }}
                            >
                                id:{k}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default App;
