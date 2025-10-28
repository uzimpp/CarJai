package utils

// DisplayBool converts boolean inspection results to "Pass"/"Fail" strings
func DisplayBool(boolValue bool) string {
	if boolValue {
		return "Pass"
	}
	return "Fail"
}

// DisplayColor converts color code to Thai color name (reverse lookup)
func DisplayColor(colorCode string) string {
	// Reverse lookup: find Thai name for a given color code
	for thaiName, code := range ColorMap {
		if code == colorCode {
			return thaiName // Return first match (Thai name)
		}
	}
	return colorCode // Fallback to code if not found
}

// DisplayStatus converts internal status to user-friendly display
func DisplayStatus(status string) string {
	statusMap := map[string]string{
		"draft":   "Draft",
		"active":  "Listed",
		"sold":    "Sold",
		"deleted": "Deleted",
	}
	if display, ok := statusMap[status]; ok {
		return display
	}
	return status
}

// DisplayYesNo converts boolean to "Yes"/"No" strings
func DisplayYesNo(value bool) string {
	if value {
		return "Yes"
	}
	return "No"
}

// DisplayConditionRating converts 1-5 rating to descriptive text
func DisplayConditionRating(rating int) string {
	ratingMap := map[int]string{
		1: "Poor",
		2: "Fair",
		3: "Good",
		4: "Very Good",
		5: "Excellent",
	}
	if display, ok := ratingMap[rating]; ok {
		return display
	}
	return "Unknown"
}
