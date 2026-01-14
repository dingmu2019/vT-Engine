import { Client } from 'pg';
import mysql from 'mysql2/promise';

export interface TableSchema {
    name: string;
    comment: string;
    columns: ColumnSchema[];
    indexes: IndexSchema[];
    foreignKeys: ForeignKeySchema[];
}

export interface ColumnSchema {
    name: string;
    type: string;
    length?: string;
    nullable: boolean;
    pk: boolean;
    defaultValue?: string | null;
    comment: string;
}

export interface IndexSchema {
    name: string;
    columns: string[];
    unique: boolean;
}

export interface ForeignKeySchema {
    name: string;
    column: string;
    refTable: string;
    refColumn: string;
}

export class DbSchemaService {
    static async fetchSchema(config: any): Promise<TableSchema[]> {
        if (!config) throw new Error('Missing database configuration');

        if (config.type === 'mysql') {
            return await DbSchemaService.fetchMySQLSchema(config);
        }
        // Default: Postgres/Supabase
        const client = new Client({
            host: config.host,
            port: parseInt(config.port) || 5432,
            database: config.database || 'postgres',
            user: config.username || 'postgres',
            password: config.password,
            ssl: { rejectUnauthorized: false } // Required for Supabase/Cloud DBs
        });

        try {
            // Add connection timeout
            await Promise.race([
                client.connect(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), 5000))
            ]);

            // 1. Fetch Tables
            const tablesRes = await client.query(`
                SELECT table_name, obj_description(format('%I.%I', table_schema, table_name)::regclass, 'pg_class') as comment
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            `);

            const schemas: TableSchema[] = [];

            for (const table of tablesRes.rows) {
                const tableName = table.table_name;
                
                // 2. Fetch Columns
                const colsRes = await client.query(`
                    SELECT 
                        c.column_name, 
                        c.data_type, 
                        c.character_maximum_length, 
                        c.is_nullable,
                        c.column_default,
                        pg_catalog.col_description(format('%I.%I', c.table_schema, c.table_name)::regclass::oid, c.ordinal_position) as comment
                    FROM information_schema.columns c
                    WHERE c.table_schema = 'public' AND c.table_name = $1
                    ORDER BY c.ordinal_position
                `, [tableName]);

                // 3. Fetch PKs
                const pkRes = await client.query(`
                    SELECT kcu.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu 
                      ON tc.constraint_name = kcu.constraint_name 
                      AND tc.table_schema = kcu.table_schema
                    WHERE tc.constraint_type = 'PRIMARY KEY' 
                      AND tc.table_schema = 'public' 
                      AND tc.table_name = $1
                `, [tableName]);
                const pks = new Set(pkRes.rows.map(r => r.column_name));

                // 4. Fetch Indexes (Complex in PG, simplified query)
                const idxRes = await client.query(`
                    SELECT
                        i.relname as index_name,
                        ix.indisunique as is_unique,
                        array_agg(a.attname) as columns
                    FROM
                        pg_class t,
                        pg_class i,
                        pg_index ix,
                        pg_attribute a
                    WHERE
                        t.oid = ix.indrelid
                        AND i.oid = ix.indexrelid
                        AND a.attrelid = t.oid
                        AND a.attnum = ANY(ix.indkey)
                        AND t.relkind = 'r'
                        AND t.relname = $1
                    GROUP BY
                        i.relname,
                        ix.indisunique
                `, [tableName]);

                // 5. Fetch Foreign Keys
                const fkRes = await client.query(`
                    SELECT
                        tc.constraint_name, 
                        kcu.column_name, 
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name 
                    FROM 
                        information_schema.table_constraints AS tc 
                        JOIN information_schema.key_column_usage AS kcu
                          ON tc.constraint_name = kcu.constraint_name
                          AND tc.table_schema = kcu.table_schema
                        JOIN information_schema.constraint_column_usage AS ccu
                          ON ccu.constraint_name = tc.constraint_name
                          AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1
                `, [tableName]);

                schemas.push({
                    name: tableName,
                    comment: table.comment || '',
                    columns: colsRes.rows.map(c => ({
                        name: c.column_name,
                        type: c.data_type,
                        length: c.character_maximum_length ? c.character_maximum_length.toString() : undefined,
                        nullable: c.is_nullable === 'YES',
                        pk: pks.has(c.column_name),
                        defaultValue: c.column_default,
                        comment: c.comment || ''
                    })),
                    indexes: idxRes.rows.map(i => {
                        const cols = Array.isArray(i.columns) 
                            ? i.columns 
                            : (typeof i.columns === 'string' 
                                ? i.columns.replace(/[{}]/g, '').split(',').filter(Boolean) 
                                : []);
                        return {
                            name: i.index_name,
                            columns: cols,
                            unique: i.is_unique
                        };
                    }),
                    foreignKeys: fkRes.rows.map(f => ({
                        name: f.constraint_name,
                        column: f.column_name,
                        refTable: f.foreign_table_name,
                        refColumn: f.foreign_column_name
                    }))
                });
            }

