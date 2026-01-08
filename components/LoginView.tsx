import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Check, User, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigValid } from '../services/firebase';
import Spinner from './Spinner';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigValid) {
      setError('Firebaseの設定が完了していません。apiKeyをservices/firebase.tsに設定してください。');
      return;
    }

    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください。');
      return;
    }
    if (isRegisterMode && !name) {
      setError('名前を入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        // --- Firebase新規登録 ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestoreにユーザープロフィールを保存
        const profileData = {
          name,
          email,
          createdAt: new Date().toISOString(),
          height: '', weight: '', age: '', skinType: '普通肌', hairStyle: 'マッシュ', concerns: ''
        };
        
        await setDoc(doc(db, "users", user.uid), profileData);
        
        // ローカルストレージにも保存（Geminiのコンテキスト用）
        localStorage.setItem('akanuke_user_profile', JSON.stringify(profileData));
        
        completeLogin();
      } else {
        // --- Firebaseログイン ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Firestoreからプロフィールを取得
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          localStorage.setItem('akanuke_user_profile', JSON.stringify(userDoc.data()));
        }

        completeLogin();
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error("Auth error:", err);
      
      // 日本語のエラーメッセージに変換
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に登録されています。');
          break;
        case 'auth/invalid-email':
          setError('メールアドレスの形式が正しくありません。');
          break;
        case 'auth/weak-password':
          setError('パスワードが短すぎます（6文字以上必要です）。');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('メールアドレスまたはパスワードが間違っています。');
          break;
        default:
          setError('エラーが発生しました。時間を置いて再度お試しください。');
      }
    }
  };

  const completeLogin = () => {
    setIsLoading(false);
    setIsSuccess(true);
    localStorage.setItem('akanuke_session', 'active'); // アプリ全体のログインフラグ
    setTimeout(() => {
      onLogin();
    }, 800);
  };

  const handleGuestLogin = () => {
    const guestProfile = {
      name: 'ゲスト',
      height: '', weight: '', age: '', skinType: '普通肌', hairStyle: 'マッシュ', concerns: ''
    };
    localStorage.setItem('akanuke_user_profile', JSON.stringify(guestProfile));
    localStorage.setItem('akanuke_session', 'guest');
    onLogin();
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-white p-8 justify-center max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-gray-50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10"></div>

      <div className="mb-10 animate-fadeIn">
        <h1 className="text-4xl font-black italic tracking-tighter mb-2 text-primary whitespace-pre-line">
          {isRegisterMode ? 'WELCOME\nBRO.' : 'AKANUKE\nBRO.'}
        </h1>
        <p className="text-sm text-gray-400 font-bold">
          {isRegisterMode ? 'アカウントを作成して垢抜けよう' : 'ファッション診断 & コーデ提案アプリ'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
        {isRegisterMode && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 ml-1">お名前（ニックネーム）</label>
            <div className="flex items-center border border-gray-200 rounded-sm px-3 py-3 bg-gray-50 focus-within:bg-white focus-within:border-primary transition-colors">
              <User size={18} className="text-gray-400 mr-3" />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="アニキ"
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1">メールアドレス</label>
          <div className="flex items-center border border-gray-200 rounded-sm px-3 py-3 bg-gray-50 focus-within:bg-white focus-within:border-primary transition-colors">
            <Mail size={18} className="text-gray-400 mr-3" />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 ml-1">パスワード</label>
          <div className="flex items-center border border-gray-200 rounded-sm px-3 py-3 bg-gray-50 focus-within:bg-white focus-within:border-primary transition-colors">
            <Lock size={18} className="text-gray-400 mr-3" />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start text-red-500 text-xs font-bold bg-red-50 p-3 rounded-sm">
            <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className={`w-full py-4 rounded-sm font-bold text-sm text-white flex items-center justify-center transition-all duration-300 shadow-lg ${
              isSuccess ? 'bg-green-500 scale-95' : 'bg-primary hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {isLoading ? <Spinner /> : isSuccess ? <Check size={18} /> : (
              <div className="flex items-center gap-2">
                <span>{isRegisterMode ? 'アカウントを作成' : 'ログインして始める'}</span>
                <ArrowRight size={16} />
              </div>
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center animate-fadeIn space-y-6">
        <div>
          <p className="text-xs text-gray-400 mb-2">
            {isRegisterMode ? 'すでにアカウントをお持ちの方' : 'アカウントをお持ちでない方'}
          </p>
          <button onClick={toggleMode} className="text-sm font-bold text-primary border-b border-primary pb-0.5">
            {isRegisterMode ? 'ログインはこちら' : '新規登録はこちら'}
          </button>
        </div>

        {!isRegisterMode && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative bg-white px-2 text-[10px] text-gray-400">または</span>
            </div>
            <button onClick={handleGuestLogin} className="text-xs font-bold text-gray-500 flex items-center justify-center gap-2 mx-auto bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
              <User size={14} /> ゲストとして利用する
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginView;