// src/components/UserProfile.tsx

import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Fix: Correct the path to the firebase service since UserProfile is at the root
import { auth, db } from './services/firebase'; 

const UserProfile: React.FC = () => {
  const [nickname, setNickname] = useState('');
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ログインユーザーを監視
  const user = auth.currentUser; // リアルタイム更新されないので、onAuthStateChanged の使用を推奨
  // 簡略化のため、ここでは直接 auth.currentUser を参照します。
  // 実際には AuthComponent のように onAuthStateChanged で state を更新する方が良いです。

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      if (user) { // ユーザーがログインしている場合
        try {
          const userDocRef = doc(db, 'users', user.uid); // 'users'コレクションのユーザーIDドキュメント
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
            setNickname(docSnap.data()?.nickname || ''); // 既存のニックネームがあればセット
          } else {
            setProfileData(null);
            setNickname('');
          }
        } catch (err: any) {
          setError(err.message);
          console.error("ユーザープロフィール取得エラー:", err);
        }
      } else {
        setProfileData(null); // ログアウト中はプロフィールデータなし
        setNickname('');
      }
      setLoading(false);
    };

    fetchUserProfile();
    // user オブジェクトが変更されたら再実行 (ログイン/ログアウト時)
  }, [user]);

  const handleSaveProfile = async () => {
    setError(null);
    if (!user) {
      setError('ログインしていません。');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', user.uid);
      // setDoc はドキュメントが存在しない場合は作成し、存在する場合は上書きします
      await setDoc(userDocRef, {
        nickname: nickname,
        lastUpdated: new Date().toISOString(), // 更新日時を追加
        email: user.email // ユーザーのメールアドレスも保存
      }, { merge: true }); // merge: true で既存のフィールドは残し、指定したフィールドのみ更新
      alert('プロフィールを保存しました！');
      setProfileData({ nickname, email: user.email }); // ローカルのstateも更新
    } catch (err: any) {
      setError(err.message);
      console.error("プロフィール保存エラー:", err);
    }
  };

  if (loading) return <p>プロフィールを読み込み中...</p>;
  if (!user) return <p>ログインするとプロフィールを編集できます。</p>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
      <h2>{user.email} さんのプロフィール</h2>
      <div>
        <label>ニックネーム:</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={{ margin: '5px', padding: '8px' }}
        />
        <button onClick={handleSaveProfile} style={{ margin: '5px', padding: '8px' }}>保存</button>
      </div>
      {profileData && (
        <div>
          <p>現在のニックネーム: {profileData.nickname || '未設定'}</p>
          <p>登録メールアドレス: {profileData.email}</p>
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default UserProfile;