import { z } from "zod";

export const clinicSettingsSchema = z.object({
  clinicName: z.string().min(2, "ชื่อคลินิกต้องมีอย่างน้อย 2 ตัวอักษร"),
  phone: z.string().min(9, "เบอร์โทรศัพท์ไม่ถูกต้อง"),
  address: z.string().optional(),
  taxId: z.string().optional(),
  receiptHeader: z.string().optional(),
  logoUrl: z.string().optional(),
});

export type ClinicSettingsFormValues = z.infer<typeof clinicSettingsSchema>;

export const staffSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  displayName: z.string().min(2, "ชื่อพนักงานต้องมีอย่างน้อย 2 ตัวอักษร"),
  role: z.enum(["owner", "doctor", "reception", "groomer", "admin", "superadmin"]).default("reception"),
  isActive: z.boolean().default(true),
});

export type StaffFormValues = z.infer<typeof staffSchema>;
