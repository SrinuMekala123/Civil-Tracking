const PocketBase = require('pocketbase').default;
const axios = require('axios');
const csv = require('csv-parser');
const { Readable } = require('stream');

const pb = new PocketBase('http://127.0.0.1:8090');
const ADMIN_EMAIL = 'mekalasrinu854@gmail.com';
const ADMIN_PASSWORD = 'Srinu@1234';

const SPREADSHEET_ID = '12MZz-HUISBrdciFXZ8Li7in4nHcTKEhMIArVbCpYGRY';

// Only importing state-wise breakdown sheets (excluding main Pan India sheet)
const SHEET_IDS = [
  '1181508758', '195377689', '1963337865',
  '913765978', '1211638239', '815349602', '39754094', '1030408325',
  '1402165484', '1434576338', '531018481', '924950609', '778114112',
  '1451437260', '824513290', '106628625', '544091208', '1060880367',
  '1484077782', '1891082353', '1380077812', '1267268830', '1407996959',
  '808424715', '2107318119'
];

const formatDate = (dateStr) => {
  if (!dateStr || dateStr.toString().trim() === '') return '';
  const parts = dateStr.toString().trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return '';
};

async function checkIfOfficerExists(email, name, batchYear) {
  try {
    let filter = '';
    if (email && email.trim() !== '' && email.includes('@')) {
      filter = `email = "${email}"`;
    } else if (name && batchYear) {
      filter = `name = "${name.replace(/"/g, '\\"')}" && batch_year = ${batchYear}`;
    }
    if (!filter) return null;
    const existing = await pb.collection('ias_officers').getFirstListItem(filter);
    return existing;
  } catch {
    return null;
  }
}

async function fetchSheetData(gid) {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  try {
    console.log(`   Fetching sheet ${gid}...`);
    const response = await axios.get(csvUrl);
    const lines = response.data.split('\n');
    const csvWithoutTitle = lines.slice(1).join('\n');

    return new Promise((resolve, reject) => {
      const results = [];
      Readable.from(csvWithoutTitle)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          console.log(`   Found ${results.length} rows`);
          resolve(results);
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error(`   ❌ Error fetching sheet ${gid}:`, error.message);
    return [];
  }
}

// ✅ UPDATED: Now includes ALL fields from Google Sheet
function transformOfficerData(row) {
  return {
    // Existing fields
    name: row['Name'] || '',
    batch_year: parseInt(row['Allotment Year']) || 0,
    cadre: row['Cadre / State'] || '',
    current_position: row['Present Post'] || '',
    department: '',
    state: row['Cadre / State'] || '',
    date_of_birth: formatDate(row['Date of Birth']),
    appointment_date: formatDate(row['Date of Appt.']),
    contact_number: row['Official Contact'] || '',
    email: row['Official Email'] || '',
    status: 'Active',
    qualification: row['Qualification'] || '',
    address: '',
    previous_postings: [],

    // ✅ NEW FIELDS from Google Sheet
    officer_id: row['Officer ID'] || '',
    source: row['Source'] || '',
    domicile: row['Domicile'] || '',
    pay_level: row['Pay Level'] || '',
    central_deputation: row['Central Deputation'] || '',
    twitter_x: row['Twitter / X'] || '',
    linkedin: row['LinkedIn'] || '',
    instagram: row['Instagram'] || '',
    mobile_no: row['Mobile No.'] || '',
    remarks: row['Remarks'] || '',
  };
}

async function importAllSheets() {
  console.log('🔐 Authenticating with PocketBase...');

  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('✅ Authenticated successfully!\n');

    let totalImported = 0;
    let totalSkipped = 0;
    let totalDuplicates = 0;

    for (const gid of SHEET_IDS) {
      console.log(`\n📊 Processing sheet ${gid}...`);

      const sheetData = await fetchSheetData(gid);
      let imported = 0;
      let skipped = 0;
      let duplicates = 0;

      for (const row of sheetData) {
        try {
          const officerData = transformOfficerData(row);

          if (!officerData.name || officerData.name.trim() === '') {
            skipped++;
            continue;
          }

          const existing = await checkIfOfficerExists(
            officerData.email,
            officerData.name,
            officerData.batch_year
          );

          if (existing) {
            duplicates++;
            totalDuplicates++;
            continue;
          }

          await pb.collection('ias_officers').create(officerData);
          imported++;
          totalImported++;

          if (imported % 50 === 0) {
            console.log(`   ✓ Imported ${imported} officers...`);
          }
        } catch (error) {
          // console.error('   ❌ Error:', error.message);
          skipped++;
        }
      }

      console.log(`   ✅ Sheet ${gid}: Imported ${imported}, Skipped ${skipped}, Duplicates ${duplicates}`);
      totalSkipped += skipped;
    }

    console.log(`\n🎉 Import complete!`);
    console.log(`   Total imported: ${totalImported}`);
    console.log(`   Total skipped: ${totalSkipped}`);
    console.log(`   Total duplicates prevented: ${totalDuplicates}`);
    console.log(`\n📝 Check your PocketBase admin panel at http://127.0.0.1:8090/_/`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. PocketBase is running (./pocketbase serve)');
    console.log('   2. Admin email and password are correct');
    console.log('   3. The ias_officers collection exists in PocketBase');
  }
}

importAllSheets();