package utils

import (
	"strings"
)

// ThaiToEnglish translation maps
var (
	// Thai provinces to English
	ProvinceMap = map[string]string{
		"กรุงเทพมหานคร":   "Bangkok",
		"กระบี่":          "Krabi",
		"กาญจนบุรี":       "Kanchanaburi",
		"กาฬสินธุ์":       "Kalasin",
		"กำแพงเพชร":       "Kamphaeng Phet",
		"ขอนแก่น":         "Khon Kaen",
		"จันทบุรี":        "Chanthaburi",
		"ฉะเชิงเทรา":      "Chachoengsao",
		"ชลบุรี":          "Chonburi",
		"ชัยนาท":          "Chai Nat",
		"ชัยภูมิ":         "Chaiyaphum",
		"ชุมพร":           "Chumphon",
		"เชียงราย":        "Chiang Rai",
		"เชียงใหม่":       "Chiang Mai",
		"ตรัง":            "Trang",
		"ตราด":            "Trat",
		"ตาก":             "Tak",
		"นครนายก":         "Nakhon Nayok",
		"นครปฐม":          "Nakhon Pathom",
		"นครพนม":          "Nakhon Phanom",
		"นครราชสีมา":      "Nakhon Ratchasima",
		"นครศรีธรรมราช":   "Nakhon Si Thammarat",
		"นครสวรรค์":       "Nakhon Sawan",
		"นนทบุรี":         "Nonthaburi",
		"นราธิวาส":        "Narathiwat",
		"น่าน":            "Nan",
		"บึงกาฬ":          "Bueng Kan",
		"บุรีรัมย์":       "Buriram",
		"ปทุมธานี":        "Pathum Thani",
		"ประจวบคีรีขันธ์": "Prachuap Khiri Khan",
		"ปราจีนบุรี":      "Prachinburi",
		"ปัตตานี":         "Pattani",
		"พระนครศรีอยุธยา": "Phra Nakhon Si Ayutthaya",
		"พะเยา":           "Phayao",
		"พังงา":           "Phang Nga",
		"พัทลุง":          "Phatthalung",
		"พิจิตร":          "Phichit",
		"พิษณุโลก":        "Phitsanulok",
		"เพชรบุรี":        "Phetchaburi",
		"เพชรบูรณ์":       "Phetchabun",
		"แพร่":            "Phrae",
		"ภูเก็ต":          "Phuket",
		"มหาสารคาม":       "Maha Sarakham",
		"มุกดาหาร":        "Mukdahan",
		"แม่ฮ่องสอน":      "Mae Hong Son",
		"ยโสธร":           "Yasothon",
		"ยะลา":            "Yala",
		"ร้อยเอ็ด":        "Roi Et",
		"ระนอง":           "Ranong",
		"ระยอง":           "Rayong",
		"ราชบุรี":         "Ratchaburi",
		"ลพบุรี":          "Lopburi",
		"ลำปาง":           "Lampang",
		"ลำพูน":           "Lamphun",
		"เลย":             "Loei",
		"ศรีสะเกษ":        "Si Sa Ket",
		"สกลนคร":          "Sakon Nakhon",
		"สงขลา":           "Songkhla",
		"สตูล":            "Satun",
		"สมุทรปราการ":     "Samut Prakan",
		"สมุทรสงคราม":     "Samut Songkhram",
		"สมุทรสาคร":       "Samut Sakhon",
		"สระแก้ว":         "Sa Kaeo",
		"สระบุรี":         "Saraburi",
		"สิงห์บุรี":       "Sing Buri",
		"สุโขทัย":         "Sukhothai",
		"สุพรรณบุรี":      "Suphan Buri",
		"สุราษฎร์ธานี":    "Surat Thani",
		"สุรินทร์":        "Surin",
		"หนองคาย":         "Nong Khai",
		"หนองบัวลำภู":     "Nong Bua Lamphu",
		"อ่างทอง":         "Ang Thong",
		"อำนาจเจริญ":      "Amnat Charoen",
		"อุดรธานี":        "Udon Thani",
		"อุตรดิตถ์":       "Uttaradit",
		"อุทัยธานี":       "Uthai Thani",
		"อุบลราชธานี":     "Ubon Ratchathani",
	}

	// Thai colors to English
	ColorMap = map[string]string{
		"ขาว":       "White",
		"สีขาว":     "White",
		"ดำ":        "Black",
		"สีดำ":      "Black",
		"เทา":       "Gray",
		"สีเทา":     "Gray",
		"เงิน":      "Silver",
		"สีเงิン":    "Silver",
		"แดง":       "Red",
		"สีแดง":     "Red",
		"น้ำเงิน":   "Blue",
		"สีน้ำเงิน": "Blue",
		"เขียว":     "Green",
		"สีเขียว":   "Green",
		"เหลือง":    "Yellow",
		"สีเหลือง":  "Yellow",
		"ส้ม":       "Orange",
		"สีส้ม":     "Orange",
		"ม่วง":      "Purple",
		"สีม่วง":    "Purple",
		"น้ำตาล":    "Brown",
		"สีน้ำตาล":  "Brown",
		"ชมพู":      "Pink",
		"สีชมพู":    "Pink",
		"ทอง":       "Gold",
		"สีทอง":     "Gold",
		"บรอนซ์":    "Bronze",
		"สีบรอนซ์":  "Bronze",
		"เบจ":       "Beige",
		"สีเบจ":     "Beige",
		"ครีม":      "Cream",
		"สีครีม":    "Cream",
	}

	// Thai inspection results to English
	InspectionResultMap = map[string]string{
		"ผ่าน":         "Pass",
		"ไม่ผ่าน":      "Fail",
		"ผ่านเกณฑ์":    "Pass",
		"ไม่ผ่านเกณฑ์": "Fail",
	}

	// Thai fuel types to English (for OCR data)
	FuelTypeMap = map[string]string{
		"เบนซิน":       "Gasoline",
		"แก๊สโซลีน":    "Gasoline",
		"น้ำมันเบนซิน": "Gasoline",
		"ดีเซล":        "Diesel",
		"น้ำมันดีเซล":  "Diesel",
		"ไฮบริด":       "Hybrid",
		"ไฟฟ้า":        "Electric",
		"แก๊ส":         "LPG",
		"แอลพีจี":      "LPG",
		"LPG":          "LPG",
		"เอ็นจีวี":     "NGV",
		"NGV":          "NGV",
	}

	// Thai body styles to English (for OCR data)
	BodyStyleMap = map[string]string{
		"รถเก๋ง":      "Sedan",
		"เก๋ง":        "Sedan",
		"รถเอสยูวี":   "SUV",
		"เอสยูวี":     "SUV",
		"SUV":         "SUV",
		"รถกระบะ":     "Pickup Truck",
		"กระบะ":       "Pickup Truck",
		"กระบะบรรทุก": "Pickup Truck",
		"กระบะบรรทุก(ไม่มีหลังคา)": "Pickup Truck",
		"กระบะบรรทุก(มีหลังคา)":    "Pickup Truck",
		"รถตู้":            "Van",
		"ตู้":              "Van",
		"รถแฮทช์แบ็ก":      "Hatchback",
		"แฮทช์แบ็ก":        "Hatchback",
		"คูเป้":            "Coupe",
		"รถคูเป้":          "Coupe",
		"คอนเวอร์ติเบิล":   "Convertible",
		"รถคอนเวอร์ติเบิล": "Convertible",
		"เอ็มพีวี":         "MPV",
		"MPV":              "MPV",
		"รถตระกูลสเตชั่นแว็กกอน": "Wagon",
		"สเตชั่นแว็กกอน":         "Wagon",
	}
)

