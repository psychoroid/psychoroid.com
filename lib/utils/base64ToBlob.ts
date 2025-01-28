/**
 * Converts a base64 string to a Blob object
 * @param b64Data - The base64 string to convert
 * @param contentType - The content type of the blob (defaults to model/gltf-binary)
 * @param sliceSize - The size of chunks to process (defaults to 512)
 */
export function base64ToBlob(b64Data: string, contentType = 'model/gltf-binary', sliceSize = 512): Blob {
	// Validate input
	if (!b64Data) {
		throw new Error('No data provided');
	}

	try {
		// Check if we're in a browser environment
		if (typeof window === 'undefined' || !window.atob) {
			throw new Error('This function requires a browser environment');
		}

		// Remove data URL prefix and get the base64 part
		let base64 = b64Data;
		if (base64.includes('base64,')) {
			const parts = base64.split('base64,');
			if (parts.length !== 2) {
				throw new Error('Invalid base64 data URL format');
			}
			base64 = parts[1];
		}

		// Clean the base64 string
		base64 = base64.replace(/[\n\r\s]/g, '');

		// Decode base64
		const byteCharacters = window.atob(base64);
		const byteArrays = [];

		// Process in chunks to handle large files
		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const chunk = byteCharacters.slice(offset, offset + sliceSize);
			const byteNumbers = new Array(chunk.length);

			for (let i = 0; i < chunk.length; i++) {
				byteNumbers[i] = chunk.charCodeAt(i);
			}

			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}

		// Create and return blob
		return new Blob(byteArrays, { type: contentType });
	} catch (error) {
		console.error('Error in base64ToBlob:', error);
		throw error;
	}
}

/**
 * Creates an object URL from base64 data
 * @param base64Data - The base64 string to convert
 * @returns A blob URL that can be used to load the model
 */
export function createModelUrlFromBase64(base64Data: string): string {
	try {
		// Validate input
		if (!base64Data) {
			throw new Error('No data provided');
		}

		// Convert to blob and create URL
		const blob = base64ToBlob(base64Data);
		const url = URL.createObjectURL(blob);

		if (!url) {
			throw new Error('Failed to create object URL');
		}

		return url;
	} catch (error) {
		console.error('Error in createModelUrlFromBase64:', error);
		throw error;
	}
}