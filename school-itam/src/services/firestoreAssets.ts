import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  getDocs
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { Asset } from '../types/asset';

const COLLECTION_NAME = 'school_itam_assets';

/**
 * Firestore는 undefined 값을 허용하지 않습니다.
 * 객체에서 undefined 필드를 재귀적으로 제거합니다.
 */
function sanitizeAsset(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === undefined) continue; // undefined 필드 완전 제거
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = sanitizeAsset(val); // 중첩 객체 재귀 처리
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Firestore에서 자산 목록을 실시간 구독(Listen)합니다.
 */
export function subscribeToFirestoreAssets(
  onUpdate: (assets: Asset[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  try {
    const assetsRef = collection(db, COLLECTION_NAME);
    const q = query(assetsRef);

    return onSnapshot(
      q,
      (snapshot) => {
        const assets: Asset[] = [];
        snapshot.forEach((docSnap) => {
          assets.push(docSnap.data() as Asset);
        });
        onUpdate(assets);
      },
      (err) => {
        console.error('Firestore Realtime Sync Error:', err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    console.error('Subscribe to Firestore failed:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * 단일 자산을 Firestore에 저장/업데이트합니다.
 * undefined 필드를 자동 제거하여 Firestore 오류 방지.
 */
export async function saveAssetToFirestore(asset: Asset): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, asset.id);
    await setDoc(docRef, sanitizeAsset(asset), { merge: true });
  } catch (err: any) {
    console.error('saveAssetToFirestore failed:', err);
    throw err;
  }
}

/**
 * 단일 자산을 Firestore에서 삭제합니다.
 */
export async function deleteAssetFromFirestore(assetId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, assetId);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error('deleteAssetFromFirestore failed:', err);
    throw err;
  }
}

/**
 * 여러 자산을 일괄 저장(Batch Save)합니다.
 * undefined 필드를 자동 제거하여 Firestore 오류 방지.
 */
export async function batchSaveAssetsToFirestore(assets: Asset[]): Promise<void> {
  if (!isFirebaseConfigured || !db || assets.length === 0) return;

  try {
    // Firestore 배치 제한(500개) 처리
    const chunkSize = 450;
    for (let i = 0; i < assets.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = assets.slice(i, i + chunkSize);

      chunk.forEach((asset) => {
        const docRef = doc(db, COLLECTION_NAME, asset.id);
        batch.set(docRef, sanitizeAsset(asset), { merge: true });
      });

      await batch.commit();
    }
  } catch (err: any) {
    console.error('batchSaveAssetsToFirestore failed:', err);
    if (err.code === 'permission-denied' || err.message?.includes('permission')) {
      throw new Error('파이어베이스 데이터베이스 접근 권한이 제한되어 있습니다. Firebase 콘솔의 Firestore Rules(규칙) 탭에서 allow read, write: if true; 로 규칙을 변경해 주세요.');
    }
    throw err;
  }
}

/**
 * Firestore에서 모든 자산 목록을 1회성으로 불러옵니다 (복원 용도).
 */
export async function fetchAssetsFromFirestore(): Promise<Asset[]> {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const assetsRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(assetsRef);
    const assets: Asset[] = [];
    snapshot.forEach((docSnap) => {
      assets.push(docSnap.data() as Asset);
    });
    return assets;
  } catch (err: any) {
    console.error('fetchAssetsFromFirestore failed:', err);
    throw err;
  }
}

