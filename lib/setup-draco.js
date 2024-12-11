const fs = require('fs');
const path = require('path');
const https = require('https');

const DRACO_FILES = [
    'draco_decoder.js',
    'draco_decoder.wasm',
    'draco_encoder.js',
    'draco_encoder.wasm'
];

const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function setupDraco() {
    const dracoDir = path.join(process.cwd(), 'public', 'draco');

    if (!fs.existsSync(dracoDir)) {
        fs.mkdirSync(dracoDir, { recursive: true });
    }

    for (const file of DRACO_FILES) {
        const dest = path.join(dracoDir, file);
        if (!fs.existsSync(dest)) {
            console.log(`Downloading ${file}...`);
            await downloadFile(`${DRACO_CDN}/${file}`, dest);
        }
    }
}

setupDraco().catch(console.error); 