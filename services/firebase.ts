import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
// 実際の設定値はユーザーが環境に合わせて更新することを想定
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// 設定が有効かどうかをチェック
const isFirebaseConfigValid = firebaseConfig.apiKey !== "...";

let app;
let db: any;

if (isFirebaseConfigValid) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else {
  console.warn("Firebase config is not set. Data will not be saved to Firestore.");
  // モックとしての振る舞い（エラー回避用）
  db = null;
}

export { db };