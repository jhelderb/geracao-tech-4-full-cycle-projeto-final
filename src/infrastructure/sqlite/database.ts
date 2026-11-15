import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';

export type DatabaseConnection = Database.Database;

export function abrirBanco(caminho: string): DatabaseConnection {
  if (caminho !== ':memory:') {
    mkdirSync(dirname(caminho), { recursive: true });
  }

  const db = new Database(caminho);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      cliente_nome TEXT NOT NULL,
      itens_json TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );
  `);

  return db;
}
