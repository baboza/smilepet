import { z } from "zod";

export const opdSchema = z.object({
  petId: z.string().min(1, "กรุณาเลือกระบุสัตว์ป่วย"),
  chiefComplaint: z.object({
    items: z.array(z.string()),
    others: z.string().optional(),
  }),
  physicalExam: z.object({
    weight: z.string().min(1, "กรุณาระบุน้ำหนัก (กก.)"),
    general: z.enum(["Bright", "Depressed", "Coma"]).optional(),
    crt: z.enum(["<2 sec", "2 sec", ">2 sec"]).optional(),
    hydration: z.enum(["5%", "7%", "10%"]).optional(),
    temperature: z.enum(["Normal", "High", "Low"]).optional(),
    heartRate: z.enum(["Normal", "High", "Low"]).optional(),
    respiration: z.enum(["Normal", "High", "Low"]).optional(),
    painScore: z.number().min(0).max(5).optional(),
    bcs: z.number().min(1).max(9).optional(),
    bodySystem: z.object({
      Eye: z.boolean().default(false),
      Ear: z.boolean().default(false),
      Nose: z.boolean().default(false),
      Skin: z.boolean().default(false),
      Oral: z.boolean().default(false),
      Lung: z.boolean().default(false),
      Heart: z.boolean().default(false),
      Abdomen: z.boolean().default(false),
      LymphNode: z.boolean().default(false),
      Musculoskeletal: z.boolean().default(false),
      Neurologic: z.boolean().default(false),
      Other: z.boolean().default(false),
      OtherDetail: z.string().optional(),
    }).optional(),
  }),
  diagnosis: z.array(z.string()).optional(),
  diagnosisOthers: z.string().optional(),
  treatment: z.object({
    Injection: z.boolean().default(false),
    Fluid: z.boolean().default(false),
    Medication: z.boolean().default(false),
    Xray: z.boolean().default(false),
    Ultrasound: z.boolean().default(false),
    CBC: z.boolean().default(false),
    BloodChemistry: z.boolean().default(false),
    Hospitalization: z.boolean().default(false),
    Surgery: z.boolean().default(false),
    Prescription: z.boolean().default(false),
  }).optional(),
});

export type OpdFormValues = z.infer<typeof opdSchema>;
