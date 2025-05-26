# Fridge Management – Frontend

> Egy mobilalkalmazás frontendje hűtők, termékek, receptek, bevásárlólisták és családi megosztás kezelésére.  
> Ionic + Angular + Capacitor alapokon, WebSocket és OpenAPI támogatással.

---

## 📦 Alap telepítés

> Telepítsd a szükséges csomagokat:

```
npm install --legacy-peer-deps
npm install -g @ionic/cli
npm install ws // csak ha WebSocket hibát ír a szerveren
npm install -g @openapitools/openapi-generator-cli
```

---

## 🔄 OpenAPI kliens generálás

> A biztosított OpenAPI YAML alapján generálódnak a service-ek:

```
npm run generate:swagger
```

---

## 🧪 Fejlesztői szerver indítása

> Lokális fejlesztéshez:

```
npm run serve:dev
```

vagy

```
ionic serve --configuration=development
```

---

## 📱 Android build

> Natív mobilalkalmazás fordítása Androidra:

```
ionic capacitor build android
```

---

## 🧪 Prism mock szerver indítása

> A backend nélküli teszteléshez használhatsz Prism mock szervert:

```
cd ./src/app/openapi/
prism mock openapi.yaml
```

---

## 🚀 Production mód build

> Production környezetre való build:

```
npm run generate:swagger
ionic serve --configuration=production
```

vagy

```
ionic capacitor build android
```

---

## ⚙️ Használt főbb technológiák

> Az alkalmazás az alábbi technológiákra épül:

- `@angular/core`, `@ionic/angular`
- `@capacitor/android`, `@capacitor/barcode-scanner`, `@capacitor/local-notifications`
- `socket.io-client` – WebSocket alapú családi csevegéshez
- `openapi-generator-cli` – OpenAPI definíciók alapján generált service-ek

---

### 📱 Android natív működéshez szükséges plusz lépések

- Szükséges jogosultságok beállítása az `android/app/src/main/AndroidManifest.xml` fájlban:
  - `INTERNET` (hálózati kommunikációhoz)
  - `CAMERA` (vonalkód olvasáshoz)
  - `POST_NOTIFICATIONS` (értesítésekhez, Android 13+)
- Példa jogosultságok:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.CAMERA" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  