// TranslateProvince converts Thai province name to English
func TranslateProvince(thaiProvince string) string {
	thaiProvince = strings.TrimSpace(thaiProvince)
	if english, ok := ProvinceMap[thaiProvince]; ok {
		return english
	}
	// If not found, return original (might already be English)
	return thaiProvince
}

// TranslateColor converts Thai color name to English
func TranslateColor(thaiColor string) string {
	thaiColor = strings.TrimSpace(thaiColor)
	// Remove "สี" prefix if present
	thaiColor = strings.TrimPrefix(thaiColor, "สี ")
	thaiColor = strings.TrimPrefix(thaiColor, "สี")

	if english, ok := ColorMap[thaiColor]; ok {
		return english
	}
	// If not found, return original (might already be English)
	return thaiColor
}

// TranslateInspectionResult converts Thai inspection result to English
func TranslateInspectionResult(thaiResult string) string {
	thaiResult = strings.TrimSpace(thaiResult)
	if english, ok := InspectionResultMap[thaiResult]; ok {
		return english
	}
	// If not found, return original (might already be English)
	return thaiResult
}

// TranslateFuelType converts Thai fuel type to English
func TranslateFuelType(thaiFuel string) string {
	thaiFuel = strings.TrimSpace(thaiFuel)
	if english, ok := FuelTypeMap[thaiFuel]; ok {
		return english
	}
	// If not found, return original (might already be English)
	return thaiFuel
}

// TranslateBodyStyle converts Thai body style to English
func TranslateBodyStyle(thaiStyle string) string {
	thaiStyle = strings.TrimSpace(thaiStyle)
	if english, ok := BodyStyleMap[thaiStyle]; ok {
		return english
	}
	// If not found, return original (might already be English)
	return thaiStyle
}
