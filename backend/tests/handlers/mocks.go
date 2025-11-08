package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/uzimpp/CarJai/backend/models"
	"github.com/uzimpp/CarJai/backend/services"
)

// mockUserService is a mock implementation of UserService for testing
type mockUserService struct {
	signupFunc              func(email, password, username, name, ipAddress, userAgent string) (*models.UserAuthResponse, error)
	signinFunc              func(emailOrUsername, password, ipAddress, userAgent string) (*models.UserAuthResponse, error)
	signoutFunc             func(token string) (*models.UserSignoutResponse, error)
	getCurrentUserFunc      func(token string) (*models.UserMeResponse, error)
	refreshTokenFunc        func(token, ipAddress, userAgent string) (*models.UserAuthResponse, error)
	changePasswordFunc      func(userID int, currentPassword, newPassword string) error
	validateUserSessionFunc func(token string) (*models.User, error)
	isSellerFunc            func(userID int) (bool, error)
	getUserByUsernameFunc   func(username string) (*models.User, error)
}

func (m *mockUserService) Signup(email, password, username, name, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	if m.signupFunc != nil {
		return m.signupFunc(email, password, username, name, ipAddress, userAgent)
	}
	return nil, nil
}

func (m *mockUserService) Signin(emailOrUsername, password, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	if m.signinFunc != nil {
		return m.signinFunc(emailOrUsername, password, ipAddress, userAgent)
	}
	return nil, nil
}

func (m *mockUserService) Signout(token string) (*models.UserSignoutResponse, error) {
	if m.signoutFunc != nil {
		return m.signoutFunc(token)
	}
	return nil, nil
}

func (m *mockUserService) GetCurrentUser(token string) (*models.UserMeResponse, error) {
	if m.getCurrentUserFunc != nil {
		return m.getCurrentUserFunc(token)
	}
	return nil, nil
}

func (m *mockUserService) RefreshToken(token, ipAddress, userAgent string) (*models.UserAuthResponse, error) {
	if m.refreshTokenFunc != nil {
		return m.refreshTokenFunc(token, ipAddress, userAgent)
	}
	return nil, nil
}

func (m *mockUserService) ChangePassword(userID int, currentPassword, newPassword string) error {
	if m.changePasswordFunc != nil {
		return m.changePasswordFunc(userID, currentPassword, newPassword)
	}
	return nil
}

func (m *mockUserService) ValidateUserSession(token string) (*models.User, error) {
	if m.validateUserSessionFunc != nil {
		return m.validateUserSessionFunc(token)
	}
	return nil, nil
}

func (m *mockUserService) IsSeller(userID int) (bool, error) {
	if m.isSellerFunc != nil {
		return m.isSellerFunc(userID)
	}
	return false, nil
}

func (m *mockUserService) GetUserByUsername(username string) (*models.User, error) {
	if m.getUserByUsernameFunc != nil {
		return m.getUserByUsernameFunc(username)
	}
	return nil, nil
}

// mockProfileService is a mock implementation of ProfileService for testing
type mockProfileService struct {
	getFullProfileFunc    func(userID int, user *models.User) (*models.ProfileData, error)
	getBuyerByUserIDFunc  func(userID int) (*models.Buyer, error)
	upsertBuyerFunc       func(userID int, req models.BuyerRequest) (*models.Buyer, error)
	getSellerByUserIDFunc func(userID int) (*models.Seller, error)
	upsertSellerFunc      func(userID int, req models.SellerRequest) (*models.Seller, *[]models.SellerContact, error)
	getSellerContactsFunc func(sellerID int) ([]models.SellerContact, error)
	getRolesForUserFunc   func(userID int) (models.UserRoles, error)
	getPublicSellerByIDFunc func(sellerID string) (*models.Seller, error)
}

func (m *mockProfileService) GetFullProfile(userID int, user *models.User) (*models.ProfileData, error) {
	if m.getFullProfileFunc != nil {
		return m.getFullProfileFunc(userID, user)
	}
	return nil, nil
}

func (m *mockProfileService) GetBuyerByUserID(userID int) (*models.Buyer, error) {
	if m.getBuyerByUserIDFunc != nil {
		return m.getBuyerByUserIDFunc(userID)
	}
	return nil, nil
}

