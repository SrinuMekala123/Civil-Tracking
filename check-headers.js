const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const SPREADSHEET_ID = '12MZz-HUISBrdciFXZ8Li7in4nHcTKEhMIArVbCpYGRY';
const gid = '863763677'; // Using the sheet with 5784 rows

async function checkHeaders() {
    console.log('🔍 Fetching sheet data to find exact column names...');
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
    const response = await axios.get(csvUrl);

    // Split the CSV text into lines
    const lines = response.data.split('\n');

    // Let's see what the first few lines look like to understand the structure
    console.log('\n--- FIRST 5 RAW LINES OF THE CSV ---');
    for (let i = 0; i < 5; i++) {
        console.log(`Line ${i + 1}: ${lines[i]}`);
    }
    console.log('------------------------------------\n');

    // Remove the first line (the title) and parse the rest
    const csvWithoutTitle = lines.slice(1).join('\n');

    Readable.from(csvWithoutTitle)
        .pipe(csv())
        .on('data', (data) => {
            console.log('✅ ACTUAL COLUMN NAMES (from Row 2 of your sheet):');
            console.log(Object.keys(data));
            console.log('\n✅ SAMPLE DATA FROM THE FIRST ACTUAL ROW (Row 3 of your sheet):');
            console.log(data);
            process.exit(0); // Stop after reading the first actual data row
        })
        .on('error', (err) => {
            console.error('Error:', err.message);
        });
}

checkHeaders();