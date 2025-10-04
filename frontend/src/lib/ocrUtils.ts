// src/lib/ocrUtils.ts

/**
 * กำหนดโครงสร้างข้อมูลสำหรับฟอร์มรถยนต์
 * ผมได้เพิ่ม `fuelType` เข้าไปให้ด้วย เพราะเป็นข้อมูลสำคัญที่มักจะได้จาก OCR ครับ
 */
export interface CarFormData {
  price: number;
  year?: number;
  mileage?: number;
  province?: string;
  color?: string;
  conditionRating?: number;
  seats?: number;
  doors?: number;
  brand?: string;
  model?: string;
  fuelType?: string; // ประเภทเชื้อเพลิง
}

/**
 * 🗺️ หัวใจหลัก: ตัวแปลง Key จาก OCR ไปเป็น Field ในฟอร์มของเรา
 * ผมได้รวบรวม Key ที่มักจะพบบ่อยที่สุดจากเล่มทะเบียนรถยนต์มาให้แล้ว
 * หาก Key ของคุณแตกต่างไปเล็กน้อย คุณสามารถแก้ไขแค่ในส่วนนี้ได้เลย
 */
const ocrToFormKeyMap: Record<string, keyof CarFormData> = {
  // --- ข้อมูลหลักของรถ ---
  brand_car: "brand",           // ยี่ห้อรถ (อาจจะเป็น "brand")
  model: "model",           // รุ่นรถ (อาจจะเป็น "model")
  year_model: "year",            // ปีรถ (อาจจะเป็น "year")
  color: "color",           // สี (อาจจะเป็น "color")

  // --- ข้อมูลการจดทะเบียน ---
  province: "province",       // จังหวัดที่จดทะเบียน

  // --- ข้อมูลทางเทคนิค ---
  number_of_seat: "seats",        // จำนวนที่นั่ง
  fuel_type_name: "fuelType",      // ประเภทเชื้อเพลิง (เช่น เบนซิน, ดีเซล)
  
};

/**
 * 🔧 ฟังก์ชันแปลงข้อความ OCR เป็น Object (ฉบับสมบูรณ์)
 * ฟังก์ชันนี้ถูกปรับให้ทำงานกับ `ocrToFormKeyMap` ด้านบนอย่างเต็มประสิทธิภาพ
 * ไม่จำเป็นต้องแก้ไขอะไรในฟังก์ชันนี้
 */
export const parseOcrData = (ocrText: string): Partial<CarFormData> => {
  const parsedData: Partial<CarFormData> = {};
  if (!ocrText) return parsedData;

  const lines = ocrText.split('\n');

  lines.forEach(line => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) return; // ข้ามบรรทัดที่ไม่มี :

    const key = line.substring(0, separatorIndex).trim();
    const value = line.substring(separatorIndex + 1).trim();
    
    const formKey = ocrToFormKeyMap[key] as keyof CarFormData;

    if (formKey) {
      const numericFields: (keyof CarFormData)[] = [
        'year', 
        'seats',
        // --- field อื่นๆ ที่เป็นตัวเลข ---
        'price', 
        'mileage', 
        'conditionRating', 
        'doors',
      ];

      if (numericFields.includes(formKey)) {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
          parsedData[formKey] = numericValue as never;
        }
      } else {
        parsedData[formKey] = value as never;
      }
    }
  });

  return parsedData;
};