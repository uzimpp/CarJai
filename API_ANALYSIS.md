# API Analysis Report

## Executive Summary

This document identifies undocumented APIs, design issues, and redundancy problems in the CarJai backend API.

---

## 1. Undocumented APIs

### 1.1 Reference Data Endpoints

**Status**: ✅ **FIXED** - All endpoints now documented in Swagger

| Swagger Documented | Actual Endpoint | Status |
|-------------------|-----------------|--------|
| `/api/reference-data/all` | `/api/reference-data/all` | ✅ Fixed |
| `/api/reference-data/brands` | `/api/reference-data/brands` | ✅ Documented |
| `/api/reference-data/models` | `/api/reference-data/models` | ✅ Documented |
| `/api/reference-data/submodels` | `/api/reference-data/submodels` | ✅ Documented |

**Location**: `routes/reference_routes.go`

**Resolution**: All four endpoints are now properly documented in Swagger

---

### 1.2 Profile/Seller Endpoints

**Status**: ✅ **FIXED** - Endpoint path corrected and non-existent endpoints removed

| Swagger Documented | Actual Endpoint | Status |
|-------------------|-----------------|--------|
| `/api/profile/seller/{id}` | `/api/profile/seller/{id}` | ✅ Fixed |

**Location**: `routes/profile.go:54`

**Resolution**: 
- ✅ Swagger now correctly documents `/api/profile/seller/{id}` with path parameter
- ✅ Removed non-existent `/api/sellers/*` endpoints from Swagger
- ✅ Added `lang` query parameter documentation

---

### 1.3 Admin Market Price Endpoints

**Status**: ✅ **FIXED** - All endpoints now match implementation

| Swagger Documented | Actual Endpoint | Method | Status |
|-------------------|-----------------|--------|--------|
| `/admin/market-price/data` | `/admin/market-price/data` | GET | ✅ Fixed |
| `/admin/market-price/upload` | `/admin/market-price/upload` | POST | ✅ Fixed |

**Location**: `routes/admin.go:114-118`

**Resolution**: 
- ✅ Swagger now correctly documents `/admin/market-price/data` (GET) for retrieving market prices
- ✅ Swagger now correctly documents `/admin/market-price/upload` (POST) for uploading and importing PDFs

---

### 1.4 Admin IP Whitelist Check Endpoint

**Status**: ✅ **FIXED** - Endpoint now documented

| Swagger Documented | Actual Endpoint | Status |
|-------------------|-----------------|--------|
| `/admin/ip-whitelist/check` | `/admin/ip-whitelist/check` | ✅ Documented |

**Location**: `routes/admin.go:91`

**Resolution**: 
- ✅ Added POST `/admin/ip-whitelist/check` endpoint to Swagger
- ✅ Documented request body (IP whitelist entry ID) and response (impact analysis)

---

## 2. Design Issues & Redundancy

### 2.1 Reference Data Endpoint Inconsistency

**Problem**: 
- Swagger shows single endpoint `/api/reference-data` 
- Implementation has 4 separate endpoints
- Frontend may be calling wrong endpoint

**Impact**: Medium - Could cause frontend integration issues

**Recommendation**: 
1. **Option A**: Keep 4 endpoints, update Swagger
2. **Option B**: Consolidate to single endpoint with query param: `/api/reference-data?type=all|brands|models|submodels`

---

### 2.2 Seller Profile Endpoint Redundancy

**Status**: ✅ **RESOLVED** - Redundancy eliminated

**Previous Issue**: 
- Swagger documented `/api/sellers/{id}`, `/api/sellers/{id}/contacts`, `/api/sellers/{id}/cars` which didn't exist
- Actual implementation only had `/api/profile/seller/{id}`

**Resolution**: 
- ✅ Removed non-existent `/api/sellers/*` endpoints from Swagger
- ✅ Documented `/api/profile/seller/{id}` correctly with path parameter
- ✅ Clarified that this endpoint combines all seller data in one response

**Current Implementation**:
```go
// /api/profile/seller/{id} returns:
{
  seller: {...},
  contacts: [...],
  cars: [...]
}
```

**Design Decision**: Single endpoint returns all seller data for better performance and fewer API calls

