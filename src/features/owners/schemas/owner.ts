import { z } from "zod";

export const ownerSchema = z.object({
  name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  lineId: z.string().optional(),
  facebook: z.string().optional(),
  google: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  photoUrl: z.string().optional(),
  
  // ข้อมูลสัตว์เลี้ยง
  petName: z.string().min(1, "กรุณาระบุชื่อสัตว์เลี้ยง"),
  petSpecies: z.string().min(1, "กรุณาระบุชนิด (เช่น หมา, แมว)"),
  petBreed: z.string().optional(),
  petPhotoUrl: z.string().optional(),
});

export type OwnerFormValues = z.infer<typeof ownerSchema>;
