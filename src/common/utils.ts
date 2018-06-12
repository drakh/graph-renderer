export function computeAngle(p1, p2) {
    const angle = (Math.atan2(p1[1] - p2[1], p1[0] - p2[0])) * 180 / Math.PI;
    if (angle < 0) {
        return 180 + (180 + angle);
    }
    else {
        return angle;
    }
}

export function interpolateQuadraticBezier(start, control, end) {
    // 0 <= t <= 1
    return function interpolator(t) {
        return [
            (Math.pow(1 - t, 2) * start[0]) +
            (2 * (1 - t) * t * control[0]) +
            (Math.pow(t, 2) * end[0]),
            (Math.pow(1 - t, 2) * start[1]) +
            (2 * (1 - t) * t * control[1]) +
            (Math.pow(t, 2) * end[1]),
        ];
    };
}

// B'(t) = 2(1 - t)(P1 - P0) + 2t(P2 - P1)
export function interpolateQuadraticBezierAngle(start, control, end) {
    // 0 <= t <= 1
    return function interpolator(t) {
        const tangentX = (2 * (1 - t) * (control[0] - start[0])) +
            (2 * t * (end[0] - control[0]));
        const tangentY = (2 * (1 - t) * (control[1] - start[1])) +
            (2 * t * (end[1] - control[1]));

        return Math.atan2(tangentY, tangentX) * (180 / Math.PI);
    };
}