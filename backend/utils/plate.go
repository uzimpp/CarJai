package utils

import (
	"strings"
)

// LicensePlateBreakdown represents parsed license plate components
type LicensePlateBreakdown struct {
	Prefix     string // e.g., "กข"
	Number     string // e.g., "5177"
	ProvinceID int    // e.g., 33 (Bangkok)
}

// BreakdownLicensePlate parses a license plate string into components for storage
// Input format: "กข 5177 กรุงเทพมหานคร" or "ABC 1234 Bangkok"
// Returns: prefix, number, and province_id (mapped from Thai province name)
func BreakdownLicensePlate(plateStr string, provinceNameTh string) *LicensePlateBreakdown {
	parts := strings.Fields(strings.TrimSpace(plateStr))

	if len(parts) < 2 {
		return nil // Invalid format
	}

	breakdown := &LicensePlateBreakdown{
		Prefix: strings.TrimSpace(parts[0]),
		Number: strings.TrimSpace(parts[1]),
	}

	// If province name is provided separately, use it
	if provinceNameTh != "" {
		breakdown.ProvinceID = TranslateProvinceToID(provinceNameTh)
	} else if len(parts) >= 3 {
		// Otherwise try to extract from the plate string
		provinceName := strings.TrimSpace(strings.Join(parts[2:], " "))
		breakdown.ProvinceID = TranslateProvinceToID(provinceName)
	}

	return breakdown
}

// ConstructLicensePlate formats stored license plate components into a display string
// Input: prefix (e.g., "กข"), number (e.g., "5177"), provinceName (e.g., "กรุงเทพมหานคร")
// Output: "กข5177 กรุงเทพมหานคร" or "กข5177" if province is empty
func ConstructLicensePlate(prefix, number, provinceName string) string {
	if prefix == "" || number == "" {
		return ""
	}

	plate := prefix + number

	if provinceName != "" {
		plate += " " + provinceName
	}

	return plate
}