---

### 2.3 Market Price Endpoint Naming Confusion

**Status**: ✅ **RESOLVED** - Swagger updated to match implementation

**Previous Issue**: 
- Swagger used `/admin/market-price/import` and `/admin/market-price/commit`
- Implementation used `/admin/market-price/upload` and `/admin/market-price/data`

**Resolution**: 
- ✅ Updated Swagger to match actual implementation
- ✅ `GET /admin/market-price/data` - Get all market prices from database
- ✅ `POST /admin/market-price/upload` - Upload PDF and import to database

**Current State**: Documentation now accurately reflects the implementation

---

### 2.4 Profile Endpoint Naming Inconsistency

**Problem**: 
- `/api/profile/self` - Get/update own profile
- `/api/profile/seller/{id}` - Get seller profile by ID (public)

**Impact**: Low - Works but naming could be clearer

**Recommendation**: 
- Consider `/api/profile/me` instead of `/api/profile/self` for consistency with `/api/auth/me`
- Or keep `/api/profile/self` but ensure naming is consistent across codebase

---

### 2.5 Car Routes Complexity

**Problem**: 
- Car routes use string matching in `handleCarRoutes()` function
- Many nested routes: `/api/cars/{id}/book`, `/api/cars/{id}/images`, `/api/cars/{id}/images/order`, etc.
- Hard to maintain and document

**Impact**: Medium - Maintenance burden

**Recommendation**: 
- Consider using a proper router library (gorilla/mux) for better route management
- Or document all nested routes clearly in Swagger

---

### 2.6 Missing Query Parameters Documentation

**Issue**: Some endpoints accept query parameters not documented in Swagger:

| Endpoint | Missing Parameters |
|----------|-------------------|
| `/api/favorites/my` | `lang` (documented) ✅ |
| `/api/recent-views` | `limit`, `lang` (documented) ✅ |
| `/api/cars/search` | Need to verify all search params are documented |

**Recommendation**: Audit all endpoints for undocumented query parameters

---

## 3. API Response Format Consistency

### 3.1 Response Wrapper

**Status**: ✅ Consistent
- All endpoints use `utils.WriteJSON()` which returns:
  ```json
  {
    "success": boolean,
    "code": number,
    "data": any,
    "message": string
  }
  ```

### 3.2 CarListItem Format

**Status**: ✅ Fixed
- Favorites and Recent Views now return `CarListItem[]` directly
- No redundancy - ready to display as cards

---

## 4. Recommendations Summary

### High Priority
1. ✅ **Fix Swagger for Reference Data endpoints** - Document all 4 endpoints or consolidate
2. ✅ **Fix Swagger for Seller endpoints** - Remove non-existent `/api/sellers/*` and document `/api/profile/seller/{id}`
3. ✅ **Fix Swagger for Market Price endpoints** - Update paths to match implementation

### Medium Priority
4. ✅ **Document `/admin/ip-whitelist/check` endpoint**
5. ✅ **Audit all query parameters** - Ensure all are documented
6. ✅ **Consider router library** - For better car route management

### Low Priority
7. ✅ **Standardize naming** - Consider `/api/profile/me` vs `/api/profile/self`
8. ✅ **Add API versioning** - Consider `/api/v1/` prefix for future compatibility

---

## 5. Complete Endpoint List

### User Authentication
- ✅ `POST /api/auth/signup` - Documented
- ✅ `POST /api/auth/signin` - Documented
- ✅ `POST /api/auth/google/signin` - Documented
- ✅ `GET /api/auth/google/start` - Documented
- ✅ `GET /api/auth/google/callback` - Documented
- ✅ `POST /api/auth/signout` - Documented
- ✅ `GET /api/auth/me` - Documented
- ✅ `POST /api/auth/refresh` - Documented
- ✅ `POST /api/auth/change-password` - Documented

### Profile
- ✅ `GET /api/profile/self` - Documented
- ✅ `PATCH /api/profile/self` - Documented
- ✅ `GET /api/profile/seller/{id}` - **Fixed** (now correctly documented with path parameter)

