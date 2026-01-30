import { createPhotoSphere } from './photoSphere';

let current = null;

export function openPhotoModal(photos = []) {
  const modal = document.getElementById('photo-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = `
    <div class="glass card" style="width: 80%; height: 80%; position: relative;">
      <button id="close-photo" class="glass-button" style="position: absolute; top: 12px; right: 12px;">Закрити</button>
      <div id="sphere" style="width: 100%; height: 100%;"></div>
    </div>
  `;
  const sphere = modal.querySelector('#sphere');
  current = createPhotoSphere(sphere, photos);
  modal.querySelector('#close-photo').addEventListener('click', closePhotoModal, { once: true });
}

export function closePhotoModal() {
  const modal = document.getElementById('photo-modal');
  if (current) {
    current.dispose();
    current = null;
  }
  modal.classList.add('hidden');
  modal.innerHTML = '';
}
