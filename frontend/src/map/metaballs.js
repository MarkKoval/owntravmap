const layerId = 'metaballs-layer';

function kernel(t) {
  if (t >= 1) return 0;
  const v = 1 - t;
  return v * v;
}

function computeField(points, width, height, radius, threshold) {
  const cols = 60;
  const rows = 60;
  const cellW = width / cols;
  const cellH = height / rows;
  const values = [];

  for (let y = 0; y <= rows; y += 1) {
    const row = [];
    const py = y * cellH;
    for (let x = 0; x <= cols; x += 1) {
      const px = x * cellW;
      let sum = 0;
      for (const point of points) {
        const dx = px - point.x;
        const dy = py - point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        sum += point.weight * kernel(dist / (radius * point.radiusScale));
      }
      row.push(sum >= threshold ? 1 : 0);
    }
    values.push(row);
  }

  return { values, cols, rows, cellW, cellH };
}

function drawContours(ctx, grid) {
  ctx.beginPath();
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      const tl = grid.values[y][x];
      const tr = grid.values[y][x + 1];
      const br = grid.values[y + 1][x + 1];
      const bl = grid.values[y + 1][x];
      const state = tl * 8 + tr * 4 + br * 2 + bl;
      if (state === 0 || state === 15) continue;
      const x0 = x * grid.cellW;
      const y0 = y * grid.cellH;
      const xm = x0 + grid.cellW / 2;
      const ym = y0 + grid.cellH / 2;

      switch (state) {
        case 1:
        case 14:
          ctx.moveTo(x0, ym);
          ctx.lineTo(xm, y0 + grid.cellH);
          break;
        case 2:
        case 13:
          ctx.moveTo(xm, y0 + grid.cellH);
          ctx.lineTo(x0 + grid.cellW, ym);
          break;
        case 3:
        case 12:
          ctx.moveTo(x0, ym);
          ctx.lineTo(x0 + grid.cellW, ym);
          break;
        case 4:
        case 11:
          ctx.moveTo(xm, y0);
          ctx.lineTo(x0 + grid.cellW, ym);
          break;
        case 5:
          ctx.moveTo(xm, y0);
          ctx.lineTo(x0, ym);
          ctx.moveTo(xm, y0 + grid.cellH);
          ctx.lineTo(x0 + grid.cellW, ym);
          break;
        case 6:
        case 9:
          ctx.moveTo(xm, y0);
          ctx.lineTo(xm, y0 + grid.cellH);
          break;
        case 7:
        case 8:
          ctx.moveTo(x0, ym);
          ctx.lineTo(xm, y0);
          break;
        case 10:
          ctx.moveTo(xm, y0);
          ctx.lineTo(x0 + grid.cellW, ym);
          ctx.moveTo(x0, ym);
          ctx.lineTo(xm, y0 + grid.cellH);
          break;
        default:
          break;
      }
    }
  }
  ctx.stroke();
}

function ensureCanvas(map) {
  let canvas = map.getContainer().querySelector(`canvas[data-layer="${layerId}"]`);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.dataset.layer = layerId;
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.pointerEvents = 'none';
    map.getContainer().appendChild(canvas);
  }
  return canvas;
}

export function renderMetaballs(map, features) {
  const canvas = ensureCanvas(map);
  const rect = map.getContainer().getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const zoom = map.getZoom();
  if (zoom < 6 || zoom > 12) return;

  const points = features.map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const pixel = map.project([lng, lat]);
    return {
      x: pixel.x,
      y: pixel.y,
      weight: Math.log1p(feature.properties.visitsCount || 1),
      radiusScale: Math.max(0.6, Math.min(1.6, (zoom - 5) / 6))
    };
  });

  const radius = 120;
  const threshold = 1.2;
  const grid = computeField(points, canvas.width, canvas.height, radius, threshold);

  ctx.strokeStyle = 'rgba(122, 214, 255, 0.9)';
  ctx.lineWidth = 2;
  drawContours(ctx, grid);

  ctx.fillStyle = 'rgba(122, 214, 255, 0.15)';
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      if (grid.values[y][x]) {
        ctx.fillRect(x * grid.cellW, y * grid.cellH, grid.cellW, grid.cellH);
      }
    }
  }
}
