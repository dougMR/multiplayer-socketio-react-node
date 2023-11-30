const Bullet = ({ bullet }) => {
    return (
        <>
            <div className="bullet" style={{ left: bullet.x+"%", top: bullet.y+"%" }}>
                <div
                    className="bullet-inner"
                    style={{ rotate: bullet.degrees+"deg" }}
                ></div>
            </div>
        </>
    );
};

export default Bullet;
