import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  Terminal,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { AuditLog, Language, User } from '../types';
import { translations } from '../i18n/translations';
import { RoleBadge } from './Badge';
import { formatRiyadhDateTime } from '../utils/rbac';

interface AuditLogViewerProps {
  logs: AuditLog[];
  currentUser: User;
  language: Language;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs, currentUser, language }) => {
  const t = translations[language];
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filterCategory !== 'ALL' && log.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const match =
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.actionAr.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.detailsAr.toLowerCase().includes(q) ||
        log.ipAddress.includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Category', 'Status', 'IP', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.category,
      l.status,
      l.ipAddress,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `almoosa_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            {t.auditLogsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.auditLogsSubtitle}</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-600" />
          <span>{t.exportLogs}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter logs by actor, action, IP or details..."
            className={`w-full py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-xs ${
              language === 'ar' ? 'pr-9 pl-4' : 'pl-9 pr-4'
            }`}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="AUTH">Authentication (AUTH)</option>
          <option value="TASK">Task Assignments (TASK)</option>
          <option value="DIRECTORY">Employee Directory (DIRECTORY)</option>
          <option value="SECURITY">Privacy & RBAC Checks (SECURITY)</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUCCESS">Authorized / Success Only</option>
          <option value="DENIED">Access Denied Only</option>
        </select>
      </div>

      {/* Log Entries List */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-4 py-3 text-start">{t.auditTimestamp}</th>
                <th className="px-4 py-3 text-start">{t.auditActor}</th>
                <th className="px-4 py-3 text-start">{t.auditAction}</th>
                <th className="px-4 py-3 text-start">{t.auditDetails}</th>
                <th className="px-4 py-3 text-start">{t.auditIP}</th>
                <th className="px-4 py-3 text-end">{t.auditFilterStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-mono">
              {filteredLogs.map((log) => {
                const isDenied = log.status === 'DENIED';
                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                      isDenied ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatRiyadhDateTime(log.timestamp, language, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{log.actorName}</span>
                        <RoleBadge role={log.actorRole} lang={language} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-700 dark:text-slate-300 max-w-md">
                      {language === 'ar' ? log.detailsAr : log.details}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="px-4 py-3 text-end">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isDenied
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isDenied ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {t.auditDenied}
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {t.auditSuccess}
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
