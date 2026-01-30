export function openBottomSheet({ title, description }) {
  const sheet = document.getElementById('bottom-sheet');
  sheet.innerHTML = `
    <div class="card">
      <h2>${title}</h2>
      <p>${description}</p>
      <div style="display: flex; gap: 12px;">
        <button class="glass-button">Підтвердити, що були тут</button>
        <button class="glass-button" id="close-sheet">Закрити</button>
      </div>
    </div>
  `;
  sheet.classList.remove('hidden');
  sheet.querySelector('#close-sheet').addEventListener('click', () => {
    sheet.classList.add('hidden');
  });
}
