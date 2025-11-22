# User Documentation

This guide provides comprehensive instructions for all users of the CarJai platform: buyers, sellers, and administrators.

---

## Table of Contents

1. [For Buyers](#for-buyers)
2. [For Sellers](#for-sellers)
3. [For Administrators](#for-administrators)
4. [Getting Help](#getting-help)

---

## For Buyers

### Creating an Account

1. **Navigate to Sign Up**
   - Click "Sign Up" in the top navigation bar or visit `/signup`
   - Choose your role: Buyer or Seller (you can be both)

2. **Sign Up Options**
   - **Email/Password**: Fill in username, email, password, and name
   - **Google OAuth**: Click "Continue with Google" for quick sign-up

3. **Complete Buyer Profile** (Optional)
   - Set your province/location
   - Set your budget range (min and max)
   - This helps sellers understand your preferences

### Signing In

1. **Navigate to Sign In**
   - Click "Sign In" in the top navigation bar or visit `/signin`

2. **Sign In Options**
   - **Email/Password**: Enter your email and password
   - **Google OAuth**: Click "Sign in with Google" if you signed up with Google

3. **Password Reset**
   - Click "Forgot Password?" on the sign-in page
   - Enter your email to receive a password reset link

### Searching for Cars

1. **Browse Cars**
   - Click "Browse Cars" in the navigation bar or visit `/browse`
   - View all available car listings

2. **Search and Filter**
   - Use the search bar to find specific cars
   - Filter by:
     - Brand and Model
     - Year (range)
     - Price (min/max)
     - Province/Location
     - Body Type (Sedan, SUV, etc.)
     - Transmission (Manual, Automatic)
     - Fuel Type (Gasoline, Diesel, Hybrid, Electric)

3. **View Car Details**
   - Click on any car listing to view full details
   - View multiple images
   - See inspection certificate results
   - View registration book information
   - Check seller contact information

### Contacting Sellers

1. **From Car Details Page**
   - Scroll to the seller information section
   - View available contact methods:
     - Phone number
     - Line ID
     - Facebook
     - Instagram
   - Click on contact links to reach the seller directly

2. **Direct Communication**
   - All communication happens directly between you and the seller
   - No middleman delays
   - Negotiate price and terms directly

### Managing Favourites

1. **Save Favourites**
   - Click the heart icon on any car listing
   - The car will be saved to your favourites

2. **View Favourites**
   - Click on your account menu (top right)
   - Select "Favourites" or visit `/favorites`
   - View all your saved cars in one place

3. **Remove Favourites**
   - Click the heart icon again to remove from favourites

### Viewing History

1. **Recent Views**
   - Your viewing history is automatically tracked
   - Click on your account menu
   - Select "History" or visit `/history`
   - View all cars you've recently viewed

### Reporting Issues

1. **Report Suspicious Listings**
   - On any car details page, click "Report"
   - Select report type: "Car" or "Seller"
   - Choose a topic (e.g., "False Information", "Suspicious Activity")
   - Add sub-topics if applicable
   - Provide a detailed description
   - Submit the report

2. **Report Status**
   - Admins will review your report
   - You can check report status in your account

### Managing Your Profile

1. **Access Profile Settings**
   - Click on your account menu (top right)
   - Select "Settings" or visit `/settings`

2. **Update Buyer Profile**
   - Update your province
   - Update your budget range
   - Change your password

3. **View Your Activity**
   - See your favourites
   - View your recent viewing history
   - Check your reports

---

## For Sellers

### Creating an Account

1. **Navigate to Sign Up**
   - Click "Sign Up" in the top navigation bar or visit `/signup`
   - Choose "Seller" as your role (you can also be a buyer)

2. **Sign Up Options**
   - **Email/Password**: Fill in username, email, password, and name
   - **Google OAuth**: Click "Continue with Google" for quick sign-up

3. **Complete Seller Profile**
   - Set your display name (how buyers will see you)
   - Write an "About" section describing yourself
   - Add contact information:
     - Phone number
     - Line ID
     - Facebook
     - Instagram
   - Add a map link (optional, for location)

### Signing In

1. **Navigate to Sign In**
   - Click "Sign In" in the top navigation bar or visit `/signin`

2. **Sign In Options**
   - **Email/Password**: Enter your email and password
   - **Google OAuth**: Click "Sign in with Google" if you signed up with Google

### Creating a Car Listing

1. **Navigate to Sell Page**
   - Click "Sell" in the navigation bar or visit `/sell`
   - Your progress is automatically saved as you fill out the form

2. **Step 1: Car Information**
   - Enter basic details:
     - Brand (e.g., Toyota, Honda)
     - Model (e.g., Camry, Civic)
     - Submodel (e.g., Hybrid, Sport)
     - Year
     - Mileage (kilometers)
     - Engine CC
     - Number of seats
     - Number of doors
   - Select:
     - Body Type (Sedan, SUV, Pickup, etc.)
     - Transmission (Manual, Automatic, CVT)
     - Drivetrain (FWD, RWD, AWD, 4WD)
     - Fuel Types (can select multiple)
     - Colors (can select up to 3 colors: primary, secondary, tertiary)

3. **Step 2: Chassis Number**
   - Enter chassis number (optional but recommended)
   - Used for verification

4. **Step 3: Documents**
   - **Inspection Certificate (Required)**
     - Upload a clear image of your vehicle inspection certificate
     - OCR (Optical Character Recognition) will automatically extract data
     - Review and verify the extracted information
   - **Registration Book (Optional but Recommended)**
     - Upload an image of your vehicle registration book
     - Helps build buyer trust

5. **Step 4: Images**
   - Upload multiple car images
   - Drag and drop images or click to browse
   - Recommended: Upload 5-10 high-quality images
   - Show different angles: front, back, sides, interior, engine

6. **Step 5: Price and Condition**
   - Set your asking price
   - **Price Estimation** (Automatic):
     - System calculates estimated price based on:
       - DLT (Department of Land Transport) market prices
       - Car condition (star rating)
       - Mileage
       - Special conditions (flooded, crashed, etc.)
     - Review the estimated price as a reference
   - Rate car condition (1-5 stars)
   - Indicate special conditions if applicable:
     - Flooded car
     - Heavy accident
     - Crashed

7. **Step 6: Review and Submit**
   - Review all information
   - Make any final edits
   - Click "Submit" to publish your listing

### Managing Your Listings

1. **View All Listings**
   - Click on your account menu (top right)
   - Select "My Listings" or visit `/listings`
   - See all your active listings

2. **Edit a Listing**
   - Go to "My Listings"
   - Click "Edit" on any listing
   - Make changes to any field
   - Save your changes

3. **Delete a Listing**
   - Go to "My Listings"
   - Click "Delete" on any listing
   - Confirm deletion

4. **Mark as Sold**
   - Go to "My Listings"
   - Click "Mark as Sold" on any listing
   - The listing will be automatically removed from the marketplace
   - Buyers will no longer see it in search results

### Understanding Price Estimation

The system automatically estimates car prices using:

1. **Base Price**: Average of DLT market price range for your car's brand, model, submodel, and year

2. **Adjustment Factors**:
   - **Condition Rating**: 1-5 stars affect price
   - **Mileage**: Higher mileage reduces price
   - **Inspection Results**: Based on inspection certificate
   - **Special Conditions**: Flooded, crashed, or heavy accident reduce price significantly

3. **Final Estimate**: Base Price × Adjustment Factor

This is a reference price. You can set your asking price higher or lower based on market conditions.

### Managing Your Profile

1. **Access Profile Settings**
   - Click on your account menu (top right)
   - Select "Settings" or visit `/settings`

2. **Update Seller Profile**
   - Update display name
   - Edit "About" section
   - Update contact information
   - Change map link

3. **View Your Activity**
   - See all your listings
   - View listing status (active, sold)
   - Check reports on your listings

---

## For Administrators

### Accessing Admin Portal

1. **IP Whitelist Requirement**
   - Admin portal is only accessible from whitelisted IP addresses
   - Contact system administrator to add your IP address

2. **Navigate to Admin Sign In**
   - Visit `/admin/signin`
   - Enter admin username and password

3. **Security**
   - Admin portal uses separate authentication from regular users
   - IP whitelist provides additional security layer

### Managing IP Whitelist

1. **View IP Whitelist**
   - Go to Admin Dashboard
   - Click "IP Whitelists" in the sidebar or visit `/admin/ip-whitelists`
   - View all whitelisted IP addresses

2. **Add IP Address**
   - Click "Add IP Address"
   - Enter IP address
   - Add description (optional, e.g., "Office Network")
   - Save

3. **Remove IP Address**
   - Find the IP address in the list
   - Click "Delete"
   - Confirm deletion

### Managing Car Listings

1. **View All Listings**
   - Go to Admin Dashboard
   - Click "Cars" in the sidebar or visit `/admin/cars`
   - View all car listings (active and sold)

2. **Approve Listings**
   - New listings may require approval (if configured)
   - Review listing details
   - Click "Approve" to make listing visible

3. **Edit Listings**
   - Click "Edit" on any listing
   - Modify any field
   - Save changes

4. **Delete Listings**
   - Click "Delete" on any listing
   - Confirm deletion
   - Listing will be permanently removed

5. **Mark as Sold**
   - Click "Mark as Sold" on any listing
   - Listing will be removed from marketplace

### Managing Users

1. **View All Users**
   - Go to Admin Dashboard
   - Click "Users" in the sidebar or visit `/admin/users`
   - View all registered users (buyers and sellers)

2. **View User Details**
   - Click on any user to view:
     - Profile information
     - Listings (if seller)
     - Activity history

3. **Ban/Suspend Users**
   - Click "Ban" or "Suspend" on any user
   - Select reason
   - User will be unable to access the platform

4. **Unban Users**
   - Find banned user in the list
   - Click "Unban"
   - User access will be restored

### Managing Reports

1. **View Reports**
   - Go to Admin Dashboard
   - Click "Reports" in the sidebar or visit `/admin/reports`
   - View all reports (car reports and seller reports)

2. **Report Types**
   - **Car Reports**: Reports about specific car listings
   - **Seller Reports**: Reports about sellers

3. **Review Reports**
   - Click on any report to view details
   - Read reporter's description
   - Check related car/seller information

4. **Update Report Status**
   - **Pending**: New report, not yet reviewed
   - **Reviewed**: Report has been reviewed
   - **Resolved**: Issue has been resolved
   - **Dismissed**: Report was invalid or not actionable

5. **Add Admin Notes**
   - Add internal notes about the report
   - Notes are only visible to admins

### Managing Market Price Data

1. **Upload Market Price PDF**
   - Go to Admin Dashboard
   - Click "Market Price" in the sidebar or visit `/admin/market-price`
   - Upload DLT (Department of Land Transport) price PDF
   - System will automatically extract price data

2. **View Market Prices**
   - View all extracted market prices
   - Search by brand, model, submodel, year
   - Prices are used for automatic price estimation

3. **Update Market Prices**
   - Upload new PDF to update prices
   - Old prices will be updated with new data

### Viewing System Dashboard

1. **Dashboard Overview**
   - Go to Admin Dashboard at `/admin/dashboard`
   - View system statistics:
     - Total users (buyers and sellers)
     - Total car listings (active and sold)
     - Total reports (by status)
     - Recent activity

2. **Statistics**
   - User growth over time
   - Listing statistics
   - Report statistics
   - Platform health metrics

### Managing Admin Accounts

1. **View All Admins**
   - Go to Admin Dashboard
   - Click "Admins" in the sidebar or visit `/admin/admins`
   - View all admin accounts

2. **Create Admin Account**
   - Click "Create Admin"
   - Enter username, password, and name
   - Save

3. **Edit Admin Account**
   - Click "Edit" on any admin
   - Update information
   - Save changes

4. **Delete Admin Account**
   - Click "Delete" on any admin
   - Confirm deletion

---

## Getting Help

### User Guides

- **Buyer Guide**: Visit `/guides/buyer` for detailed buyer instructions
- **Seller Guide**: Visit `/guides/seller` for detailed seller instructions
- **General Guide**: Visit `/guides` for overview

### Support Pages

- **About Us**: Visit `/about-us` to learn about CarJai
- **Privacy Policy**: Visit `/privacy` for privacy information
- **Terms of Service**: Visit `/terms` for terms and conditions

### Contact

For technical support or questions:
- Check the guides and documentation
- Report issues through the platform's report feature
- Contact platform administrators

---