func (m *mockProfileService) UpsertBuyer(userID int, req models.BuyerRequest) (*models.Buyer, error) {
	if m.upsertBuyerFunc != nil {
		return m.upsertBuyerFunc(userID, req)
	}
	return nil, nil
}

func (m *mockProfileService) GetSellerByUserID(userID int) (*models.Seller, error) {
	if m.getSellerByUserIDFunc != nil {
		return m.getSellerByUserIDFunc(userID)
	}
	return nil, nil
}

func (m *mockProfileService) UpsertSeller(userID int, req models.SellerRequest) (*models.Seller, *[]models.SellerContact, error) {
	if m.upsertSellerFunc != nil {
		return m.upsertSellerFunc(userID, req)
	}
	return nil, nil, nil
}

func (m *mockProfileService) GetSellerContacts(sellerID int) ([]models.SellerContact, error) {
	if m.getSellerContactsFunc != nil {
		return m.getSellerContactsFunc(sellerID)
	}
	return nil, nil
}

func (m *mockProfileService) GetRolesForUser(userID int) (models.UserRoles, error) {
	if m.getRolesForUserFunc != nil {
		return m.getRolesForUserFunc(userID)
	}
	return models.UserRoles{}, nil
}

func (m *mockProfileService) GetPublicSellerByID(sellerID string) (*models.Seller, error) {
	if m.getPublicSellerByIDFunc != nil {
		return m.getPublicSellerByIDFunc(sellerID)
	}
	return nil, nil
}

// mockFavouriteService is a mock implementation of FavouriteService for testing
type mockFavouriteService struct {
	addFavouriteFunc      func(userID, carID int) error
	removeFavouriteFunc   func(userID, carID int) error
	getFavouriteListingsFunc func(userID int) ([]models.CarListingWithImages, error)
}

func (m *mockFavouriteService) AddFavourite(userID, carID int) error {
	if m.addFavouriteFunc != nil {
		return m.addFavouriteFunc(userID, carID)
	}
	return nil
}

func (m *mockFavouriteService) RemoveFavourite(userID, carID int) error {
	if m.removeFavouriteFunc != nil {
		return m.removeFavouriteFunc(userID, carID)
	}
	return nil
}

func (m *mockFavouriteService) GetFavouriteListings(userID int) ([]models.CarListingWithImages, error) {
	if m.getFavouriteListingsFunc != nil {
		return m.getFavouriteListingsFunc(userID)
	}
	return nil, nil
}

// mockRecentViewsService is a mock implementation of RecentViewsService for testing
type mockRecentViewsService struct {
	recordViewFunc      func(userID, carID int) error
	getUserRecentViewsFunc func(userID, limit int) ([]models.RecentViewWithCarDetails, error)
}

func (m *mockRecentViewsService) RecordView(userID, carID int) error {
	if m.recordViewFunc != nil {
		return m.recordViewFunc(userID, carID)
	}
	return nil
}

func (m *mockRecentViewsService) GetUserRecentViews(userID, limit int) ([]models.RecentViewWithCarDetails, error) {
	if m.getUserRecentViewsFunc != nil {
		return m.getUserRecentViewsFunc(userID, limit)
	}
	return nil, nil
}

// mockCarService is a mock implementation of CarService for testing
type mockCarService struct {
	createCarFunc              func(userID int) (*models.Car, error)
	getCarWithImagesFunc       func(carID int) (*models.CarWithImages, error)
	getCarsBySellerIDFunc      func(sellerID int) ([]models.CarListingWithImages, error)
	searchActiveCarsFunc        func(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error)
	updateCarFunc              func(carID, userID int, req *models.UpdateCarRequest, isAdmin bool) error
	autoSaveDraftFunc          func(carID, userID int, req *models.UpdateCarRequest) error
	deleteCarFunc              func(carID, userID int, isAdmin bool) error
	uploadCarImagesFunc        func(carID, userID int, files []*http.Request, isAdmin bool) ([]models.CarImageMetadata, error)
	getCarImageFunc            func(imageID int) (*models.CarImage, error)
	deleteCarImageFunc         func(imageID, userID int, isAdmin bool) error
	reorderImagesBulkFunc      func(carID int, imageIDs []int, userID int, isAdmin bool) error
	validatePublishFunc        func(carID int) (bool, []string)
	getCarByIDFunc             func(carID int) (*models.Car, error)
	translateCarForDisplayFunc func(car *models.Car, lang string) (*services.TranslatedCarDisplay, error)
	getColorLabelsByCodesFunc  func(codes []string, lang string) ([]map[string]interface{}, error)
	computeStep2StatusFunc     func(carID int) (bool, []string)
	computeStep3StatusFunc     func(carID int) (bool, []string)
	uploadBookToDraftFunc      func(carID, userID int, bookFields *services.BookFields) (*models.Car, string, *int, string, error)
	uploadInspectionToDraftFunc func(carID, userID int, inspectionFields *services.InspectionFields, scraper *services.ScraperService) (*models.Car, *int, string, error)
}

