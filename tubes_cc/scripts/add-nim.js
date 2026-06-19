const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'tubes_cc',
    port: 3306,
  });

  try {
    console.log('Connected to database.');

    // 1. Add nim column if not exists
    await connection.execute(`
      ALTER TABLE members
      ADD COLUMN IF NOT EXISTS nim VARCHAR(20) NULL AFTER class_room
    `);
    console.log('✓ Column nim added (or already exists).');

    // 2. Update NIM per member ID
    const nimData = [
      { id: 1, name: 'Muhammad Zaky Ryan Ardhiansyah', nim: '102022300380' },
      { id: 2, name: 'Muhammad Hafiz Nur Irawan',      nim: '102022300048' },
      { id: 3, name: 'Muhammad Haris Caisariyanto',    nim: '102022300112' },
      { id: 4, name: 'Michail Djordhi',                nim: '102022300411' },
      { id: 5, name: 'Farid Munadhil',                 nim: '102022300235' },
    ];

    for (const m of nimData) {
      await connection.execute('UPDATE members SET nim = ? WHERE id = ?', [m.nim, m.id]);
      console.log(`✓ Updated NIM for [${m.id}] ${m.name} → ${m.nim}`);
    }

    // 3. Verify
    const [rows] = await connection.execute('SELECT id, name, nim FROM members ORDER BY id');
    console.log('\n=== Verification ===');
    for (const row of rows) {
      console.log(`  [${row.id}] ${row.name} | NIM: ${row.nim}`);
    }

    console.log('\nDone!');
  } finally {
    await connection.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
