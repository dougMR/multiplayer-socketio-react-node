

const Obstacle = ({limits}) => {
    return <div className="obstacle" style={{left:limits.l+'%',top:limits.t+'%',width:(limits.r-limits.l)+'%',height:(limits.b-limits.t)+'%' }}>

    </div>
}
export default Obstacle;