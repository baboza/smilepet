import { z } from "zod";

export const groomingSchema = z.object({
  petId: z.string().min(1, "กรุณาเลือกสัตว์เลี้ยง"),
  bookingDate: z.string(),
  status: z.enum(["รอดำเนินการ", "กำลังทำ", "เสร็จแล้ว"]).default("รอดำเนินการ"),
  services: z.object({
    bath: z.boolean().default(false),
    haircut: z.boolean().default(false),
    nailTrim: z.boolean().default(false),
    earClean: z.boolean().default(false),
    analGland: z.boolean().default(false),
    teethBrushing: z.boolean().default(false),
    fleaTick: z.boolean().default(false),
    spa: z.boolean().default(false),
  }),
  photos: z.object({
    before: z.array(z.string()).optional(),
    after: z.array(z.string()).optional(),
  }).optional(),
  price: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export type GroomingFormValues = z.infer<typeof groomingSchema>;
