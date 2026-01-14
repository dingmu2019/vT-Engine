import React, { useMemo } from 'react';
import { Copy, FileCode } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css'; // Using a dark theme which usually looks good for code

// Helper to highlight code
const HighlightedCode = ({ code }: { code: string }) => {
    const html = useMemo(() => {
        return Prism.highlight(code, Prism.languages.sql, 'sql');
    }, [code]);

    return (
        <code 
            className="language-sql"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

interface TableSchemaProps {
    name: string;
    comment: string;
    columns: ColumnSchema[];
    indexes: IndexSchema[];
    foreignKeys: ForeignKeySchema[];
}

interface ColumnSchema {
    name: string;
    type: string;
    length?: string;
    nullable: boolean;
    pk: boolean;
    defaultValue?: string | null;
    comment: string;
}

interface IndexSchema {
    name: string;
    columns: string[];
    unique: boolean;
}

interface ForeignKeySchema {
    name: string;
    column: string;
    refTable: string;
    refColumn: string;
}

interface Props {
    table: TableSchemaProps;
    t: (key: string) => string;
    onCopy: (text: string) => void;
}

export const TableSqlScript: React.FC<Props> = ({ table, t, onCopy }) => {
    const sql = useMemo(() => {
        if (!table) return '';

        const lines: string[] = [];
        
        // 1. CREATE TABLE
        lines.push(`-- Table: ${table.name}`);
        if (table.comment) {
            lines.push(`-- Comment: ${table.comment}`);
        }
        lines.push('');
        lines.push(`CREATE TABLE "${table.name}" (`);
        
        const colDefs = table.columns.map((col, index) => {
            let line = `  "${col.name}" ${col.type}`;
            
            if (col.length) {
                // Some types need length, some don't, simplistic approach:
                if (['varchar', 'char', 'character varying'].includes(col.type.toLowerCase())) {
                    line += `(${col.length})`;
                }
            }
            
            if (!col.nullable) {
                line += ' NOT NULL';
            }

            if (col.defaultValue !== undefined && col.defaultValue !== null) {
                line += ` DEFAULT ${col.defaultValue}`;
            }
            
            return line;
        });

        // Add PK constraint
        const pks = table.columns.filter(c => c.pk).map(c => `"${c.name}"`);
        if (pks.length > 0) {
            colDefs.push(`  CONSTRAINT "${table.name}_pkey" PRIMARY KEY (${pks.join(', ')})`);
        }

        lines.push(colDefs.join(',\n'));
        lines.push(');');
        lines.push('');

        // 2. Column Comments (Postgres style)
        const commentedCols = table.columns.filter(c => c.comment);
        if (commentedCols.length > 0) {
            lines.push('-- Column Comments');
            commentedCols.forEach(col => {
                lines.push(`COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${col.comment.replace(/'/g, "''")}';`);
            });
            lines.push('');
        }

        // 3. Table Comment
        if (table.comment) {
             lines.push(`COMMENT ON TABLE "${table.name}" IS '${table.comment.replace(/'/g, "''")}';`);
             lines.push('');
        }

        // 4. Indexes
        if (table.indexes.length > 0) {
            lines.push('-- Indexes');
            table.indexes.forEach(idx => {
                const uniqueStr = idx.unique ? 'UNIQUE ' : '';
                const cols = idx.columns.map(c => `"${c}"`).join(', ');
                lines.push(`CREATE ${uniqueStr}INDEX "${idx.name}" ON "${table.name}" (${cols});`);
            });
            lines.push('');
        }

        // 5. Foreign Keys
        if (table.foreignKeys.length > 0) {
            lines.push('-- Foreign Keys');
            table.foreignKeys.forEach(fk => {
                lines.push(`ALTER TABLE "${table.name}" ADD CONSTRAINT "${fk.name}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.refTable}" ("${fk.refColumn}");`);
            });
            lines.push('');
        }

        return lines.join('\n');
    }, [table]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center shrink-0">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FileCode size={18} className="text-indigo-600" />
                    {t('databaseSchema.scriptTab')}
                </div>
                <button
                    onClick={() => onCopy(sql)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                >
                    <Copy size={14} />
                    {t('databaseSchema.copyScript')}
                </button>
            </div>
            <div className="flex-1 overflow-auto relative group bg-[#2d2d2d]">
                <pre className="p-6 text-sm font-mono leading-relaxed whitespace-pre overflow-x-auto min-w-full">
                    <HighlightedCode code={sql} />
                </pre>
            </div>
        </div>
    );
};
