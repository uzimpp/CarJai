# Overlapping and Unused Functions Analysis

## 🔴 Overlapping Functions

### 1. Car Service - Seller ID Functions (car_service.go)

**Overlapping Functions:**
- `GetCarsBySellerID(sellerID int)` (line 260) - Returns `[]models.Car`
- `GetCarListItemsBySellerID(sellerID int, lang string)` (line 441) - Returns `[]models.CarListItem` (all statuses)
- `GetActiveCarListItemsBySellerID(sellerID int, lang string)` (line 453) - Returns `[]models.CarListItem` (active only)

**Analysis:**
- `GetCarsBySellerID` is **NOT used** in any handlers - only used internally by the other two functions
- `GetCarListItemsBySellerID` is used in `car_handler.go:196` (GetMyCars endpoint)
- `GetActiveCarListItemsBySellerID` is used in `profile_handler.go:159` (GetSellerProfile endpoint)

**Recommendation:**
- `GetCarsBySellerID` can be removed as it's redundant - the other two functions already call the repo directly
- Consider consolidating `GetCarListItemsBySellerID` and `GetActiveCarListItemsBySellerID` into one function with an optional status parameter

---

## 🟡 Potentially Unused Functions

### 2. Car Service - Color/Fuel Label Functions (car_service.go)

**Functions:**
- `GetCarFuelLabels(carID int, lang string)` (line 930) - **NOT found in handlers**
- `GetCarColorLabels(carID int, lang string)` (line 949) - **NOT found in handlers**

**Note:** These might be used internally or in frontend, but not directly called by backend handlers.

---

### 3. Profile Service - Status Functions (profile_service.go)

**Functions:**
- `GetSellerStatus(userID int)` (line 116) - **NOT found in handlers**
- `GetBuyerStatus(userID int)` (line 128) - **NOT found in handlers**
- `GetProfilesCompletenessForUser(userID int)` (line 55) - **NOT found in handlers**

**Note:** These might be used internally by other services or in future features.

---

## 📊 Summary

### Definitely Unused (Safe to Remove):
1. ✅ `CarService.GetCarsBySellerID()` - Only used internally, redundant wrapper

### Potentially Unused (Verify before removing):
1. ⚠️ `CarService.GetCarFuelLabels()` - Not in handlers
2. ⚠️ `CarService.GetCarColorLabels()` - Not in handlers
3. ⚠️ `ProfileService.GetSellerStatus()` - Not in handlers
4. ⚠️ `ProfileService.GetBuyerStatus()` - Not in handlers
5. ⚠️ `ProfileService.GetProfilesCompletenessForUser()` - Not in handlers

### Overlapping (Consider Consolidation):
1. 🔄 `GetCarListItemsBySellerID` and `GetActiveCarListItemsBySellerID` - Could be merged with status parameter

---

## 🔍 How to Verify

To check if functions are truly unused:
1. Search for function calls across the entire codebase (including frontend if it calls backend directly)
2. Check if functions are used in tests
3. Check if functions are part of a public API that might be called externally
4. Review git history to see if they were recently added for future features

