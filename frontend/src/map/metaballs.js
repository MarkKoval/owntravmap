const DEFAULT_RESOLUTION = 120;

function kernel(distanceRatio) {
  if (distanceRatio >= 1) return 0;
  const t = 1 - distanceRatio;
  return t * t;
}

function computeField(points, grid, threshold) {
  const contours = [];
  const cols = grid.length - 1;
  const rows = grid[0].length - 1;
  for (let x = 0; x < cols; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const a = grid[x][y] >= threshold;
      const b = grid[x + 1][y] >= threshold;
      const c = grid[x + 1][y + 1] >= threshold;
      const d = grid[x][y + 1] >= threshold;
      const mask = (a << 3) | (b << 2) | (c << 1) | d;
      if (mask === 0 || mask === 15) continue;
      const px = x / cols;
      const py = y / rows;
      contours.push({ mask, px, py });
    }
  }
  return contours;
}

export function createMetaballsLayer(canvas) {
  const ctx = canvas.getContext('2d');
  let cachedPoints = [];

  function resize(map) {
    const { width, height } = map.getCanvas();
    canvas.width = width;
    canvas.height = height;
  }

  function update(points, map) {
    cachedPoints = points.map((place) => ({
      ...place,
      weight: Math.log1p(place.visitsCount || place.visits?.length || 1)
    }));
    resize(map);
    render(map);
  }

  function render(map) {
    if (!map || !cachedPoints.length) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    resize(map);
    const cols = DEFAULT_RESOLUTION;
    const rows = Math.round((canvas.height / canvas.width) * DEFAULT_RESOLUTION);
    const grid = Array.from({ length: cols + 1 }, () => Array(rows + 1).fill(0));

    cachedPoints.forEach((point) => {
      const screen = map.project([point.lng, point.lat]);
      const baseRadius = map.getZoom() * 6;
      const radius = Math.max(40, baseRadius + point.weight * 12);
      for (let x = 0; x <= cols; x += 1) {
        for (let y = 0; y <= rows; y += 1) {
          const gx = (x / cols) * canvas.width;
          const gy = (y / rows) * canvas.height;
          const dist = Math.hypot(gx - screen.x, gy - screen.y);
          const ratio = dist / radius;
          grid[x][y] += point.weight * kernel(ratio);
        }
      }
    });

    const max = Math.max(...grid.flat());
    const threshold = max * 0.3;
    const contours = computeField(cachedPoints, grid, threshold);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(100, 120, 255, 0.25)';
    ctx.strokeStyle = 'rgba(120, 160, 255, 0.8)';
    ctx.lineWidth = 1.5;

    contours.forEach(({ mask, px, py }) => {
      const x = px * canvas.width;
      const y = py * canvas.height;
      ctx.beginPath();
      ctx.rect(x, y, canvas.width / cols, canvas.height / rows);
      ctx.fill();
      ctx.stroke();
    });
  }

  return { update, render };
}
