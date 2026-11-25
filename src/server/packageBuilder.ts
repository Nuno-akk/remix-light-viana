import fs from 'node:fs';
import path from 'node:path';
import {ZipBuilder} from './zipBuilder.ts';

const SKIP_DIRS = new Set(['node_modules', '.git', '.vite', 'dist-ssr', '.data']);

function assertInsideRoot(rootDir: string, candidatePath: string): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedCandidate = path.resolve(candidatePath);
  if (
    resolvedCandidate !== resolvedRoot &&
    !resolvedCandidate.startsWith(resolvedRoot + path.sep)
  ) {
    throw new Error(`Unsafe path outside workspace root: ${candidatePath}`);
  }
  return resolvedCandidate;
}

function collectFiles(
  rootDir: string,
  currentDir: string,
  zipPrefix: string,
  zip: ZipBuilder,
): void {
  const safeDir = assertInsideRoot(rootDir, currentDir);
  if (!fs.existsSync(safeDir)) return;

  const entries = fs.readdirSync(safeDir, {withFileTypes: true});
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(safeDir, entry.name);
    const relTarget = zipPrefix ? `${zipPrefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      collectFiles(rootDir, fullPath, relTarget, zip);
    } else if (entry.isFile()) {
      const stat = fs.statSync(fullPath);
      const data = fs.readFileSync(fullPath);
      zip.addFile(relTarget, data, stat.mtime);
    }
  }
}

export function ensureBuiltDist(rootDir: string): string {
  const distDir = assertInsideRoot(rootDir, path.join(rootDir, 'dist'));
  const indexHtml = path.join(distDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    throw new Error('Production dist bundle not found. Run npm run build first.');
  }
  const html = fs.readFileSync(indexHtml, 'utf8');
  const hasDevEntryScript = /<script\b[^>]*src=["']\/src\/main\.tsx["']/i.test(html);
  if (hasDevEntryScript || !html.includes('data-lightviana-bundle="true"')) {
    throw new Error(
      'dist/index.html is not a standalone self-contained build. Re-run npm run build.',
    );
  }
  return distDir;
}

function buildOpenAppWindowBat(): string {
  return `@echo off
setlocal
cd /d "%~dp0"
if exist "dist\\index.html" (
  start "" "%~dp0dist\\index.html"
) else (
  start "" "%~dp0index.html"
)
`;
}

function buildWindowsReadme(): string {
  return `====================================================================
  LightViana DMX - Windows Package
====================================================================

OPTION 1 — INSTANT STANDALONE MODE (NO INSTALL REQUIRED)
  1. Extract this entire ZIP folder anywhere on your PC.
  2. Double-click "Open-LightViana-AppWindow.bat" OR "dist\\index.html"
     (opening root "index.html" will also redirect automatically to "dist\\index.html").
  3. Works 100% offline directly from the folder in Chrome / Edge / Firefox:
     all presets, scenes, banks, stage visualizer, audio BPM sync, and
     backup/factory-reset features work immediately.

OPTION 2 — FULL HOST SERVER (ART-NET UDP DMX + WI-FI ANDROID TABLET SYNC)
  1. Ensure Node.js 22+ is installed (https://nodejs.org/).
  2. Double-click "Start-LightViana-Windows.bat".
  3. On first run, it installs dependencies if needed and starts the
     local server on http://localhost:3000 with Art-Net (UDP 6454), RDM
     autodiscovery, and WebSocket multi-device sync for Android tablets.
  4. If Windows Defender Firewall prompts, allow access on Private/Local networks.
`;
}

function buildAndroidTabletLauncherHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <title>LightViana DMX — Android & Tablet Launcher</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: radial-gradient(circle at top, #131c31 0%, #090c12 70%);
        color: #f1f5f9;
      }
      .card {
        width: 100%;
        max-width: 520px;
        background: rgba(16, 22, 36, 0.96);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
      }
      h1 { margin: 0 0 6px; font-size: 20px; font-weight: 700; color: #fff; }
      p { margin: 0 0 18px; font-size: 13px; line-height: 1.5; color: #94a3b8; }
      .btn {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: center;
        padding: 13px 16px;
        border-radius: 10px;
        border: none;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }
      .btn-primary { background: #38bdf8; color: #090c12; margin-bottom: 16px; }
      .btn-secondary { background: rgba(56, 189, 248, 0.14); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); }
      .box {
        background: #0b101b;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 14px;
      }
      label { display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: #090c12;
        color: #fff;
        font-size: 14px;
        margin-bottom: 10px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>LightViana DMX — Android &amp; Tablet</h1>
      <p>
        Launch the full standalone lighting console directly on this Android device, or connect over Wi-Fi to your Windows Host server for real-time Art-Net DMX output.
      </p>

      <a class="btn btn-primary" href="./www/index.html?mode=tablet">
        Open Standalone Console (Offline / Tablet Mode)
      </a>

      <div class="box">
        <label for="hostIp">Windows Host IP &amp; Port (Wi-Fi Live Sync)</label>
        <input id="hostIp" type="text" placeholder="192.168.1.100:3000" value="192.168.1.100:3000" />
        <label for="roomCode">Show Room Code</label>
        <input id="roomCode" type="text" placeholder="MAIN-SHOW" value="MAIN-SHOW" />
        <button class="btn btn-secondary" type="button" onclick="connectHost()">
          Connect to Windows Host
        </button>
      </div>
    </main>

    <script>
      function connectHost() {
        var host = (document.getElementById('hostIp').value || '').trim().replace(/^https?:\\/\\//i, '').replace(/\\/+$/, '');
        var room = (document.getElementById('roomCode').value || 'MAIN-SHOW').trim().toUpperCase();
        if (!host) return;
        window.location.href = 'http://' + host + '/?room=' + encodeURIComponent(room) + '&mode=tablet';
      }
    </script>
  </body>
</html>
`;
}

function buildAndroidReadme(): string {
  return `====================================================================
  LightViana DMX - Android Package (Offline Console + APK Project)
====================================================================

OPTION 1 — RUN IMMEDIATELY ON ANY ANDROID PHONE / TABLET
  1. Extract this ZIP onto your Android device (e.g. Downloads/LightViana-DMX).
  2. Open "www/index.html" or "LightViana-Tablet-Launcher.html" in Chrome
     or Edge on Android for full standalone touch control.
  3. OR, if running LightViana Host on Windows over the same Wi-Fi,
     scan the QR code from Network Sync in Chrome on Android and tap
     "Add to Home Screen" / "Install App" to install the PWA natively.

OPTION 2 — BUILD A NATIVE ANDROID APK (ANDROID STUDIO)
  1. Open the included folder "android-studio-project" in Android Studio
     (Iguana / Jellyfish / Koala or newer, JDK 17).
  2. Let Gradle sync, then run Build -> Build Bundle(s) / APK(s) -> Build APK(s).
  3. Install the generated APK onto any Android 8.0+ tablet or phone.
     The APK bundles the complete compiled LightViana console offline inside
     assets/www/ and supports microphone permissions for BPM beat sync.
`;
}

export function buildWindowsPackageZip(rootDir: string): Buffer {
  const distDir = ensureBuiltDist(rootDir);
  const zip = new ZipBuilder();

  // Standalone compiled build (works via file:// double-click or static server)
  collectFiles(rootDir, distDir, 'dist', zip);

  // Root entry + launchers
  const rootFiles = [
    'index.html',
    'Start-LightViana-Windows.bat',
    'server.ts',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    '.env.example',
    'metadata.json',
  ];

  for (const rel of rootFiles) {
    const full = assertInsideRoot(rootDir, path.join(rootDir, rel));
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      zip.addFile(rel, fs.readFileSync(full), fs.statSync(full).mtime);
    }
  }

  const rootFavicon = assertInsideRoot(rootDir, path.join(rootDir, 'favicon.ico'));
  if (fs.existsSync(rootFavicon)) {
    zip.addFile('favicon.ico', fs.readFileSync(rootFavicon));
  }
  collectFiles(rootDir, path.join(rootDir, 'public'), 'public', zip);
  collectFiles(rootDir, path.join(rootDir, 'src'), 'src', zip);

  zip.addFile('Open-LightViana-AppWindow.bat', buildOpenAppWindowBat());
  zip.addFile('README-WINDOWS.txt', buildWindowsReadme());

  return zip.toBuffer();
}

