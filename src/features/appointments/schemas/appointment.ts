import { z } from "zod";

export const appointmentSchema = z.object({
  petId: z.string().min(1, "กรุณาเลือกสัตว์เลี้ยง"),
  date: z.string().min(1, "กรุณาระบุวันที่นัดหมาย"),
  time: z.string().min(1, "กรุณาระบุเวลานัดหมาย"),
  doctorId: z.string().optional(),
  type: z.enum(["ตรวจรักษาทั่วไป", "วัคซีน", "กำจัดเห็บหมัด", "ถ่ายพยาธิ", "ผ่าตัด", "Follow up", "อื่นๆ"]).default("ตรวจรักษาทั่วไป"),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
