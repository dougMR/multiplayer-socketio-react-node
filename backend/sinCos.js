const degreesToRadian = (deg) => deg * (Math.PI / 180);
const radiansToDegrees = (rad) => rad * (180 / Math.PI);
const sinTable = [];
const cosTable = [];
for (let deg = 0; deg < 360; deg++) {
    const rad = degreesToRadian(deg);
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    sinTable[deg] = sin;
    cosTable[deg] = cos;
}

const getSin = (degrees) => {
    return sinTable[Math.round((degrees + 360) % 360)];
};
const getCos = (degrees) => {
    return cosTable[Math.round((degrees + 360) % 360)];
};

export { getSin, getCos };
