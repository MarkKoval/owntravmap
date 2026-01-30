import * as THREE from 'three';

let renderer;
let scene;
let camera;
let sphere;
let animationId;

export function initPhotoSphere(canvas) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  camera.position.z = 0.1;

  const geometry = new THREE.SphereGeometry(5, 48, 48);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x222633, side: THREE.BackSide });
  sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  resize();
  window.addEventListener('resize', resize);
}

export function openPhotoSphere(urls) {
  const loader = new THREE.TextureLoader();
  Promise.all(urls.map((url) => loader.loadAsync(url))).then((textures) => {
    textures.forEach((texture, index) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.1),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      const angle = (index / textures.length) * Math.PI * 2;
      plane.position.set(Math.cos(angle) * 4.2, Math.sin(angle * 2) * 0.8, Math.sin(angle) * 4.2);
      plane.lookAt(0, 0, 0);
      sphere.add(plane);
    });
  });
  animate();
}

export function closePhotoSphere() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (sphere) {
    [...sphere.children].forEach((child) => {
      sphere.remove(child);
      if (child.material?.map) {
        child.material.map.dispose();
      }
      child.material?.dispose?.();
      child.geometry?.dispose?.();
    });
  }
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (sphere) {
    sphere.rotation.y += 0.0015;
  }
  renderer.render(scene, camera);
}

function resize() {
  const canvas = renderer.domElement;
  const parent = canvas.parentElement;
  const width = parent.clientWidth;
  const height = parent.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
