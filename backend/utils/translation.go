package utils

import (
	"strings"
)

// TranslateProvinceToID returns the province ID for a given Thai province name
// Used for normalizing license plate provinces from inspection documents
func TranslateProvinceToID(provinceName string) int {
	// Normalize the name (trim spaces)
	normalized := strings.TrimSpace(provinceName)

	// Try exact match first
	if id, ok := ProvinceNameToID[normalized]; ok {
		return id
	}

	// Try case-insensitive match (though Thai doesn't have case)
	for name, id := range ProvinceNameToID {
		if strings.EqualFold(name, normalized) {
			return id
		}
	}

	return 0 // Not found
}

// TranslateColorToCode converts Thai color name to database color code
func TranslateColorToCode(thaiColor string) string {
	thaiColor = strings.TrimSpace(thaiColor)
	// Remove "สี" prefix if present
	thaiColor = strings.TrimPrefix(thaiColor, "สี ")
	thaiColor = strings.TrimPrefix(thaiColor, "สี")

	if code, ok := ColorMap[thaiColor]; ok {
		return code
	}
	// If not found, check if it's already a code (uppercase English)
	upperColor := strings.ToUpper(thaiColor)
	validCodes := map[string]bool{
		"RED": true, "GRAY": true, "BLUE": true, "LIGHT_BLUE": true,
		"YELLOW": true, "PINK": true, "WHITE": true, "BROWN": true,
		"BLACK": true, "ORANGE": true, "PURPLE": true, "GREEN": true,
		"MULTICOLOR": true,
	}
	if validCodes[upperColor] {
		return upperColor
	}
	// Default to empty string if no match
	return ""
}

// TranslateInspectionResult converts Thai inspection result to English
func TranslateInspectionResult(str string) bool {
	// Check for pass indicators
	if strings.Contains(str, "pass") ||
		strings.Contains(str, "ผ่าน") ||
		strings.Contains(str, "ใช้ได้") ||
		strings.Contains(str, "ปกติ") {
		return true
	}

	// Check for fail indicators
	if strings.Contains(str, "fail") ||
		strings.Contains(str, "ไม่ผ่าน") ||
		strings.Contains(str, "ชำรุด") ||
		strings.Contains(str, "ไม่ใช้ได้") {
		return false
	}
	return false
}
