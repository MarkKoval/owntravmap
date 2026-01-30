import { openPhotoModal } from '../three/photoModal';

export function openPhotoSphere(photos) {
  if (!photos || photos.length === 0) {
    return;
  }
  openPhotoModal(photos);
}
