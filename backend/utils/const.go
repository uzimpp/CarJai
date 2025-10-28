package utils

// Ingestion translation maps for normalizing scraped/OCR data
// These map Thai input to database codes/IDs for storage
var (
	// ProvinceNameToID maps Thai province names to database IDs
	// Used as fallback for license plate province mapping
	ProvinceNameToID = map[string]int{
		// North (1-14)
		"เชียงใหม่":  1,
		"เชียงราย":   2,
		"ลำพูน":      3,
		"ลำปาง":      4,
		"แม่ฮ่องสอน": 5,
		"น่าน":       6,
		"พะเยา":      7,
		"แพร่":       8,
		"อุตรดิตถ์":  9,
		"พิษณุโลก":   10,
		"สุโขทัย":    11,
		"พิจิตร":     12,
		"กำแพงเพชร":  13,
		"ตาก":        14,

		// Northeast (15-32)
		"ขอนแก่น":     15,
		"กาฬสินธุ์":   16,
		"มหาสารคาม":   17,
		"ร้อยเอ็ด":    18,
		"ยโสธร":       19,
		"อำนาจเจริญ":  20,
		"อุบลราชธานี": 21,
		"ศรีสะเกษ":    22,
		"นครราชสีมา":  23,
		"บุรีรัมย์":   24,
		"สุรินทร์":    25,
		"ชัยภูมิ":     26,
		"หนองบัวลำภู": 27,
		"หนองคาย":     28,
		"เลย":         29,
		"สกลนคร":      30,
		"นครพนม":      31,
		"มุกดาหาร":    32,

		// Central (33-48)
		"กรุงเทพมหานคร":   33,
		"นนทบุรี":         34,
		"ปทุมธานี":        35,
		"พระนครศรีอยุธยา": 36,
		"สระบุรี":         37,
		"ลพบุรี":          38,
		"อ่างทอง":         39,
		"สิงห์บุรี":       40,
		"ชัยนาท":          41,
		"สุพรรณบุรี":      42,
		"นครปฐม":          43,
		"สมุทรสาคร":       44,
		"สมุทรปราการ":     45,
		"สมุทรสงคราม":     46,
		"ราชบุรี":         47,
		"นครนายก":         48,

		// West (49-50)
		"กาญจนบุรี": 49,
		"เพชรบุรี":  50,

		// East (51-57) - Note: นครนายก appears twice in migration (48 and 57)
		"ชลบุรี":     51,
		"ระยอง":      52,
		"จันทบุรี":   53,
		"ตราด":       54,
		"ปราจีนบุรี": 55,
		"สระแก้ว":    56,

		// South (58-72)
		"ประจวบคีรีขันธ์": 58,
		"ชุมพร":         59,
		"ระนอง":         60,
		"สุราษฎร์ธานี":  61,
		"นครศรีธรรมราช": 62,
		"พัทลุง":        63,
		"สงขลา":         64,
		"สตูล":          65,
		"ตรัง":          66,
		"กระบี่":        67,
		"พังงา":         68,
		"ภูเก็ต":        69,
		"ยะลา":          70,
		"ปัตตานี":       71,
		"นราธิวาส":      72,
	}

	// ColorMap maps Thai color names to database color codes
	// Used for normalizing inspection document colors
	ColorMap = map[string]string{
		// WHITE (code: WHITE, id: 7)
		"ขาว": "WHITE",

		// BLACK (code: BLACK, id: 9)
		"ดำ": "BLACK",

		// GRAY (code: GRAY, id: 2)
		"เทา":     "GRAY",
		"เทาอ่อน": "GRAY",

		// RED (code: RED, id: 1)
		"แดง":         "RED",
		"แดงเลือดหมู": "RED",
		"แดงเลือดนก":  "RED",
		"แดงบานเย็น":  "RED",
		"แดงทับทิม":   "RED",

		// BLUE (code: BLUE, id: 3)
		"น้ำเงิน":     "BLUE",
		"น้ำเงินเข้ม": "BLUE",
		"คราม":        "BLUE",
		"กรมท่า":      "BLUE",

		// LIGHT_BLUE (code: LIGHT_BLUE, id: 4)
		"ฟ้า":     "LIGHT_BLUE",
		"ฟ้าอ่อน": "LIGHT_BLUE",
		"ฟ้าเข้ม": "LIGHT_BLUE",

		// GREEN (code: GREEN, id: 12)
		"เขียว":       "GREEN",
		"เขียวใบไม้":  "GREEN",
		"เขียวอ่อน":   "GREEN",
		"เขียวเข้ม":   "GREEN",
		"เขียวขี้ม้า": "GREEN",

		// YELLOW (code: YELLOW, id: 5)
		"เหลือง":        "YELLOW",
		"เหลืองอ่อน":    "YELLOW",
		"เหลืองทอง":     "YELLOW",
		"ครีมออกเหลือง": "YELLOW",
		"ครีม":          "YELLOW",
		"สีครีม":        "YELLOW",
		"ทอง":           "YELLOW",
		"สีทอง":         "YELLOW",

		// ORANGE (code: ORANGE, id: 10)
		"ส้ม":     "ORANGE",
		"แสด":     "ORANGE",
		"อิฐ":     "ORANGE",
		"ปูนแห้ง": "ORANGE",

		// PURPLE (code: PURPLE, id: 11)
		"ม่วง":             "PURPLE",
		"ม่วงอ่อน":         "PURPLE",
		"ม่วงเข้ม":         "PURPLE",
		"ม่วงเปลือกมังคุด": "PURPLE",

		// BROWN (code: BROWN, id: 8)
		"น้ำตาล":     "BROWN",
		"น้ำตาลอ่อน": "BROWN",
		"น้ำตาลไหม้": "BROWN",
		"น้ำตาลเข้ม": "BROWN",
		"แชล็ค":      "BROWN",
		"บรอนซ์":     "BROWN",
		"สีบรอนซ์":   "BROWN",
		"เบจ":        "BROWN",
		"สีเบจ":      "BROWN",

		// PINK (code: PINK, id: 6)
		"ชมพู":     "PINK",
		"ชมพูอ่อน": "PINK",
		"ชมพูเข้ม": "PINK",

		// MULTICOLOR (code: MULTICOLOR, id: 13)
		"หลากสี": "MULTICOLOR",
	}
)
