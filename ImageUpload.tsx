// src/components/ImageUpload.tsx

import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// Fix: Import 'db' from the correct relative path
import { auth, storage, db } from './services/firebase'; 
import { doc, updateDoc } from 'firebase/firestore'; // Firestoreを使ってプロフィール画像のURLを保存するため

const ImageUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = auth.currentUser; // ログインユーザー

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    setError(null);
    if (!user) {
      setError('画像をアップロードするにはログインしてください。');
      return;
    }
    if (!selectedFile) {
      setError('ファイルを選択してください。');
      return;
    }

    setUploading(true);
    try {
      // Storageに保存する場所を定義 (例: user_profiles/{ユーザーID}/profile_picture.jpg)
      const storageRef = ref(storage, `user_profiles/${user.uid}/profile_picture.jpg`);

      // ファイルをアップロード
      const snapshot = await uploadBytes(storageRef, selectedFile);
      console.log('アップロードが成功しました！');

      // アップロードしたファイルのダウンロードURLを取得
      const downloadURL = await getDownloadURL(snapshot.ref);
      setImageUrl(downloadURL);
      alert('画像をアップロードし、URLを取得しました！');

      // Firestoreのユーザープロフィールに画像URLを保存 (オプション)
      // これにより、ユーザーのプロフィールデータを読み込む際に画像URLも一緒に取得できるようになります
      // Fix: db is now available through the updated import above
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        profilePictureUrl: downloadURL
      });
      console.log('プロフィール画像URLをFirestoreに保存しました。');

    } catch (err: any) {
      setError(err.message);
      console.error("ファイルのアップロードエラー:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px', borderRadius: '8px' }}>
      <h2>プロフィール画像をアップロード</h2>
      {user ? (
        <div>
          <input type="file" onChange={handleFileChange} accept="image/*" />
          <button onClick={handleUpload} disabled={uploading || !selectedFile} style={{ margin: '5px', padding: '8px' }}>
            {uploading ? 'アップロード中...' : '画像をアップロード'}
          </button>
          {imageUrl && (
            <div>
              <p>画像アップロード成功！</p>
              <img src={imageUrl} alt="プロフィール画像" style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '10px' }} />
              <p>URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a></p>
            </div>
          )}
        </div>
      ) : (
        <p>画像をアップロードするにはログインしてください。</p>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ImageUpload;