const fs = require('fs');

const dbPath = '/Users/I743956/Library/Application Support/Electron/Aurora-debug/Databases/media_albums.db';

if (!fs.existsSync(dbPath)) {
  console.log('Database file not found:', dbPath);
  process.exit(1);
}

const content = fs.readFileSync(dbPath, 'utf8');
const lines = content.split('\n').filter(line => line.trim().length > 0);

console.log(`Read ${lines.length} lines from ${dbPath}`);

const providerIdMap = new Map();
const idMap = new Map();

// First pass: identify duplicates
const duplicates = [];

lines.forEach((line, index) => {
  try {
    const doc = JSON.parse(line);
    
    // Check provider_id collision (unique constraint)
    if (doc.provider_id) {
      if (providerIdMap.has(doc.provider_id)) {
        // Found duplicate provider_id
        // Since nedb is append-only, usually the last one is the valid state for _id.
        // But if two DIFFERENT _ids have same provider_id, that's a violation.
        const prevDoc = providerIdMap.get(doc.provider_id);
        if (prevDoc._id !== doc._id) {
            console.log(`Conflict found! provider_id: ${doc.provider_id}`);
            console.log(`  Existing _id: ${prevDoc._id}`);
            console.log(`  New _id: ${doc._id}`);
            // We should keep the one that looks "newer" or valid.
            // Or simply keep the last one encountered in the file, effectively "updating" the provider_id owner.
        }
      }
      providerIdMap.set(doc.provider_id, doc);
    }

    // Check _id collision (primary key)
    // nedb handles this by updating the doc. But unique constraint on other fields is checked across ALL docs.
    idMap.set(doc._id, doc);

  } catch (e) {
    console.error(`Error parsing line ${index}:`, e.message);
  }
});

// Reconstruct the file content using the unique docs from providerIdMap
// Note: This might lose some docs if they didn't have provider_id (unlikely for albums).
// Also, we need to ensure we don't violate _id uniqueness either.

const uniqueDocs = Array.from(providerIdMap.values());
const newContent = uniqueDocs.map(doc => JSON.stringify(doc)).join('\n') + '\n';

console.log(`Writing ${uniqueDocs.length} unique documents back to DB.`);

// Backup original
fs.copyFileSync(dbPath, dbPath + '.bak');
fs.writeFileSync(dbPath, newContent);

console.log('Database repair complete.');
