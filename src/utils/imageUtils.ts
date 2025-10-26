/**
 * Image utility functions for photo verification
 */

/**
 * Compress an image to reduce file size before sending to API
 * @param base64Image - Base64 encoded image with data URL prefix
 * @param maxWidth - Maximum width in pixels (default 1024)
 * @param maxHeight - Maximum height in pixels (default 1024)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed base64 image
 */
export async function compressImage(
	base64Image: string,
	maxWidth: number = 1024,
	maxHeight: number = 1024,
	quality: number = 0.8
): Promise<string> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		img.onload = () => {
			try {
				// Calculate new dimensions while maintaining aspect ratio
				let width = img.width;
				let height = img.height;

				if (width > maxWidth || height > maxHeight) {
					const aspectRatio = width / height;

					if (width > height) {
						width = maxWidth;
						height = width / aspectRatio;
					} else {
						height = maxHeight;
						width = height * aspectRatio;
					}
				}

				// Create canvas and draw resized image
				const canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext("2d");
				if (!ctx) {
					reject(new Error("Failed to get canvas context"));
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);

				// Convert to base64 with compression
				const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
				resolve(compressedBase64);
			} catch (error) {
				reject(error);
			}
		};

		img.onerror = () => {
			reject(new Error("Failed to load image"));
		};

		img.src = base64Image;
	});
}

/**
 * Get the size of a base64 image in KB
 * @param base64Image - Base64 encoded image
 * @returns Size in kilobytes
 */
export function getImageSizeKB(base64Image: string): number {
	const base64Data = base64Image.includes(",")
		? base64Image.split(",")[1]
		: base64Image;
	return (base64Data.length * 3) / 4 / 1024;
}

/**
 * Validate if an image is within size limits
 * @param base64Image - Base64 encoded image
 * @param maxSizeKB - Maximum size in KB (default 5000 = 5MB)
 * @returns true if valid, false if too large
 */
export function isImageSizeValid(
	base64Image: string,
	maxSizeKB: number = 5000
): boolean {
	return getImageSizeKB(base64Image) <= maxSizeKB;
}
