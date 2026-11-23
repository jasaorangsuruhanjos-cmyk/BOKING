package id.jos.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.ValueCallback;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final String HOME = "https://jasaorangsuruhan.my.id/";
    private WebView webView;
    private ImageView splashView;
    private ValueCallback<Uri[]> uploadCallback;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 59, 53));
        getWindow().setNavigationBarColor(Color.rgb(241, 241, 241));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.WHITE);

        splashView = new ImageView(this);
        splashView.setImageResource(R.drawable.jos_pwa_splash_new);
        splashView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        splashView.setBackgroundColor(Color.WHITE);
        root.addView(splashView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setVisibility(View.INVISIBLE);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setSupportMultipleWindows(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                // Hide the website's PWA-install banner only inside this native APK.
                view.evaluateJavascript("(function(){"
                    + "var hideJosInstall=function(){"
                    + "document.querySelectorAll('body *').forEach(function(el){"
                    + "if(el.children.length===0 && /Pasang Aplikasi JOS|Akses layanan JOS lebih cepat langsung dari layar utama|Cara Instal/i.test(el.textContent||'')){"
                    + "var p=el; for(var i=0;i<6 && p && p!==document.body;i++){"
                    + "var r=p.getBoundingClientRect();"
                    + "if(r.width>window.innerWidth*0.60 && r.height>35){p.style.setProperty('display','none','important');break;}"
                    + "p=p.parentElement;}"
                    + "}"
                    + "});};"
                    + "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();},true);"
                    + "hideJosInstall();"
                    + "new MutationObserver(hideJosInstall).observe(document.documentElement,{childList:true,subtree:true});"
                    + "})();", null);
                webView.setVisibility(View.VISIBLE);
                splashView.animate().alpha(0f).setDuration(180).withEndAction(() -> {
                    splashView.setVisibility(View.GONE);
                }).start();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrl(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleUrl(Uri.parse(url));
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                    FileChooserParams params) {
                if (uploadCallback != null) uploadCallback.onReceiveValue(null);
                uploadCallback = callback;
                Intent intent = params.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    uploadCallback = null;
                    return false;
                }
            }
        });

        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (savedInstanceState == null) webView.loadUrl(HOME);
        else {
            webView.restoreState(savedInstanceState);
            if (webView.getUrl() == null) webView.loadUrl(HOME);
        }
    }

    private boolean handleUrl(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        if ("http".equals(scheme) || "https".equals(scheme)) {
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (host.equals("jasaorangsuruhan.my.id")
                    || host.equals("www.jasaorangsuruhan.my.id")
                    || host.endsWith(".supabase.co")) return false;
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
            return true;
        }
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) {}
        return true;
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && uploadCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            uploadCallback.onReceiveValue(result);
            uploadCallback = null;
        }
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (uploadCallback != null) uploadCallback.onReceiveValue(null);
        if (webView != null) { webView.destroy(); webView = null; }
        super.onDestroy();
    }
}
