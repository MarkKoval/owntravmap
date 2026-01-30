import * as THREE from 'three';

export function createPhotoSphere(container, photos) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const geometry = new THREE.SphereGeometry(6, 32, 32);
  geometry.scale(-1, 1, 1);

  const loader = new THREE.TextureLoader();
  const textures = photos.slice(0, 40).map((url) => loader.load(url));

  textures.forEach((texture, index) => {
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = (index / textures.length) * Math.PI * 2;
    scene.add(mesh);
  });

  let isActive = true;

  function animate() {
    if (!isActive) return;
    scene.rotation.y += 0.0015;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();

  function dispose() {
    isActive = false;
    renderer.dispose();
  }

  return { dispose };
}