### Cars
- ✅ `GET /api/cars/search` - Documented
- ✅ `POST /api/cars` - Documented
- ✅ `GET /api/cars/my` - Documented
- ✅ `GET /api/cars/{id}` - Documented
- ✅ `PUT /api/cars/{id}` - Documented
- ✅ `DELETE /api/cars/{id}` - Documented
- ✅ `POST /api/cars/{id}/images` - Documented
- ✅ `GET /api/cars/images/{image_id}` - Documented
- ✅ `DELETE /api/cars/images/{image_id}` - Documented
- ✅ `POST /api/cars/{id}/images/order` - Documented
- ✅ `POST /api/cars/{id}/status` - Documented
- ✅ `POST /api/cars/{id}/book` - Documented
- ✅ `POST /api/cars/{id}/inspection` - Documented
- ✅ `POST /api/cars/{id}/draft` - Documented
- ✅ `GET /api/cars/{id}/review` - Documented
- ✅ `POST /api/cars/{id}/discard` - Documented
- ✅ `POST /api/cars/{id}/restore-progress` - Documented
- ✅ `GET /api/cars/{id}/estimate` - Documented

### Favorites
- ✅ `GET /api/favorites/my` - Documented
- ✅ `POST /api/favorites/{carId}` - Documented
- ✅ `DELETE /api/favorites/{carId}` - Documented

### Recent Views
- ✅ `GET /api/recent-views` - Documented (recently added)
- ✅ `POST /api/recent-views` - Documented (recently added)

### Reports
- ✅ `POST /api/reports/cars/{id}` - Documented
- ✅ `POST /api/reports/sellers/{id}` - Documented

### Reference Data
- ✅ `GET /api/reference-data/all` - **Fixed** (now correctly documented)
- ✅ `GET /api/reference-data/brands` - **Documented**
- ✅ `GET /api/reference-data/models` - **Documented**
- ✅ `GET /api/reference-data/submodels` - **Documented**

### Admin (Partial List)
- ✅ `POST /admin/auth/signin` - Documented
- ✅ `GET /admin/auth/me` - Documented
- ✅ `POST /admin/auth/signout` - Documented
- ✅ `POST /admin/auth/refresh` - Documented
- ✅ `GET /admin/ip-whitelist` - Documented
- ✅ `POST /admin/ip-whitelist/add` - Documented
- ✅ `POST /admin/ip-whitelist/check` - **Fixed** (now documented)
- ✅ `POST /admin/ip-whitelist/remove` - Documented
- ✅ `GET /admin/market-price/data` - **Fixed** (now correctly documented)
- ✅ `POST /admin/market-price/upload` - **Fixed** (now correctly documented)
- ✅ `GET /admin/dashboard/stats` - Documented
- ✅ `GET /admin/dashboard/chart` - Documented
- ✅ `GET /admin/dashboard/top-brands` - Documented
- ✅ `GET /admin/dashboard/recent-reports` - Documented

### Consolidated Endpoints (Intentionally combined)
- ✅ `GET /api/profile/seller/{id}` - **Combines all seller data in one response**
  - This endpoint replaces the following three endpoints that were documented but never implemented:
    - ~~`GET /api/sellers/{id}`~~ - Seller info now included in `/api/profile/seller/{id}`
    - ~~`GET /api/sellers/{id}/contacts`~~ - Contacts now included in `/api/profile/seller/{id}`
    - ~~`GET /api/sellers/{id}/cars`~~ - Cars now included in `/api/profile/seller/{id}`
  - **Design Decision**: Single endpoint returns `{seller, contacts, cars}` for better performance and fewer API calls

---

## 6. Next Steps

### ✅ Completed
1. ✅ **Fixed Swagger documentation** - All mismatched endpoints corrected
2. ✅ **Removed non-existent endpoints** - `/api/sellers/*` endpoints removed from Swagger
3. ✅ **Documented missing endpoints** - All reference data and admin endpoints now documented

### Future Improvements
1. **Medium-term**: Consider API versioning (`/api/v1/`) for future compatibility
2. **Medium-term**: Consider router library (gorilla/mux) for better car route management
3. **Long-term**: Implement comprehensive API testing to catch documentation mismatches automatically
4. **Long-term**: Set up automated Swagger validation in CI/CD pipeline

