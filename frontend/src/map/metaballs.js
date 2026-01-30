export function generateMetaballContours({ points, gridSize, threshold, bounds }) {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const cols = Math.ceil((maxLng - minLng) / gridSize);
  const rows = Math.ceil((maxLat - minLat) / gridSize);
  const field = new Array(rows).fill(0).map(() => new Array(cols).fill(0));

  for (const point of points) {
    const { coordinates, weight } = point;
    const [lng, lat] = coordinates;
    for (let row = 0; row < rows; row += 1) {
      const y = minLat + row * gridSize;
      for (let col = 0; col < cols; col += 1) {
        const x = minLng + col * gridSize;
        const dx = lng - x;
        const dy = lat - y;
        const distSq = dx * dx + dy * dy + 1e-6;
        field[row][col] += weight / distSq;
      }
    }
  }

  return marchingSquares(field, threshold, { minLng, minLat, gridSize });
}

function marchingSquares(field, threshold, { minLng, minLat, gridSize }) {
  const rows = field.length - 1;
  const cols = field[0].length - 1;
  const contours = [];

  const edges = [
    [0.5, 0],
    [1, 0.5],
    [0.5, 1],
    [0, 0.5]
  ];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const square = [
        field[y][x] >= threshold ? 1 : 0,
        field[y][x + 1] >= threshold ? 1 : 0,
        field[y + 1][x + 1] >= threshold ? 1 : 0,
        field[y + 1][x] >= threshold ? 1 : 0
      ];

      const idx = square[0] * 8 + square[1] * 4 + square[2] * 2 + square[3];
      if (idx === 0 || idx === 15) continue;

      const segments = lookupSegments(idx, edges);
      segments.forEach((segment) => {
        const [a, b] = segment;
        contours.push([
          [minLng + (x + a[0]) * gridSize, minLat + (y + a[1]) * gridSize],
          [minLng + (x + b[0]) * gridSize, minLat + (y + b[1]) * gridSize]
        ]);
      });
    }
  }

  return contours;
}

function lookupSegments(idx, edges) {
  switch (idx) {
    case 1:
      return [[edges[2], edges[3]]];
    case 2:
      return [[edges[1], edges[2]]];
    case 3:
      return [[edges[1], edges[3]]];
    case 4:
      return [[edges[0], edges[1]]];
    case 5:
      return [
        [edges[0], edges[3]],
        [edges[1], edges[2]]
      ];
    case 6:
      return [[edges[0], edges[2]]];
    case 7:
      return [[edges[0], edges[3]]];
    case 8:
      return [[edges[0], edges[3]]];
    case 9:
      return [[edges[0], edges[2]]];
    case 10:
      return [
        [edges[0], edges[1]],
        [edges[2], edges[3]]
      ];
    case 11:
      return [[edges[0], edges[1]]];
    case 12:
      return [[edges[1], edges[3]]];
    case 13:
      return [[edges[1], edges[2]]];
    case 14:
      return [[edges[2], edges[3]]];
    default:
      return [];
  }
}
