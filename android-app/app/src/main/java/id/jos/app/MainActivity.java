package id.jos.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.ValueCallback;
import android.webkit.JavascriptInterface;
import org.json.JSONObject;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 501;
    private static final String HOME = "https://jasaorangsuruhan.my.id/";
    private WebView webView;
    private ValueCallback<Uri[]> uploadCallback;
    private FrameLayout appRoot;
    private View splashOverlay;
    private boolean firstPageLoaded = false;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 59, 53));
        getWindow().setNavigationBarColor(Color.rgb(241, 241, 241));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        FrameLayout root = new FrameLayout(this);
        appRoot = root;
        root.setBackgroundColor(Color.WHITE);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.WHITE);
        webView.setVisibility(View.VISIBLE);
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

        webView.addJavascriptInterface(new JosAndroidBridge(), "JosAndroid");

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) {
                if (!firstPageLoaded) {
                    firstPageLoaded = true;
                    if (splashOverlay != null) {
                        View overlay = splashOverlay;
                        overlay.animate().alpha(0f).setDuration(260).withEndAction(() -> {
                            if (appRoot != null) appRoot.removeView(overlay);
                            splashOverlay = null;
                        }).start();
                    }
                }
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
        splashOverlay = createJosSplash();
        root.addView(splashOverlay, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        setContentView(root);

        if (savedInstanceState == null) webView.loadUrl(HOME);
        else {
            webView.restoreState(savedInstanceState);
            if (webView.getUrl() == null) webView.loadUrl(HOME);
        }
    }


    // Full-screen native splash: official JOS artwork is used unchanged.
    // Only the surrounding glass panel, lighting and depth effects are styled.
    private View createJosSplash() {
        FrameLayout scene = new FrameLayout(this);
        GradientDrawable backdrop = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{Color.rgb(4, 105, 207), Color.rgb(226, 244, 255), Color.rgb(10, 126, 225)});
        scene.setBackground(backdrop);

        View halo = new View(this);
        GradientDrawable haloBg = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{0x00FFFFFF, 0x66FFFFFF, 0x00FFFFFF});
        haloBg.setShape(GradientDrawable.OVAL);
        halo.setBackground(haloBg);
        FrameLayout.LayoutParams haloLp = new FrameLayout.LayoutParams(dp(330), dp(330), Gravity.CENTER);
        haloLp.topMargin = dp(10);
        scene.addView(halo, haloLp);

        FrameLayout platform = new FrameLayout(this);
        GradientDrawable platformBg = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{0xEEFFFFFF, 0xCCDBF2FF, 0xF8FFFFFF});
        platformBg.setCornerRadius(dp(34));
        platformBg.setStroke(dp(2), 0xAAFFFFFF);
        platform.setBackground(platformBg);
        platform.setElevation(dp(28));
        platform.setTranslationZ(dp(12));

        ImageView logo = new ImageView(this);
        logo.setImageResource(id.jos.app.R.drawable.jos_pwa_splash);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setAdjustViewBounds(true);
        FrameLayout.LayoutParams logoLp = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT);
        int inset = dp(22);
        logoLp.setMargins(inset, inset, inset, inset);
        platform.addView(logo, logoLp);

        FrameLayout.LayoutParams panelLp = new FrameLayout.LayoutParams(dp(310), dp(310), Gravity.CENTER);
        scene.addView(platform, panelLp);

        return scene;
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private class JosAndroidBridge {
        @JavascriptInterface
        public void openChat() {
            runOnUiThread(() -> {
                if (webView != null) {
                    // Keep the same WebView browsing context so the website can
                    // transfer the active Supabase session before navigating to chat.
                    webView.evaluateJavascript(
                        "(function(){if(window.josOpenChatFromNative){window.josOpenChatFromNative();}"
                        + "else{window.location.href='" + HOME + "chat.html';}})();",
                        null
                    );
                }
            });
        }

        @JavascriptInterface
        public void openGoogleAuth(String url) {
            try {
                Uri target = Uri.parse(url);
                String host = target.getHost() == null ? "" : target.getHost().toLowerCase();
                if (!"https".equals(target.getScheme()) || !host.endsWith(".supabase.co")) return;
                runOnUiThread(() -> {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, target)); }
                    catch (Exception ignored) {}
                });
            } catch (Exception ignored) {}
        }
    }

    @Override protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Uri callback = intent == null ? null : intent.getData();
        if (callback != null && "josapp".equals(callback.getScheme())
                && "auth".equals(callback.getHost()) && "/callback".equals(callback.getPath())) {
            final String callbackUrl = callback.toString();
            if (webView != null) {
                webView.post(() -> webView.evaluateJavascript(
                    "if(window.josHandleNativeGoogleCallback){window.josHandleNativeGoogleCallback("
                    + JSONObject.quote(callbackUrl) + ");}", null));
            }
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
