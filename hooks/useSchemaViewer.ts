import { useState, useEffect, useMemo } from 'react';
import { api } from '../client';
import { useTranslation } from './useTranslation';
import { TableSchema } from '../types';

export const useSchemaViewer = () => {
  const { t, language } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'schema' | 'data' | 'script'>('schema');
  
  // Data State
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [rows, setRows] = useState<any[]>([]);
  const [rowsPage, setRowsPage] = useState(1);
  const [rowsPageSize, setRowsPageSize] = useState(20);
  const [rowsTotal, setRowsTotal] = useState(0);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const fetchSchema = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const data = await api.database.getSchema();
          setTables(data.tables || []);
          
          if (data.tables && data.tables.length > 0 && !selectedTable) {
             // Optional: Auto select first
          }
      } catch (err: any) {
          console.error(err);
          setError(err.message || 'Unknown error occurred');
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      fetchSchema();
  }, []);

  useEffect(() => {
    const fetchRows = async () => {
      if (!selectedTable || rightTab !== 'data') return;
      setRowsLoading(true);
      setRowsError(null);
      try {
        const body = await api.database.getTableData(selectedTable, rowsPage, rowsPageSize);
        setRows(body.items || []);
        setRowsTotal(body.total || 0);
      } catch (e: any) {
        setRowsError(e.message || 'Failed to load data');
        setRows([]);
        setRowsTotal(0);
      } finally {
        setRowsLoading(false);
      }
    };
    fetchRows();
  }, [selectedTable, rightTab, rowsPage, rowsPageSize]);

  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return tables;
    const lowerTerm = searchTerm.toLowerCase();
    return tables.filter(table => {
      const matchTableName = table.name.toLowerCase().includes(lowerTerm);
      const matchComment = table.comment.toLowerCase().includes(lowerTerm);
      const matchColumn = table.columns.some(col => 
        col.name.toLowerCase().includes(lowerTerm) || 
        col.comment.toLowerCase().includes(lowerTerm)
      );
      return matchTableName || matchComment || matchColumn;
    });
  }, [searchTerm, tables]);

  const activeTable = tables.find(t => t.name === selectedTable);

  return {
    t,
    language,
    searchTerm,
    setSearchTerm,
    selectedTable,
    setSelectedTable,
    rightTab,
    setRightTab,
    tables,
    isLoading,
    error,
    fetchSchema,
    rows,
    rowsPage,
    setRowsPage,
    rowsPageSize,
    setRowsPageSize,
    rowsTotal,
    rowsLoading,
    rowsError,
    filteredTables,
    activeTable
  };
};
