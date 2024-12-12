export async function fetchModel(url) {
    const response = await fetch(url, {
        cache: 'no-store' // Disable caching for large files
    });
    return response;
} 