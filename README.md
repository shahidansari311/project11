# Silver Real Estate Platform

Welcome to the Silver Real Estate Platform! This repository contains both the Node.js/Express Backend and the React Native (Expo) Mobile App. 

The system features a highly secure, banking-grade authentication architecture utilizing JWT Access Tokens, Stateful Refresh Token Rotation, Device Fingerprinting, and native Keystore/Keychain encryption.

---

## 🏗️ Repository Structure
- `/backend` - Express.js API, Prisma ORM, PostgreSQL (via Supabase).
- `/mobile_app` - React Native (Expo Router) app, styled with NativeWind/Tailwind.

---

## 🛠️ Prerequisites
Before you begin, ensure you have the following installed on your local machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Expo Go App** (installed on your iOS/Android physical device for mobile testing)

---

## 🚀 1. Backend Setup

The backend handles all OTP generation, token rotation, and database interactions.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of the `backend` folder and add the following keys:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://<user>:<password>@<supabase-host>:5432/postgres"
   JWT_SECRET="your_super_secret_jwt_key_here"
   JWT_EXPIRES_IN="15m"
   REFRESH_TOKEN_EXPIRES_IN="7d"

   # Demo Credentials for fast local testing
   DEMO_USER_PHONE="8858369783"
   DEMO_USER_OTP="120905"
   DEMO_ADMIN_PHONE="9876543210"
   DEMO_ADMIN_OTP="509021"
   ```

4. **Sync the Database:**
   Generate the Prisma client and push the schema to your PostgreSQL database.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:4000`. Keep this terminal open.*

---

## 📱 2. Mobile App Setup

The frontend is an Expo-powered React Native application.

1. **Navigate to the mobile app directory:**
   *(Open a new terminal window)*
   ```bash
   cd mobile_app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Find your local IPv4 network address (e.g., `192.168.29.92`). **Do not use `localhost`**, as the physical mobile device cannot resolve your computer's `localhost`.
   
   Create a `.env` file in the root of the `mobile_app` folder:
   ```env
   EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:4000/api/v1
   ```

4. **Start the Expo Server:**
   ```bash
   npx expo start
   ```
   *Scan the QR code that appears in the terminal using the Expo Go app on your physical device.*

---

## 🔒 Authentication Flow & Testing

This project uses a highly secure, OTP-based login system without relying on passwords.

### How to Test Login/Registration
1. Open the mobile app.
2. Enter the **Demo User Phone**: `8858369783`.
3. Tap **Send OTP**.
4. Enter the **Demo OTP**: `120905` and tap Verify.

### How to Test with a Random Number
1. Enter **any 10-digit number** (e.g., `9998887776`).
2. Tap **Send OTP**.
3. Look at your **Backend Terminal Window**. The server will generate a real OTP and log it to the console:
   `[DEVELOPMENT] OTP for User 9998887776: 482910`
4. Type that exact OTP into the mobile app to verify.

### 🧠 Under the Hood (For Developers)
- **Access Tokens:** The mobile app receives a fast, 15-minute JWT Access Token.
- **Refresh Tokens:** The backend stores a 7-day Refresh Token tied strictly to a generated `x-device-id`. 
- **Auto-Refresh Interceptor:** If the Access Token expires, the mobile app's Axios interceptor (`mobile_app/src/utils/api.ts`) automatically catches the `401 Unauthorized` error, grabs the encrypted Refresh Token from `expo-secure-store`, requests a new pair of tokens from the backend, and silently retries the failed request. The user never experiences a logout!
