import * as THREE from "three";

export function initPhotoSphere(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  camera.position.z = 1;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const sphere = new THREE.Group();
  scene.add(sphere);

  const geometry = new THREE.SphereGeometry(4, 32, 32);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x0c0f19, transparent: true, opacity: 0.9 });
  const mesh = new THREE.Mesh(geometry, material);
  sphere.add(mesh);

  let planes = [];

  function layoutPhotos(textures) {
    planes.forEach((plane) => sphere.remove(plane));
    planes = textures.map((texture, index) => {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: texture })
      );
      const phi = Math.acos(1 - 2 * (index + 1) / (textures.length + 1));
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      plane.position.set(
        3 * Math.cos(theta) * Math.sin(phi),
        3 * Math.sin(theta) * Math.sin(phi),
        3 * Math.cos(phi)
      );
      plane.lookAt(0, 0, 0);
      sphere.add(plane);
      return plane;
    });
  }

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function animate() {
    sphere.rotation.y += 0.0015;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener("resize", resize);

  return {
    setPhotos(photoUrls) {
      const loader = new THREE.TextureLoader();
      const textures = photoUrls.map((url) => loader.load(url));
      layoutPhotos(textures);
    }
  };
}
