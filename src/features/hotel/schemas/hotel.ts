import { z } from "zod";

export const hotelSchema = z.object({
  petId: z.string().min(1, "กรุณาเลือกแมวที่ต้องการฝาก"),
  checkIn: z.string().min(1, "กรุณาระบุวัน Check In"),
  checkOut: z.string().min(1, "กรุณาระบุวัน Check Out"),
  roomNumber: z.string().min(1, "กรุณาระบุห้องพัก"),
  food: z.string().optional(),
  medicine: z.string().optional(),
  medTime: z.string().optional(),
});

export type HotelFormValues = z.infer<typeof hotelSchema>;

export const dailyLogSchema = z.object({
  date: z.string(),
  eating: z.enum(["ดีมาก", "ปกติ", "น้อย", "ไม่กิน"]).default("ปกติ"),
  drinking: z.enum(["ดีมาก", "ปกติ", "น้อย", "ไม่กิน"]).default("ปกติ"),
  pooping: z.enum(["ก้อนดี", "เหลว", "ไม่ถ่าย"]).default("ก้อนดี"),
  playing: z.enum(["ร่าเริง", "ปกติ", "ซึม"]).default("ร่าเริง"),
  vomit: z.boolean().default(false),
  diarrhea: z.boolean().default(false),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export type DailyLogFormValues = z.infer<typeof dailyLogSchema>;
