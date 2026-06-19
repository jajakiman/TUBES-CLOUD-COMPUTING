const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tubes_cc'
  });

  const [users] = await connection.query('SELECT * FROM users');
  console.log('--- USERS ---');
  console.log(users);

  const [members] = await connection.query('SELECT * FROM members');
  console.log('--- MEMBERS ---');
  console.log(members);

  const [todos] = await connection.query('SELECT * FROM todos');
  console.log('--- TODOS ---');
  console.log(todos);

  await connection.end();
}

main().catch(console.error);
