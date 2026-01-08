import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
// Fix: Correct the path to the firebase service since AuthComponent is at the root
import { auth } from './services/firebase'; 

const AuthComponent: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  // 現在ログインしているユーザー情報を保持 (auth.currentUser でアクセス可能)
  const user = auth.currentUser; // これだけではリアルタイム更新されないので注意

  // リアルタイムでログイン状態を監視するためのhooks (オプション、より良いUXのため)
  const [currentUser, setCurrentUser] = useState<any | null>(null); // Firebase User型
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // クリーンアップ
  }, []);


  const handleSignUp = async () => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('サインアップが成功しました！');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
      console.error("サインアップエラー:", err);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('ログインが成功しました！');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
      console.error("ログインエラー:", err);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut(auth);
      alert('ログアウトしました。');
    } catch (err: any) {
      setError(err.message);
      console.error("ログアウトエラー:", err);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
      <h2>アカウント管理</h2>
      {currentUser ? (
        <div>
          <p>ようこそ、{currentUser.email} さん！</p>
          <button onClick={handleSignOut}>ログアウト</button>
        </div>
      ) : (
        <div>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '5px', padding: '8px' }}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '5px', padding: '8px' }}
          />
          <br />
          <button onClick={handleSignUp} style={{ margin: '5px', padding: '8px' }}>サインアップ</button>
          <button onClick={handleSignIn} style={{ margin: '5px', padding: '8px' }}>ログイン</button>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AuthComponent;