            return schemas;

        } catch (error) {
            console.error('Schema fetch error:', error);
            throw error;
        } finally {
            await client.end();
        }
    }

    private static async fetchMySQLSchema(config: any): Promise<TableSchema[]> {
        const conn = await mysql.createConnection({
            host: config.host,
            port: parseInt(config.port) || 3306,
            user: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: false } : undefined
        });

        try {
            // Tables
            const [tables] = await conn.execute<any[]>(
                `SELECT TABLE_NAME as table_name, TABLE_COMMENT as comment 
                 FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = ? 
                 ORDER BY TABLE_NAME`, [config.database]);

            const schemas: TableSchema[] = [];
            for (const t of tables) {
                const tableName = t.table_name;
                // Columns
                const [cols] = await conn.execute<any[]>(
                    `SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, CHARACTER_MAXIMUM_LENGTH as char_len, 
                            IS_NULLABLE as is_nullable, COLUMN_DEFAULT as column_default, COLUMN_COMMENT as comment, COLUMN_KEY as column_key
                     FROM information_schema.COLUMNS
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                     ORDER BY ORDINAL_POSITION`, [config.database, tableName]);

                // Indexes
                const [idxs] = await conn.execute<any[]>(
                    `SELECT INDEX_NAME as index_name, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as columns, 
                            NON_UNIQUE as non_unique
                     FROM information_schema.STATISTICS
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
                     GROUP BY INDEX_NAME, NON_UNIQUE`, [config.database, tableName]);

                // Foreign Keys
                const [fks] = await conn.execute<any[]>(
                    `SELECT CONSTRAINT_NAME as constraint_name, COLUMN_NAME as column_name, 
                            REFERENCED_TABLE_NAME as foreign_table_name, REFERENCED_COLUMN_NAME as foreign_column_name
                     FROM information_schema.KEY_COLUMN_USAGE
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`, [config.database, tableName]);

                const pkSet = new Set<string>();
                cols.forEach(c => {
                    if (c.column_key === 'PRI') pkSet.add(c.column_name);
                });

                schemas.push({
                    name: tableName,
                    comment: t.comment || '',
                    columns: cols.map(c => ({
                        name: c.column_name,
                        type: c.data_type,
                        length: c.char_len ? String(c.char_len) : undefined,
                        nullable: c.is_nullable === 'YES',
                        pk: pkSet.has(c.column_name),
                        defaultValue: c.column_default,
                        comment: c.comment || ''
                    })),
                    indexes: idxs.map(i => ({
                        name: i.index_name,
                        columns: (i.columns || '').split(',').filter(Boolean),
                        unique: i.non_unique === 0
                    })),
                    foreignKeys: fks.map(f => ({
                        name: f.constraint_name,
                        column: f.column_name,
                        refTable: f.foreign_table_name,
                        refColumn: f.foreign_column_name
                    }))
                });
            }

            return schemas;
        } catch (error) {
            console.error('MySQL schema fetch error:', error);
            throw error;
        } finally {
            await conn.end();
        }
    }

    static async fetchTableData(config: any, tableName: string, page: number = 1, pageSize: number = 20): Promise<{ items: any[], total: number }> {
        const safe = /^[a-zA-Z0-9_]+$/.test(tableName);
        if (!safe) throw new Error('Invalid table name');
        const size = Math.max(1, Math.min(pageSize || 20, 100));
        const offset = Math.max(0, (page - 1) * size);
        if (config.type === 'mysql') {
            const conn = await mysql.createConnection({
                host: config.host,
                port: parseInt(config.port) || 3306,
                user: config.username,
                password: config.password,
                database: config.database,
                ssl: config.ssl ? { rejectUnauthorized: false } : undefined
            });
            try {
                // choose order column
                const [cols] = await conn.execute<any[]>(
                    `SELECT COLUMN_NAME as column_name 
                     FROM information_schema.COLUMNS 
                     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [config.database, tableName]);
                const names = new Set(cols.map(c => c.column_name));
                const orderCol = names.has('created_at') ? 'created_at' : (names.has('id') ? 'id' : null);
                const orderClause = orderCol ? `ORDER BY \`${orderCol}\` DESC` : '';
                const [rows] = await conn.query(`SELECT * FROM \`${tableName}\` ${orderClause} LIMIT ? OFFSET ?`, [size, offset]);
                const [countRows] = await conn.query<any[]>(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
                const total = (Array.isArray(countRows) ? countRows[0]?.cnt : 0) || 0;
                return { items: Array.isArray(rows) ? rows : [], total };
            } finally {
                await conn.end();
            }
        } else {
            const client = new Client({
                host: config.host,
                port: parseInt(config.port) || 5432,
                database: config.database || 'postgres',
                user: config.username || 'postgres',
                password: config.password,
                ssl: { rejectUnauthorized: false }
            });
            try {
                await client.connect();
                const colsRes = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = $1
                `, [tableName]);
                const names = new Set(colsRes.rows.map(r => r.column_name));
                const orderCol = names.has('created_at') ? 'created_at' : (names.has('id') ? 'id' : null);
                const orderClause = orderCol ? `ORDER BY "${orderCol}" DESC` : '';
                const dataRes = await client.query(`SELECT * FROM "${tableName}" ${orderClause} LIMIT $1 OFFSET $2`, [size, offset]);
                const countRes = await client.query(`SELECT COUNT(*)::int as cnt FROM "${tableName}"`);
                const total = countRes.rows[0]?.cnt || 0;
                return { items: dataRes.rows, total };
            } finally {
                await client.end();
            }
        }
    }
}
