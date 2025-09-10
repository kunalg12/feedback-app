import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

function convertEnvToUtf8(): void {
	if (!fs.existsSync(envPath)) {
		console.error('.env not found at project root');
		process.exit(1);
	}

	const bytes = fs.readFileSync(envPath);
	const hasNull = bytes.some((b) => b === 0);
	let text: string;

	if (hasNull) {
		// Likely UTF-16 LE/BE; try LE first
		try {
			text = Buffer.from(bytes).toString('utf16le');
		} catch {
			text = Buffer.from(bytes).toString('utf8');
		}
	} else {
		text = Buffer.from(bytes).toString('utf8');
	}

	// Remove BOM if present
	if (text.charCodeAt(0) === 0xfeff) {
		text = text.slice(1);
	}

	// Normalize line endings
	text = text.replace(/\r\n/g, '\n');

	fs.writeFileSync(envPath, text, { encoding: 'utf8' });
	console.log('Converted .env to UTF-8 without BOM.');
}

convertEnvToUtf8();
