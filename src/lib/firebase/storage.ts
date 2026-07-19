import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * อัปโหลดรูปภาพไปยัง Firebase Storage
 * @param file ไฟล์รูปภาพที่ต้องการอัปโหลด
 * @param path พาทที่ต้องการเก็บใน Storage เช่น `pets/${petId}/profile.jpg`
 * @returns Promise<string> URL ของรูปภาพสำหรับนำไปบันทึกลง Firestore
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  if (!file) throw new Error("No file provided");
  
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
};
