import { useEffect, useMemo, useRef, useState } from 'react';

export default function PhotoSphereModal({ place, onClose }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const draggingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });

  const photos = useMemo(() => {
    if (!place?.photos?.length) return [];
    return place.photos;
  }, [place]);

  useEffect(() => {
    if (place) {
      setRotation({ x: 0, y: 0 });
      setActiveIndex(0);
      setExpanded(false);
    }
  }, [place]);

  if (!place) return null;

  const handlePointerDown = (event) => {
    draggingRef.current = true;
    lastRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - lastRef.current.x;
    const dy = event.clientY - lastRef.current.y;
    lastRef.current = { x: event.clientX, y: event.clientY };
    setRotation((prev) => ({
      x: Math.max(-40, Math.min(40, prev.x + dy * 0.3)),
      y: prev.y + dx * 0.4
    }));
  };

  const handlePointerUp = () => {
    draggingRef.current = false;
  };

  const activePhoto = photos[activeIndex];

  return (
    <div className="gallery-backdrop" role="dialog" aria-modal="true">
      <div className="gallery-card">
        <header>
          <h3>{place.title || 'Обласний центр'}</h3>
          <button type="button" className="ghost" onClick={onClose}>
            Закрити
          </button>
        </header>
        {photos.length === 0 ? (
          <p className="gallery-empty">Додайте фото, щоб побачити 3D галерею.</p>
        ) : (
          <div className="sphere-stage">
            <div
              className={`sphere${expanded ? ' expanded' : ''}`}
              style={{
                backgroundImage: `url(${activePhoto})`,
                transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClick={() => setExpanded((prev) => !prev)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setExpanded((prev) => !prev);
              }}
            />
            <div className="sphere-thumbs">
              {photos.map((photo, index) => (
                <button
                  key={photo}
                  type="button"
                  className={index === activeIndex ? 'active' : ''}
                  onClick={() => {
                    setActiveIndex(index);
                    setExpanded(false);
                  }}
                >
                  <img src={photo} alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
