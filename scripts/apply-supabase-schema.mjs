import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

async function main() {
  const url = process.env.SUPABASE_DB_URL
  if (!url) {
    console.error('SUPABASE_DB_URL não definido. Configure no .env.')
    process.exit(1)
  }
  const sqlPath = new URL('../supabase/schema.sql', import.meta.url)
  const sql = await readFile(sqlPath, 'utf8')
  const client = new Client({ connectionString: url })
  try {
    await client.connect()
    await client.query(sql)
    console.log('Schema aplicado com sucesso.')
  } catch (err) {
    console.error('Erro ao aplicar schema:', err?.message || err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()

