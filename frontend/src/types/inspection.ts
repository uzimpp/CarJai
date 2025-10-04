// src/types/inspection.ts

/**
 * กำหนดโครงสร้างข้อมูลของผลลัพธ์ที่ได้จากการ Scrape ใบตรวจสภาพรถ
 * ซึ่งจะเป็น Object ที่มี Key-Value เป็น string ทั้งคู่
 */
export interface InspectionData {
  [key: string]: string;
}