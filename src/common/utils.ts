export function numberMap(o: { n: number, in_min: number, in_max: number, out_min: number, out_max: number }): number {
    return (o.n - o.in_min) * (o.out_max - o.out_min) / (o.in_max - o.in_min) + o.out_min;
}
