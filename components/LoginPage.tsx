
import React, { useEffect, useMemo, useState } from 'react';
import { LayoutGrid, Lock, Mail, ArrowRight, Loader2, Globe, Eye, EyeOff } from 'lucide-react';
import { useAuth, useToast, useSettings } from '../contexts';

export const LoginPage: React.FC = () => {
  const { login, sendLoginCode, loginWithCode } = useAuth();
  const { addToast } = useToast();
  const { language, setLanguage } = useSettings();
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@restosuite.com');
  const [password, setPassword] = useState('TEngine@12');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'password' | 'code'>('password');
  const [sendingCode, setSendingCode] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  const t = {
    en: {
      subtitle: 'RestoSuite Internal Intent Hub',
      email: 'Email Address',
      password: 'Password',
      code: 'Email Verification Code',
      codePlaceholder: '8 chars: letters + numbers + symbols',
      signIn: 'Sign In',
      copyright: '© 2024 RestoSuite Inc. All rights reserved.',
      secure: 'Secure Internal System. Unauthorized access is prohibited.',
      fillAlert: 'Please fill in all fields',
      welcome: 'Welcome back to T-Engine',
      fail: 'Login failed',
      loading: 'Authenticating...',
      useCode: 'Use email code',
      usePassword: 'Use password',
      sendCode: 'Send Code',
      sending: 'Sending...',
      codeSent: 'Code sent. Please check your inbox.',
      codeInvalid: 'Invalid code format',
    },
    zh: {
      subtitle: 'RestoSuite 内部业务意图中枢',
      email: '企业邮箱',
      password: '密码',
      code: '邮箱验证码',
      codePlaceholder: '8位：字母+数字+特殊符号',
      signIn: '登录系统',
      copyright: '© 2024 Resto (RestoSuite) 版权所有',
      secure: '内部核心资产，严禁未经授权访问与截图',
      fillAlert: '请填写所有必填项',
      welcome: '欢迎回来，引擎已就绪',
      fail: '登录失败，请检查凭证',
      loading: '正在验证身份...',
      useCode: '使用验证码登录',
      usePassword: '使用密码登录',
      sendCode: '发送验证码',
      sending: '发送中...',
      codeSent: '验证码已发送，请查收邮箱',
      codeInvalid: '验证码格式不正确',
    }
  };

  const text = t[language];

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds(s => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const isCodeFormatValid = useMemo(() => {
    if (!code) return false;
    if (code.length !== 8) return false;
    const hasLetter = /[A-Za-z]/.test(code);
    const hasDigit = /[0-9]/.test(code);
    const hasSpecial = /[!@#$%^&*]/.test(code);
    const onlyAllowed = /^[A-Za-z0-9!@#$%^&*]{8}$/.test(code);
    return hasLetter && hasDigit && hasSpecial && onlyAllowed;
  }, [code]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast(text.fillAlert, 'error');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      addToast(text.welcome, 'success');
    } catch (err) {
      console.error('Login error details:', err);
      // Extract message from error if possible
      const rawMsg = (err as Error).message;
      const msg = rawMsg.replace('Login failed: ', '');
      addToast(msg || text.fail, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!email) {
      addToast(text.fillAlert, 'error');
      return;
    }
    if (sendingCode || resendSeconds > 0) return;
    setSendingCode(true);
    try {
      await sendLoginCode(email);
      addToast(text.codeSent, 'success');
      setResendSeconds(60);
    } catch (err) {
      const rawMsg = (err as Error).message;
      const msg = rawMsg.replace('Login failed: ', '');
      addToast(msg || text.fail, 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleLoginWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      addToast(text.fillAlert, 'error');
      return;
    }
    if (!isCodeFormatValid) {
      addToast(text.codeInvalid, 'error');
      return;
    }
    setLoading(true);
    try {
      await loginWithCode(email, code);
      addToast(text.welcome, 'success');
    } catch (err) {
      const rawMsg = (err as Error).message;
      const msg = rawMsg.replace('Login failed: ', '');
      addToast(msg || text.fail, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Subtle mesh gradient base */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08),rgba(255,255,255,0)_50%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15),rgba(15,23,42,0)_50%)]" />
          
          {/* Animated Orbs */}
          <div 
            className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-indigo-300/30 dark:bg-indigo-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" 
            style={{ animationDuration: '8s' }}
          />
          <div 
            className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-purple-300/30 dark:bg-purple-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" 
            style={{ animationDuration: '10s', animationDelay: '1s' }}
          />
          <div 
            className="absolute top-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" 
            style={{ animationDuration: '12s', animationDelay: '2s' }}
          />
      </div>

      {/* Language Toggle (Top Right) */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-400 hover:border-indigo-500 transition-colors text-sm font-medium shadow-sm"
        >
          <Globe size={14} />
          <span>{language === 'zh' ? 'EN' : '中文'}</span>
        </button>
      </div>

      <div className="w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 bg-indigo-600/90 backdrop-blur-sm rounded-2xl text-white mb-4 shadow-xl shadow-indigo-500/30">
            <LayoutGrid size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">T-Engine</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{text.subtitle}</p>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-800 p-8 ring-1 ring-black/5 dark:ring-white/5">
          
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('password');
                setCode('');
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${mode === 'password' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-500'}`}
            >
              {text.usePassword}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('code');
                setPassword('');
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${mode === 'code' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-500'}`}
            >
              {text.useCode}
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{text.email}</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="name@restosuite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{text.password}</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{text.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{text.signIn}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginWithCode} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{text.email}</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    placeholder="name@restosuite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">{text.code}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 font-mono"
                    placeholder={text.codePlaceholder}
                    maxLength={8}
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || resendSeconds > 0}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-slate-800/50 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {sendingCode ? text.sending : (resendSeconds > 0 ? `${resendSeconds}s` : text.sendCode)}
                  </button>
                </div>
                {!!code && !isCodeFormatValid && (
                  <div className="text-xs text-red-500/90">{text.codeInvalid}</div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !email || !isCodeFormatValid}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>{text.loading}</span>
                  </>
                ) : (
                  <>
                    <span>{text.signIn}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 space-y-2">
          <p>{text.copyright}</p>
          <p className="opacity-70">{text.secure}</p>
        </div>
      </div>
    </div>
  );
};
