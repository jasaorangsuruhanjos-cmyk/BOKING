import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

(async function installJosAndroidGoogleOAuthBridge() {
  if (!Capacitor.isNativePlatform()) return;

  const button = () => document.getElementById('josCustomerGoogleLogin');
  const message = (text, bad = false) => {
    const el = document.getElementById('josCustomerAuthMsg');
    if (el) {
      el.textContent = text;
      el.style.color = bad ? '#a12626' : '#07569a';
    }
  };

  let callbackBusy = false;
  await App.addListener('appUrlOpen', async ({ url }) => {
    if (!url || !url.startsWith('josapp://auth/callback')) return;
    if (callbackBusy) return;
    callbackBusy = true;
    try {
      try { await Browser.close(); } catch (_) {}
      const callback = new URL(url);
      const oauthError = callback.searchParams.get('error_description') || callback.searchParams.get('error');
      if (oauthError) throw new Error(oauthError);

      const code = callback.searchParams.get('code');
      if (!code) throw new Error('Kode callback Google tidak ditemukan. Silakan coba login kembali.');

      const { data, error } = await josDb.auth.exchangeCodeForSession(code);
      if (error) throw error;
      const user = data?.user || data?.session?.user;
      if (!user) throw new Error('Sesi Google belum berhasil dibuat. Silakan coba lagi.');

      const resolved = await josResolveGoogleCustomer(user);
      if (!resolved) throw new Error('Akun Google ini sudah terdaftar sebagai Mitra/Admin atau bukan akun pelanggan JOS.');

      history.replaceState(null, '', location.pathname + '#akun');
      document.querySelectorAll('.portal-layer').forEach(x => x.classList.remove('open'));
      document.getElementById('josPortalCustomer')?.classList.add('open');
      if (typeof setJosPageStatus === 'function') setJosPageStatus('Akun');
      document.querySelectorAll('.bottom .nav').forEach(btn => btn.classList.toggle('active', btn.dataset.nav === 'Akun'));
      josPortalTab('customer');
      await josShowRole(resolved, 'customer');
      message('Login Google berhasil.');
    } catch (err) {
      message('Login Google gagal: ' + (err?.message || 'Silakan coba lagi.'), true);
    } finally {
      callbackBusy = false;
      const btn = button();
      if (btn) btn.disabled = false;
    }
  });

  const btn = button();
  if (!btn) return;
  btn.onclick = async function () {
    btn.disabled = true;
    message('Menghubungkan ke Google...');
    try {
      const { data, error } = await josDb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'josapp://auth/callback',
          skipBrowserRedirect: true
        }
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Tautan login Google tidak diterima dari Supabase.');
      await Browser.open({ url: data.url });
    } catch (err) {
      message('Login Google gagal: ' + (err?.message || 'Silakan coba lagi.'), true);
      btn.disabled = false;
    }
  };
})().catch(err => {
  console.error('JOS Android OAuth bridge:', err);
  const el = document.getElementById('josCustomerAuthMsg');
  if (el) el.textContent = 'Login Google belum siap: ' + (err?.message || 'Silakan muat ulang aplikasi.');
});