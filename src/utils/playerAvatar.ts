export const getPlayerInitials = (name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName) return 'P';

  const words = trimmedName.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
};

export const resizeAvatarFile = (file: File, maxSizePx = 80, quality = 0.82): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error('Unable to load the selected image.'));
      image.onload = () => {
        const scale = Math.min(1, maxSizePx / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to prepare the image for upload.'));
          return;
        }

        context.fillStyle = '#f8efe1';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      image.src = String(reader.result);
    };

    reader.readAsDataURL(file);
  });
