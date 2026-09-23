import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Lock,
  Sparkles
} from 'lucide-react';

export default function AuthScreen({ onLoginSuccess, initialError = '' }) {
  const [googleClientId, setGoogleClientId] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);

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
              /* CHƯA CÓ GOOGLE CLIENT ID: CHỈ HIỂN THỊ THÔNG BÁO */
              <div className="w-full">
                <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-center">
                  <div className="flex items-center justify-center gap-2 font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Chưa cấu hình Google Client ID</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
                    Hệ thống chưa được thiết lập Google Client ID trong biến môi trường máy chủ. Vui lòng cấu hình trên bảng điều khiển máy chủ để đăng nhập.
                  </p>
                </div>
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
