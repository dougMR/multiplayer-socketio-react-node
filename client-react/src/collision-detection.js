// vector - vector intersect test
const vectorsIntersect = (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) => {
    // Get A,B of first line - points : ps1 to pe1
    const A1 = ay2 - ay1;
    const B1 = ax1 - ax2;
    // Get A,B of second line - points : ps2 to pe2
    const A2 = by2 - by1;
    const B2 = bx1 - bx2;

    // Get delta and check if the lines are parallel
    const delta = A1 * B2 - A2 * B1;
    if (delta === 0) return null;

    // Get C of first and second lines
    const C2 = A2 * bx1 + B2 * by1;
    const C1 = A1 * ax1 + B1 * ay1;
    //invert delta to make division cheaper
    const invdelta = 1 / delta;
    // now return the Vector2 intersection point
    return {
        x: (B2 * C1 - B1 * C2) * invdelta,
        y: (A1 * C2 - A2 * C1) * invdelta,
    };
};

const vectorIntersectRect = (
    vx1,
    vy1,
    vx2,
    vy2,
    rx1,
    ry1,
    rx2,
    ry2,
    rx3,
    ry3,
    rx4,
    ry4
) => {
    const hitSide1 = vectorsIntersect(vx1, vy1, vx2, vy2, rx1, ry1, rx2, ry2);
    const hitSide2 = vectorsIntersect(vx1, vy1, vx2, vy2, rx2, ry2, rx3, ry3);
    const hitSide3 = vectorsIntersect(vx1, vy1, vx2, vy2, rx3, ry3, rx4, ry4);
    const hitSide4 = vectorsIntersect(vx1, vy1, vx2, vy2, rx4, ry4, rx1, ry1);
    const results = [hitSide1, hitSide2, hitSide3, hitSide4];

    const hits = results.filter((hit) => hit !== null);

    if (hits.length === 1) {
        // one and only one intersection
        return hits[0];
    } else {
        // more than one, or zero intersections
        let closestHit = null;
        let shortestDist = Infinity;
        for (const point of hits) {
            const xDist = point.x - vx1;
            const yDist = point.y - vy1;
            const distSq = xDist * xDist + yDist * yDist;
            if (distSq < shortestDist) {
                closestHit = point;
            }
        }
        // closest of the intersections (or null)
        return closestHit;
    }
};

const getEndPositionVectorToRect = (
    vx1,
    vy1,
    vx2,
    vy2,
    rx1,
    ry1,
    rx2,
    ry2,
    rx3,
    ry3,
    rx4,
    ry4
) => {
    const hit = vectorIntersectRect(
        vx1,
        vy1,
        vx2,
        vy2,
        rx1,
        ry1,
        rx2,
        ry2,
        rx3,
        ry3,
        rx4,
        ry4
    );
    console.log("hit:", hit);
    if (hit === null) {
        // return {x:vx2,y:vy2};
        return false;
    }
    // Assumes axis-aligned rectangles
    const yCollision = vx1 >= rx1 && vx1 <= rx2;
    const xCollision = vy1 >= ry1 && vy1 <= ry4;
    if (xCollision) {
        return { x: hit.x, y: vy2 };
    } else if (yCollision) {
        return { x: vx2, y: hit.y };
    } else {
        // corner collision
        return hit;
    }
};

const simpleRectHitCheck = (
    vx1,
    vy1,
    vx2,
    vy2,
    rx1,
    ry1,
    rx2,
    ry2,
    rx3,
    ry3,
    rx4,
    ry4
) => {
    // checks if start xy is outside rect and end xy is inside rect
    // returns endpoint xy where the mover should be placed
    console.log("simpleRectHitCheck()");
    // reposition rect edges by circle radius
    // for now, we hard-code radius as 0.5
    const r = 2.5;
    ry1 -= r;
    rx1 -= r;
    rx2 += r;
    ry2 -= r;
    rx3 += r;
    ry3 += r;
    rx4 -= r;
    ry4 += r;
    const startOutsideRect =
        vx1 <= rx1 || vx1 >= rx2 || vy1 <= ry1 || vy1 >= ry3;
    const endInsideRect = vx2 > rx1 && vx2 < rx2 && vy2 > ry1 && vy2 < ry3;
    console.log("startOutside", startOutsideRect);
    console.log("endIndside:", endInsideRect);
    if (startOutsideRect && endInsideRect) {
        console.log("-----------------------------Moved Into Rect");
        let endX = vx2;
        let endY = vy2;
        const startAbove = vy1 <= ry1;
        const startBelow = vy1 >= ry4;
        const startLeft = vx1 <= rx1;
        const startRight = vx1 >= rx2;
        if (startAbove) {
            endY = ry1;
        } else if (startBelow) {
            endY = ry4;
        }
        if (startLeft) {
            endX = rx1;
        } else if (startRight) {
            endX = rx2;
        }
        return { x: endX, y: endY };
    }
    return false;
};

export { getEndPositionVectorToRect, simpleRectHitCheck };
