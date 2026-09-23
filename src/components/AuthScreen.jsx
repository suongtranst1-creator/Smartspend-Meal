import React, { useEffect, useRef, useState } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  ExternalLink,
  Key,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function AuthScreen({ onLoginSuccess, initialError = '' }) {
  const [googleClientId, setGoogleClientId] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [inputClientId, setInputClientId] = useState('');
  const [isSavingClientId, setIsSavingClientId] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (initialError) {
      setErrorMessage(initialError);
    }
  }, [initialError]);

  // 1. Tải cấu hình từ Backend (/api/auth/config)
  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const res = await fetch('/api/auth/config');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const rawId = (data.googleClientId || '').trim();
            const isPlaceholder = !rawId || rawId.includes('your_client_id') || rawId.startsWith('your_');
            setGoogleClientId(isPlaceholder ? '' : rawId);
          }
        }
      } catch (err) {
        console.error('Không thể lấy cấu hình xác thực:', err);
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    }

    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Xử lý credential token từ Google Identity Services (GSI)
  const handleCredentialResponse = async (credential) => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        localStorage.removeItem('smartspend_token');
        localStorage.removeItem('smartspend_user');
        setErrorMessage(data.error || 'Đăng nhập không thành công.');
        return;
      }

      localStorage.setItem('smartspend_token', data.token);
      localStorage.setItem('smartspend_user', JSON.stringify(data.user));
      if (onLoginSuccess) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối máy chủ xác thực.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Khởi tạo Google Identity Services (GSI) khi có Google Client ID
  useEffect(() => {
    if (!googleClientId) return;

    let retryCount = 0;
    const maxRetries = 15;

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          const isDark = document.documentElement.classList.contains('dark');

          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (response) => {
              if (response?.credential) {
                handleCredentialResponse(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Render nút Đăng nhập bằng Google chính thức của Google GSI
          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            const cardPadding = window.innerWidth < 640 ? 64 : 80;
            const btnWidth = Math.min(320, Math.max(220, window.innerWidth - cardPadding));
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: isDark ? 'filled_black' : 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'signin_with',
              width: btnWidth,
              logo_alignment: 'left',
            });
          }

          // Kích hoạt Google One-Tap
          window.google.accounts.id.prompt();
        } catch (e) {
          console.error('Lỗi khởi tạo Google GSI:', e);
        }
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(initGoogleGsi, 300);
      }
    };

    initGoogleGsi();
  }, [googleClientId]);

  // Lưu Google Client ID vào .env thông qua API
  const handleSaveClientId = async (e) => {
    e.preventDefault();
    if (!inputClientId.trim()) return;

    setIsSavingClientId(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/save-client-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: inputClientId.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setGoogleClientId(data.googleClientId);
      } else {
        setErrorMessage(data.error || 'Không thể lưu Client ID.');
      }
    } catch (err) {
      setErrorMessage('Lỗi kết nối máy chủ khi lưu Client ID.');
    } finally {
      setIsSavingClientId(false);
    }
  };

  // Đăng nhập thử nghiệm nhanh
  const handleQuickBypass = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@gmail.com', name: 'Google User' }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('smartspend_token', data.token);
        localStorage.setItem('smartspend_user', JSON.stringify(data.user));
        if (onLoginSuccess) onLoginSuccess(data.user, data.token);
      }
    } catch (e) {
      setErrorMessage('Không thể đăng nhập thử nghiệm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/40">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-3xl p-8 sm:p-10 transition-all">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-4 group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-105 duration-300">
                <img
                  src="/Logo.png"
                  alt="SmartSpend & Meal Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              SmartSpend <span className="text-emerald-600 dark:text-emerald-400">& Meal</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
              Sổ Thu Chi & Thực Đơn Đi Chợ Tuần
            </p>
          </div>

          {/* Subtitle / Intro */}
          <div className="mb-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              Đăng nhập một chạm bằng tài khoản Google để truy cập và đồng bộ dữ liệu.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 animate-shake">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions Container */}
          <div className="flex flex-col items-center justify-center min-h-[70px]">
            {isSubmitting ? (
              <div className="flex flex-col items-center gap-2.5 py-4">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Đang xác thực với Google...
                </span>
              </div>
            ) : isLoadingConfig ? (
              <div className="flex items-center gap-2 py-4 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải cấu hình xác thực...</span>
              </div>
            ) : googleClientId ? (
              /* ĐÃ CÓ GOOGLE CLIENT ID: NÚT SIGN IN WITH GOOGLE CHÍNH THỨC CỦA GOOGLE GSI */
              <div className="w-full flex flex-col items-center">
                <div
                  ref={googleBtnRef}
                  id="googleSignInDiv"
                  className="flex justify-center w-full min-h-[44px]"
                />
              </div>
            ) : (
              /* CHƯA CÓ GOOGLE CLIENT ID: HƯỚNG DẪN CẤU HÌNH & NHẬP NHANH */
              <div className="w-full">
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 mb-5 text-left">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300 mb-1.5">
                    <Key className="w-4 h-4 text-emerald-600" />
                    <span>Cần cấu hình Google Client ID</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    Để kết nối Google OAuth 2.0 (mở cửa sổ <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1 py-0.5 rounded font-mono text-[10px]">accounts.google.com</code>), bạn cần dán <strong>Client ID</strong> từ Google Cloud Console vào đây:
                  </p>

                  <form onSubmit={handleSaveClientId} className="space-y-2">
                    <input
                      type="text"
                      required
                      value={inputClientId}
                      onChange={(e) => setInputClientId(e.target.value)}
                      placeholder="xxxxxx.apps.googleusercontent.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                    <button
                      type="submit"
                      disabled={isSavingClientId || !inputClientId.trim()}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingClientId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Lưu & Bật nút Đăng nhập Google</span>
                    </button>
                  </form>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showGuide ? 'Ẩn hướng dẫn' : 'Xem cách lấy Google Client ID'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickBypass}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    title="Vào thử nghiệm giao diện ngay lập tức"
                  >
                    Vào thử nghiệm ➔
                  </button>
                </div>

                {/* Hướng dẫn tạo Google Client ID từng bước */}
                {showGuide && (
                  <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-left text-[11px] text-gray-600 dark:text-gray-300 space-y-2">
                    <p className="font-bold text-gray-800 dark:text-gray-100">
                      Hướng dẫn lấy Client ID (chưa đầy 2 phút):
                    </p>
                    <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                      <li>
                        Truy cập <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-400 font-semibold underline">Google Cloud Console</a>.
                      </li>
                      <li>Tạo hoặc chọn Project của bạn.</li>
                      <li>
                        Vào mục <strong>Credentials</strong> &gt; bấm <strong>Create Credentials</strong> &gt; chọn <strong>OAuth client ID</strong>.
                      </li>
                      <li>
                        Chọn Application type: <strong>Web application</strong>.
                      </li>
                      <li>
                        Tại mục <strong>Authorized JavaScript origins</strong>, thêm:
                        <br />
                        <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">http://localhost:5000</code>
                        <br />
                        <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">http://localhost:5173</code>
                      </li>
                      <li>
                        Bấm <strong>Create</strong>, sau đó copy chuỗi <strong>Client ID</strong> dán vào ô trên (hoặc vào file <code className="bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[10px]">.env</code>).
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700/40 pt-4">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>SmartSpend & Meal - Đồng bộ dữ liệu an toàn</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
