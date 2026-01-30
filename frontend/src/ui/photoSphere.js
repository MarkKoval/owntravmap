import { initPhotoSphere } from "../map/photoSphereRenderer.js";

export function createPhotoSphereModal() {
  const element = document.createElement("div");
  element.className = "photo-sphere";
  element.innerHTML = `
    <div class="photo-sphere__backdrop"></div>
    <div class="photo-sphere__content">
      <button class="close-btn">Закрити</button>
      <div class="photo-sphere__canvas" id="sphere-canvas"></div>
    </div>
  `;

  const closeBtn = element.querySelector(".close-btn");
  closeBtn.addEventListener("click", () => element.classList.remove("open"));

  let renderer;

  return {
    element,
    open(photos) {
      element.classList.add("open");
      if (!renderer) {
        renderer = initPhotoSphere(element.querySelector("#sphere-canvas"));
      }
      renderer.setPhotos(photos);
    }
  };
}
