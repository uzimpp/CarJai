package utils

func DisplayBool(boolValue bool) string {
	if boolValue {
		return "Pass"
	} else {
		return "Fail"
	}
}

func DisplayColor(colorCode string) string {
	return ColorMap[colorCode]
}