func (m *mockCarService) CreateCar(userID int) (*models.Car, error) {
	if m.createCarFunc != nil {
		return m.createCarFunc(userID)
	}
	return nil, nil
}

func (m *mockCarService) GetCarWithImages(carID int) (*models.CarWithImages, error) {
	if m.getCarWithImagesFunc != nil {
		return m.getCarWithImagesFunc(carID)
	}
	return nil, nil
}

func (m *mockCarService) GetCarsBySellerIDWithImages(sellerID int) ([]models.CarListingWithImages, error) {
	if m.getCarsBySellerIDFunc != nil {
		return m.getCarsBySellerIDFunc(sellerID)
	}
	return nil, nil
}

func (m *mockCarService) SearchActiveCarsWithImages(req *models.SearchCarsRequest) ([]models.CarListingWithImages, int, error) {
	if m.searchActiveCarsFunc != nil {
		return m.searchActiveCarsFunc(req)
	}
	return nil, 0, nil
}

func (m *mockCarService) UpdateCar(carID, userID int, req *models.UpdateCarRequest, isAdmin bool) error {
	if m.updateCarFunc != nil {
		return m.updateCarFunc(carID, userID, req, isAdmin)
	}
	return nil
}

func (m *mockCarService) AutoSaveDraft(carID, userID int, req *models.UpdateCarRequest) error {
	if m.autoSaveDraftFunc != nil {
		return m.autoSaveDraftFunc(carID, userID, req)
	}
	return nil
}

func (m *mockCarService) DeleteCar(carID, userID int, isAdmin bool) error {
	if m.deleteCarFunc != nil {
		return m.deleteCarFunc(carID, userID, isAdmin)
	}
	return nil
}

func (m *mockCarService) UploadCarImages(carID, userID int, files []*http.Request, isAdmin bool) ([]models.CarImageMetadata, error) {
	if m.uploadCarImagesFunc != nil {
		return m.uploadCarImagesFunc(carID, userID, files, isAdmin)
	}
	return nil, nil
}

func (m *mockCarService) GetCarImage(imageID int) (*models.CarImage, error) {
	if m.getCarImageFunc != nil {
		return m.getCarImageFunc(imageID)
	}
	return nil, nil
}

func (m *mockCarService) DeleteCarImage(imageID, userID int, isAdmin bool) error {
	if m.deleteCarImageFunc != nil {
		return m.deleteCarImageFunc(imageID, userID, isAdmin)
	}
	return nil
}

func (m *mockCarService) ReorderImagesBulk(carID int, imageIDs []int, userID int, isAdmin bool) error {
	if m.reorderImagesBulkFunc != nil {
		return m.reorderImagesBulkFunc(carID, imageIDs, userID, isAdmin)
	}
	return nil
}

func (m *mockCarService) ValidatePublish(carID int) (bool, []string) {
	if m.validatePublishFunc != nil {
		return m.validatePublishFunc(carID)
	}
	return false, nil
}

func (m *mockCarService) GetCarByID(carID int) (*models.Car, error) {
	if m.getCarByIDFunc != nil {
		return m.getCarByIDFunc(carID)
	}
	return nil, nil
}

func (m *mockCarService) TranslateCarForDisplay(car *models.Car, lang string) (*services.TranslatedCarDisplay, error) {
	if m.translateCarForDisplayFunc != nil {
		return m.translateCarForDisplayFunc(car, lang)
	}
	return nil, nil
}

func (m *mockCarService) GetColorLabelsByCodes(codes []string, lang string) ([]map[string]interface{}, error) {
	if m.getColorLabelsByCodesFunc != nil {
		return m.getColorLabelsByCodesFunc(codes, lang)
	}
	return nil, nil
}

