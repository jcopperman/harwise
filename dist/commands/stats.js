import { readFileSync } from 'fs';
import { parseHar } from '../har.js';
export function statsCommand(harFile, options = {}) {
    try {
        const harContent = readFileSync(harFile, 'utf-8');
        const har = JSON.parse(harContent);
        const samples = parseHar(har, options);
        const total = samples.length;
        if (total === 0) {
            console.log('No API-like requests found in HAR file');
            return;
        }
        const avgTime = samples.reduce((sum, s) => sum + s.time, 0) / total;
        const avgSize = samples.reduce((sum, s) => sum + s.size, 0) / total;
        const statusCounts = samples.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {});
        console.log(`HAR Stats: ${harFile}`);
        console.log(`Total API requests: ${total}`);
        console.log(`Average time: ${avgTime.toFixed(2)}ms`);
        console.log(`Average size: ${avgSize.toFixed(2)} bytes`);
        console.log('Status codes:', statusCounts);
    }
    catch (error) {
        console.error('Error reading HAR file:', error);
        process.exit(1);
    }
}
