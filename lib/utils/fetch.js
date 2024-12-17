export async function fetchModel(url) {
    const response = await fetch(url, {
        cache: 'no-store'
    });
    return response;
} 