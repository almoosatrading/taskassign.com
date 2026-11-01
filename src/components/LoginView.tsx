import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Shield,
  Briefcase,
  User as UserIcon,
  AlertCircle,
  Clock,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Building,
} from 'lucide-react';
import { Language, User, AccountStatus } from '../types';
import { translations } from '../i18n/translations';
import { apiClient } from '../api/client';

interface LoginViewProps {
  language: Language;
  onLoginSuccess: (user: User) => void;
  onToggleLanguage: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  language,
  onLoginSuccess,
  onToggleLanguage,
}) => {
  const t = translations[language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Status-specific blocks
  const [pendingApprovalUser, setPendingApprovalUser] = useState<User | null>(null);
  const [restrictedStatus, setRestrictedStatus] = useState<AccountStatus | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPendingApprovalUser(null);
    setRestrictedStatus(null);
    setLoading(true);

    try {
      const data = await apiClient.login(email.trim(), password.trim());
      onLoginSuccess(data.user);
    } catch (err: any) {
      if (err.accountStatus === 'PENDING_APPROVAL') {
        setPendingApprovalUser(err.user);
      } else if (err.code === 'AccountInactive') {
        setRestrictedStatus(err.accountStatus);
      } else {
        setErrorMessage(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
    setPendingApprovalUser(null);
    setRestrictedStatus(null);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header with Language Switch */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-emerald-950">
            {language === 'ar' ? 'م' : 'M'}
          </div>
          <div>
            <span className="font-extrabold text-sm text-white tracking-tight block">
              {language === 'ar' ? 'شركة الموسى التجارية' : 'AlMoosa Trading Company'}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">HR Task Management</span>
          </div>
        </div>

        <button
          onClick={onToggleLanguage}
          className="px-3 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-xs text-slate-300 font-semibold bg-slate-800/80 transition-colors cursor-pointer"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      {/* Main Container Card */}
      <div className="max-w-md w-full mx-auto z-10 my-auto pt-6">
        {/* PENDING APPROVAL SCREEN */}
        {pendingApprovalUser ? (
          <div className="bg-slate-800/90 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PENDING_APPROVAL
              </span>
              <h2 className="text-xl font-bold text-white mt-3">{t.pendingApprovalTitle}</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t.pendingApprovalDesc}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 text-xs text-start space-y-1">
              <div className="text-slate-400">
                Applicant: <strong className="text-white">{pendingApprovalUser.name}</strong>
              </div>
              <div className="text-slate-400">
                Employee ID: <strong className="text-white font-mono">{pendingApprovalUser.employeeId}</strong>
              </div>
              <div className="text-slate-400">
                Designation: <strong className="text-white">{pendingApprovalUser.jobTitle}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">{t.pendingNoticeCheckLater}</p>

            <button
              onClick={() => {
                setPendingApprovalUser(null);
                setPassword('');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t.backToLogin}
            </button>
          </div>
        ) : restrictedStatus ? (
          /* DEACTIVATED / SUSPENDED SCREEN */
          <div className="bg-slate-800/90 border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur text-center space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {restrictedStatus}
              </span>
              <h2 className="text-xl font-bold text-white mt-3">{t.accountRestrictedTitle}</h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t.accountRestrictedDesc}
              </p>
            </div>

            <p className="text-xs text-slate-400 p-3 rounded-xl bg-slate-900/60 border border-slate-700">
              {t.contactHRAdmin}
            </p>

            <button
              onClick={() => {
                setRestrictedStatus(null);
                setPassword('');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              {t.backToLogin}
            </button>
          </div>
        ) : (
          /* LOGIN FORM */
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-6">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {t.loginTitle}
              </h1>
              <p className="text-xs text-slate-400 mt-1">{t.loginSubtitle}</p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className={`w-full py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">{t.password}</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute top-3 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={`w-full py-2.5 rounded-xl text-xs bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t.loading}</span>
                ) : (
                  <>
                    <span>{t.signIn}</span>
                    {language === 'ar' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins for Fast Role Evaluation */}
            <div className="mt-6 pt-5 border-t border-slate-700/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                {t.demoAccountsTitle}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('almoosatradinghrd@gmail.com', 'Sairam009$')}
                  className="p-2 rounded-xl border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 mx-auto mb-1 text-purple-400" />
                  <span className="block text-[11px] font-bold">{t.loginAsAdmin}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('s.otaibi@almoosa.com.sa', 'Manager123!')}
                  className="p-2 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                  <span className="block text-[11px] font-bold">{t.loginAsManager}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('a.mansoor@almoosa.com.sa', 'Employee123!')}
                  className="p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 text-xs font-semibold text-center transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                  <span className="block text-[11px] font-bold">{t.loginAsEmployee}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-start relative shadow-2xl">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <KeyRound className="w-8 h-8 text-emerald-400 mb-2" />
            <h3 className="text-base font-bold text-white">{t.forgotPasswordTitle}</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">{t.forgotPasswordDesc}</p>

            {forgotSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-200 text-xs font-semibold text-center">
                Check your company inbox for the password reset instructions.
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@almoosa.com.sa"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  {t.sendResetLink}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 z-10 pt-4">
        AlMoosa Trading Company • Internal Systems • All Rights Reserved © 2026
      </div>
    </div>
  );
};
