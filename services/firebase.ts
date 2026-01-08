import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
// 実際の本番環境では Firebase コンソールから取得した値に置き換えてください。
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // ここを書き換えるまではプレビューモード
  authDomain: "grownnitan-df55f.firebaseapp.com",
  projectId: "grownnitan-df55f",
  storageBucket: "grownnitan-df55f.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// 設定が有効かどうかをチェック
export const isFirebaseConfigValid = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

let auth: any;
let db: any;
let storage: any;

try {
  // すでにアプリが初期化されていないか確認
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization skipped or failed. Using demo mode.", error);
  // 初期化に失敗してもアプリが死なないように最低限のエクスポートを維持
}

export { auth, db, storage };