export function buildAndroidPackageZip(rootDir: string): Buffer {
  const distDir = ensureBuiltDist(rootDir);
  const zip = new ZipBuilder();

  // Direct standalone offline web bundle for Android browsers / file managers
  collectFiles(rootDir, distDir, 'www', zip);
  zip.addFile('LightViana-Tablet-Launcher.html', buildAndroidTabletLauncherHtml());
  zip.addFile('README-ANDROID.txt', buildAndroidReadme());

  // Complete Android Studio Gradle WebView wrapper project embedding the compiled console
  const androidPrefix = 'android-studio-project';
  collectFiles(
    rootDir,
    distDir,
    `${androidPrefix}/app/src/main/assets/www`,
    zip,
  );

  zip.addFile(
    `${androidPrefix}/settings.gradle.kts`,
    `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "LightVianaDMX"
include(":app")
`,
  );

  zip.addFile(
    `${androidPrefix}/build.gradle.kts`,
    `plugins {
    id("com.android.application") version "8.5.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.24" apply false
}
`,
  );

  zip.addFile(
    `${androidPrefix}/gradle.properties`,
    `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
`,
  );

  zip.addFile(
    `${androidPrefix}/app/build.gradle.kts`,
    `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.lightviana.dmx"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.lightviana.dmx"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
}
`,
  );

  zip.addFile(
    `${androidPrefix}/app/src/main/AndroidManifest.xml`,
    `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.LightVianaDMX"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:screenOrientation="sensorLandscape">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
  );

  zip.addFile(
    `${androidPrefix}/app/src/main/res/values/strings.xml`,
    `<resources>
    <string name="app_name">LightViana DMX</string>
</resources>
`,
  );

  zip.addFile(
    `${androidPrefix}/app/src/main/res/values/themes.xml`,
    `<resources>
    <style name="Theme.LightVianaDMX" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">#090C12</item>
        <item name="android:statusBarColor">#090C12</item>
        <item name="android:navigationBarColor">#090C12</item>
    </style>
</resources>
`,
  );

  zip.addFile(
    `${androidPrefix}/app/src/main/java/com/lightviana/dmx/MainActivity.kt`,
    `package com.lightviana.dmx

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.RECORD_AUDIO), 1001)
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    request.grant(request.resources)
                }
            }
        }

        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html?mode=tablet")
    }

    override fun onBackPressed() {
        if (this::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`,
  );

  return zip.toBuffer();
}
