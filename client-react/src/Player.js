const Player = ({ user, myColor }) => {
    // console.log("Player, x",user.position.x,user.position.y," Deg:",user.position.degrees);
    return (
        <>
            <div className="player-avatar"
                style={{ left: user.position.x+"%", top: user.position.y+"%", rotate:user.position.degrees+"deg" }}
            >
                <div className="treads" style={{borderColor:myColor}}></div>
                <div className="player-avatar-inner" style={{backgroundColor:myColor, border: "1px solid white"}}></div>
                
            </div>
        </>
    );
};

export default Player;
