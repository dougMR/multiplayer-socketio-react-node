const canvasWidth = 10000;

const getCoordByPct = (pct) => {
    return pct * canvasWidth * 0.01;
};
const getPctByCoord = (coord) => {
    return (coord / canvasWidth) * 100;
};

const getVectorsIntersect = (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) => {
    ax1 = getCoordByPct(ax1);
    ay1 = getCoordByPct(ay1);
    ax2 = getCoordByPct(ax2);
    ay2 = getCoordByPct(ay2);
    bx1 = getCoordByPct(bx1);
    by1 = getCoordByPct(by1);
    bx2 = getCoordByPct(bx2);
    by2 = getCoordByPct(by2);
    var c2x = bx1 - bx2; // (x3 - x4)
    var c3x = ax1 - ax2; // (x1 - x2)
    var c2y = by1 - by2; // (y3 - y4)
    var c3y = ay1 - ay2; // (y1 - y2)

    // down part of intersection point formula
    var d = c3x * c2y - c3y * c2x;

    let point;

    if (d == 0) {
        // console.log("D==0");
        // console.log(
        //     "ax1,ay1,ax2,ay2,bx1,by1,bx2,by2",
        //     ax1,
        //     ay1,
        //     ax2,
        //     ay2,
        //     bx1,
        //     by1,
        //     bx2,
        //     by2
        // );
        // throw new Error("Number of intersection points is zero or infinity.");
        // console.log("v/v D = ZERO");
        if (c2x * c2x < 1) {
            // line b is vertical

            // intersection, get y
            // y = m * x + b
            // y = m * x + bxy
            const m = (ay2 - ay1) / (ax2 - ax1);
            const x = (bx1 + bx2) / 2;
            const b = ay1;
            const y = m * x + b;
             point = { x, y };
        } else if (c3x * c3x < 1) {
            // line a is vertical
            const m = (by2 - by1) / (bx2 - bx1);
            const x = (ax1 + ax2) / 2;
            const b = by1;
            const y = m * x + b;
             point = { x, y };
        }
    } else {
        // upper part of intersection point formula
        var u1 = ax1 * ay2 - ay1 * ax2; // (x1 * y2 - y1 * x2)
        var u4 = bx1 * by2 - by1 * bx2; // (x3 * y4 - y3 * x4)

        // intersection point formula

        var x = (u1 * c2x - c3x * u4) / d;
        var y = (u1 * c2y - c3y * u4) / d;
        point = { x, y };

        // check the point is in both segments
        if (
            Math.abs(ax1 - ax2) < .1 ||
            Math.abs(ay2 - ay1) < .1 ||
            Math.abs(bx2 - bx1) < .1 ||
            Math.abs(by2 - by1) < .1
        ) {
            // bounding box is flat
            x = Math.round(x);
            y = Math.round(y);
            ax1 = Math.round(ax1);
            ax2 = Math.round(ax2);
            ay1 = Math.round(ay1);
            ay2 = Math.round(ay2);
            bx1 = Math.round(bx1);
            by1 = Math.round(by1);
            bx2 = Math.round(bx2);
            by2 = Math.round(by2);
        }
    }
    // console.log("x,y", x, y);
    if (
        ((x >= ax1 && x <= ax2) || (x <= ax1 && x >= ax2)) &&
        ((y >= ay1 && y <= ay2) || (y >= ay2 && y <= ay1)) &&
        ((x >= bx1 && x <= bx2) || (x >= bx2 && x <= bx1)) &&
        ((y >= by1 && y <= by2) || (y >= by2 && y <= by1))
    ) {
        point.x = getPctByCoord(point.x);
        point.y = getPctByCoord(point.y);
        return point;
    } else {
        // console.log("RETURNING NULL");
        // console.log("a1", ax1, ay1);
        // console.log("a2", ax2, ay2);
        // console.log("b1", bx1, by1);
        // console.log("b2", bx2, by2);
        return null;
    }
};

export { getVectorsIntersect };