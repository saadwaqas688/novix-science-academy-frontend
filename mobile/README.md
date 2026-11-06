# Novix Academy — Android app

A small Capacitor wrapper that opens https://novixscienceacademy.netlify.app inside an Android app.
Because it loads the live website, every website update shows in the app automatically — no new APK needed.

The APK is built by GitHub Actions (`.github/workflows/android-apk.yml`) and saved to
`public/downloads/novix-academy.apk`, which the website's **Download App** button serves.

Rebuild: GitHub → Actions → "Android APK" → Run workflow (or change anything in `mobile/`).
Signing key: repository secrets `ANDROID_KEYSTORE_B64` and `ANDROID_KEYSTORE_PASSWORD` (alias `novix`).
Keep a backup of the keystore — updates must be signed with the same key.