func (m *mockCarService) ComputeStep2Status(carID int) (bool, []string) {
	if m.computeStep2StatusFunc != nil {
		return m.computeStep2StatusFunc(carID)
	}
	return false, nil
}

func (m *mockCarService) ComputeStep3Status(carID int) (bool, []string) {
	if m.computeStep2StatusFunc != nil {
		return m.computeStep3StatusFunc(carID)
	}
	return false, nil
}

func (m *mockCarService) UploadBookToDraft(carID, userID int, bookFields *services.BookFields) (*models.Car, string, *int, string, error) {
	if m.uploadBookToDraftFunc != nil {
		return m.uploadBookToDraftFunc(carID, userID, bookFields)
	}
	return nil, "", nil, "", nil
}

func (m *mockCarService) UploadInspectionToDraft(carID, userID int, inspectionFields *services.InspectionFields, scraper *services.ScraperService) (*models.Car, *int, string, error) {
	if m.uploadInspectionToDraftFunc != nil {
		return m.uploadInspectionToDraftFunc(carID, userID, inspectionFields, scraper)
	}
	return nil, nil, "", nil
}

// mockAdminService is a mock implementation of AdminService for testing
type mockAdminService struct {
	signinFunc        func(req services.SigninRequest) (*services.SigninResponse, error)
	signoutFunc       func(req services.SignoutRequest) error
	getCurrentAdminFunc func(token string) (*models.AdminMeData, error)
	addIPToWhitelistFunc func(adminID int, ipAddress, description string) error
	removeIPFromWhitelistFunc func(adminID int, ipAddress string) error
	getWhitelistedIPsFunc func(adminID int) ([]models.AdminIPWhitelist, error)
}

func (m *mockAdminService) Signin(req services.SigninRequest) (*services.SigninResponse, error) {
	if m.signinFunc != nil {
		return m.signinFunc(req)
	}
	return nil, nil
}

func (m *mockAdminService) Signout(req services.SignoutRequest) error {
	if m.signoutFunc != nil {
		return m.signoutFunc(req)
	}
	return nil
}

func (m *mockAdminService) GetCurrentAdmin(token string) (*models.AdminMeData, error) {
	if m.getCurrentAdminFunc != nil {
		return m.getCurrentAdminFunc(token)
	}
	return nil, nil
}

func (m *mockAdminService) AddIPToWhitelist(adminID int, ipAddress, description string) error {
	if m.addIPToWhitelistFunc != nil {
		return m.addIPToWhitelistFunc(adminID, ipAddress, description)
	}
	return nil
}

func (m *mockAdminService) RemoveIPFromWhitelist(adminID int, ipAddress string) error {
	if m.removeIPFromWhitelistFunc != nil {
		return m.removeIPFromWhitelistFunc(adminID, ipAddress)
	}
	return nil
}

func (m *mockAdminService) GetWhitelistedIPs(adminID int) ([]models.AdminIPWhitelist, error) {
	if m.getWhitelistedIPsFunc != nil {
		return m.getWhitelistedIPsFunc(adminID)
	}
	return nil, nil
}

// mockJWTManager is a mock implementation of JWTManager for testing
type mockJWTManager struct {
	refreshTokenFunc func(token string) (string, time.Time, error)
}

func (m *mockJWTManager) RefreshToken(token string) (string, time.Time, error) {
	if m.refreshTokenFunc != nil {
		return m.refreshTokenFunc(token)
	}
	return "", time.Time{}, nil
}

// mockExtractionService is a mock implementation of ExtractionService for testing
type mockExtractionService struct {
	extractMarketPricesFunc func(ctx context.Context, filePath string) ([]services.MarketPrice, error)
	commitMarketPricesFunc  func(ctx context.Context, prices []services.MarketPrice) (int, int, error)
}

func (m *mockExtractionService) ExtractMarketPricesFromPDF(ctx context.Context, filePath string) ([]services.MarketPrice, error) {
	if m.extractMarketPricesFunc != nil {
		return m.extractMarketPricesFunc(ctx, filePath)
	}
	return nil, nil
}

func (m *mockExtractionService) CommitMarketPrices(ctx context.Context, prices []services.MarketPrice) (int, int, error) {
	if m.commitMarketPricesFunc != nil {
		return m.commitMarketPricesFunc(ctx, prices)
	}
	return 0, 0, nil
}

