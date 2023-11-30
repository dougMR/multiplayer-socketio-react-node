const canvasWidth = 10000;

const getCoordByPct = (pct) => {
    return pct * canvasWidth * 0.01;
};
const getPctByCoord = (coord) => {
    return (coord / canvasWidth) * 100;
};

const getCircleLineIntersect = (cx, cy, r, lx1, ly1, lx2, ly2) => {
    cx = getCoordByPct(cx);
    cy = getCoordByPct(cy);
    r = getCoordByPct(r);
    lx1 = getCoordByPct(lx1);
    ly1 = getCoordByPct(ly1);
    lx2 = getCoordByPct(lx2);
    ly2 = getCoordByPct(ly2);
    // console.log('getCircleLineIntersect()')
    let xDiff = lx2 - lx1;
    let yDiff = ly2 - ly1;
    const intersections = [];

    let m = Infinity;
    if (xDiff * xDiff > 1) {
        m = yDiff / xDiff;
    } //else{
    //     // lx1 = Math.round(lx1);
    //     // ly1 = Math.round(ly1);
    //     // lx2 = Math.round(lx2);
    //     // ly2 = Math.round(ly2);
    //     m = Infinity;
    // }
    // xDiff = lx2 - lx1;
    // yDiff = ly2 - ly1;
    // console.log('m',m);

    if (m === Infinity || m === -Infinity) {
        const cLeft = cx - r;
        const cRight = cx + r;
        const lx = (lx1 + lx2) / 2;
        if (lx >= cLeft && lx <= cRight) {
            // intersection, get y
            // h,k is circle's x,y
            // (x-h)^2 + (y-k)^2 = r^2
            // (lx1 - cx)^2 +(y-cy)^2 = r^2
            // (y-cy)^2 = r^2 - (lx1-cx)^2
            // y-cy =  +/- sqrt( r^2 - (lx1-cx)^2 )
            // y =  +/- sqrt( r^2 - (lx1-cx)^2 ) + cy
            intersections.push(
                {
                    x: lx,
                    y: cy + Math.sqrt(Math.pow(r, 2) - Math.pow(lx - cx, 2)),
                },
                {
                    x: lx,
                    y: cy - Math.sqrt(Math.pow(r, 2) - Math.pow(lx - cx, 2)),
                }
            );
            // console.log("intersections:", intersections);
        }
    } else {
        // y = mx+b
        const yInt = ly1 - m * lx1;

        // get a, b, c values
        const a = 1 + m * m;
        const b = 2 * (m * (yInt - cy) - cx);
        const c = cx * cx + (yInt - cy) * (yInt - cy) - r * r;

        const d = b * b - 4 * a * c;
        if (d == 0) {
            // console.log("l/c D=0");
            // console.log("a,b,c");
            // console.log(a, b, c);
            // console.log("lx1,ly1", lx1, ly1);
            // console.log("lx2,ly2", lx2, ly2);
        } else {
            // console.log("  D:", d);
        }
        // console.log("m", m);
        if (d >= 0) {
            // insert into quadratic formula
            const xIntersects = [
                (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
                (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a),
            ];
            for (const x of xIntersects) {
                intersections.push({ x, y: m * x + yInt });
            }
            // if (d == 0) {
            //     // only 1 intersection
            //     intersections.length = 1;
            // }
        }
    }
    // const points = [];

    // console.log("intersections...");
    // for (const i of intersections) {
    //     const x = i;
    //     const y = m * x + yInt;
    //     console.log("i:", x, y);
    //     points.push({ x, y });
    // }

    let pIndex = 0;
    if (intersections.length > 1) {
        // get the point closest to line segment's start point
        let closest = Infinity;
        for (const p of intersections) {
            const distSq = Math.pow(p.x - lx1, 2) + Math.pow(p.y - ly1, 2);
            if (distSq < closest) {
                // console.log("Closest:",p);
                closest = distSq;
                pIndex = intersections.indexOf(p);
            }
        }
    }
    // console.log("Point:",intersections[pIndex])
    const point = intersections[pIndex];
    if (point) {
        const x = point.x;
        const y = point.y;
        // Make sure point is on the line segment
        if (
            ((x >= lx1 && x <= lx2) || (x <= lx1 && x >= lx2)) &&
            ((y >= ly1 && y <= ly2) || (y >= ly2 && y <= ly1))
        ) {
            point.x = getPctByCoord(point.x);
            point.y = getPctByCoord(point.y);
            return point;
        }
    }

    // return intersections[pIndex];
    // no intersection
    return null;
};

export { getCircleLineIntersect };
