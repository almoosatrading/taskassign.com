import React, { useState, useEffect } from 'react';
import {
  Bell,
  Globe,
  Users,
  Shield,
  Briefcase,
  UserCheck,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { Language, NotificationItem, User } from '../types';
import { translations } from '../i18n/translations';
import { RoleBadge } from './Badge';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (user: User) => void;
  language: Language;
  onToggleLanguage: () => void;
  notifications: NotificationItem[];
  onMarkNotificationsRead: () => void;
  onSelectTaskFromNotif?: (taskId: string) => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  language,
  onToggleLanguage,
  notifications = [],
  onMarkNotificationsRead,
  onSelectTaskFromNotif,
  onSignOut,
}) => {
  const t = translations[language];
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Live Asia/Riyadh Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
        timeZone: 'Asia/Riyadh',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
      setCurrentTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-emerald-900/10">
              {language === 'ar' ? 'م' : 'M'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
                  {language === 'ar' ? 'شركة الموسى التجارية' : 'AlMoosa Trading Company'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold tracking-wider uppercase">
                  HR Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ar' ? 'بوابة تكليف ومتابعة مهام العمل الداخلية' : 'Internal Task Assignment & Workflow Platform'}
              </p>
            </div>
          </div>

          {/* Right Controls: Timezone, Language, Notifications, Active Persona */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Asia/Riyadh Live AST Clock */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{currentTime || 'AST'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">AST (UTC+3)</span>
            </div>

            {/* Language Switcher */}
            <button
              onClick={onToggleLanguage}
              aria-label="Switch Language / تغيير اللغة"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notifications"
                className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  className={`absolute ${
                    language === 'ar' ? 'left-0' : 'right-0'
                  } mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50`}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{t.notifications}</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkNotificationsRead}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {t.markAllRead}
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-500">{t.noNotifications}</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.taskId && onSelectTaskFromNotif) {
                              onSelectTaskFromNotif(n.taskId);
                              setNotifOpen(false);
                            }
                          }}
                          className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                            n.read
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700/60'
                              : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {language === 'ar' ? n.titleAr : n.title}
                            </span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" />}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                            {language === 'ar' ? n.messageAr : n.message}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                            <span>
                              {new Date(n.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {n.taskId && (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                {t.viewDetails} <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Switch User Persona"
                className="flex items-center gap-2.5 p-1 sm:pr-3 sm:pl-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50 transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-500/20"
                />
                <div className="hidden sm:block text-start">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {language === 'ar' ? currentUser.nameAr : currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight flex items-center gap-1">
                    <RoleBadge role={currentUser.role} lang={language} />
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div
                  className={`absolute ${
                    language === 'ar' ? 'left-0' : 'right-0'
                  } mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50`}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{t.activeUser}</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ar'
                        ? 'اختر شخصية وظيفية لاختبار الصلاحيات وتدفقات المهام'
                        : 'Switch persona to test role scopes, task delegation & privacy'}
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {allUsers.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-start transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {language === 'ar' ? u.nameAr : u.name}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {language === 'ar' ? u.jobTitleAr : u.jobTitle} • {u.employeeId}
                              </div>
                            </div>
                          </div>
                          <RoleBadge role={u.role} lang={language} />
                        </button>
                      );
                    })}
                  </div>

                  {onSignOut && (
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تسجيل الخروج الآمن' : 'Secure Sign Out'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Sign Out Header Button */}
            {onSignOut && (
              <button
                onClick={onSignOut}
                title={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                aria-label={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
