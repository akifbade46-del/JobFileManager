# Q'go Cargo - Deployment Guide
## Job File Management System - HTML/JavaScript/PHP/MySQL Edition

### System Overview
This is a complete job file management system converted from React/TypeScript/Node.js/PostgreSQL to HTML/JavaScript/PHP/MySQL for shared hosting compatibility.

### Key Features
- ✅ Role-based access control (Admin, Checker, User)
- ✅ Job file management with approval workflows
- ✅ Client management system
- ✅ Analytics and reporting dashboard
- ✅ KWD currency support (3 decimal places)
- ✅ CSV/JSON data import/export tools
- ✅ Activity logging
- ✅ Shared hosting compatible

### Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 8.0+, MySQL 8.0+
- **Hosting**: Shared hosting compatible (tested on Hostinger)

## Deployment Instructions

### 1. Requirements
- **PHP**: 8.0 or higher
- **MySQL**: 8.0 or higher  
- **Web Server**: Apache with mod_rewrite enabled
- **PHP Extensions**: PDO, PDO_MySQL, JSON, Session

### 2. File Structure for Upload
Upload these files to your hosting root directory:
```
/
├── index.html              # Main application entry point
├── .htaccess               # Main Apache configuration
├── css/                    # Stylesheets
│   └── styles.css
├── js/                     # JavaScript modules
│   ├── app.js             # Main application
│   ├── auth.js            # Authentication
│   ├── router.js          # Client-side routing  
│   ├── api.js             # API communication
│   ├── ui.js              # UI components
│   ├── utils.js           # Utilities
│   ├── jobs.js            # Job management
│   ├── clients.js         # Client management
│   ├── analytics.js       # Analytics & reporting
│   └── admin.js           # Admin panel
├── api/                   # PHP backend
│   ├── .htaccess          # API routing configuration
│   ├── index.php          # Main API router
│   ├── config.php         # Configuration
│   ├── db.php             # Database connection
│   ├── utils.php          # PHP utilities
│   ├── auth.php           # Authentication API
│   ├── jobs.php           # Jobs API
│   ├── clients.php        # Clients API
│   ├── users.php          # Users API (admin)
│   ├── analytics.php      # Analytics API
│   ├── activity.php       # Activity logs API
│   └── migration.php      # Data migration API
└── database/
    └── mysql_schema.sql   # Database schema
```

### 3. Database Setup

#### 3.1 Create Database
1. Access your hosting control panel (cPanel)
2. Go to MySQL Databases
3. Create a new database (e.g., `your_username_jobfiles`)
4. Create a database user and assign to the database
5. Note the database credentials

#### 3.2 Import Schema
1. Go to phpMyAdmin in your control panel
2. Select your database
3. Import the `database/mysql_schema.sql` file
4. Verify all tables were created successfully

#### 3.3 Configure Database Connection
Edit `api/config.php` and update these lines:
```php
define('DB_HOST', 'localhost');  // Usually 'localhost' for shared hosting
define('DB_NAME', 'your_username_jobfiles'); // Your database name
define('DB_USER', 'your_username_dbuser');   // Your database user
define('DB_PASS', 'your_database_password'); // Your database password
```

### 4. Environment Configuration

#### 4.1 Production Settings
In `api/config.php`, set:
```php
define('ENVIRONMENT', 'production');
define('DEBUG', false);
```

#### 4.2 Security Settings
1. Generate a secure session secret
2. Review file permissions (755 for directories, 644 for files)
3. Ensure `.htaccess` files are properly uploaded

### 5. Initial Setup

#### 5.1 Create Admin User
After deployment, you'll need to create an initial admin user. Options:

**Option A: Manual Database Insert**
```sql
INSERT INTO users (name, email, password, role, status, created_at, updated_at) 
VALUES (
    'Admin User', 
    'admin@yourcompany.com', 
    '$2y$12$[generated_password_hash]',  -- Use PHP password_hash()
    'admin', 
    'active', 
    NOW(), 
    NOW()
);
```

**Option B: Registration + Database Update**
1. Register normally through the application
2. Update the user's role in database: `UPDATE users SET role='admin' WHERE id=1;`

#### 5.2 Test the System
1. Visit your domain (should load the login page)
2. Login with admin credentials
3. Test key functionality:
   - Dashboard loads
   - Can create job files
   - Can manage clients  
   - Analytics displays data
   - Admin panel accessible

### 6. Data Migration (Optional)

If migrating from existing system:
1. Prepare CSV files with your data
2. Login as admin
3. Go to Admin Panel > Data Migration
4. Upload CSV files for users, clients, and job files
5. Verify imported data

### 7. Troubleshooting

#### 7.1 Common Issues

**"500 Internal Server Error"**
- Check server error logs
- Verify PHP version compatibility
- Ensure all files uploaded correctly
- Check database connection settings

**API endpoints returning 404**
- Verify `.htaccess` files uploaded
- Check if mod_rewrite is enabled
- Ensure proper file permissions

**Database connection errors**
- Double-check database credentials in `api/config.php`
- Verify database and user exist
- Test database connection manually

**Login not working**
- Clear browser cache and cookies
- Check database for user records
- Verify password hashing compatibility

#### 7.2 Debug Mode
For troubleshooting, temporarily enable debug mode in `api/config.php`:
```php
define('DEBUG', true);
```
**Remember to disable debug mode in production!**

### 8. Maintenance

#### 8.1 Backup
- Regular database backups through cPanel
- File backups of uploaded data
- Use the built-in backup feature in Admin Panel

#### 8.2 Updates
- Monitor PHP/MySQL version compatibility
- Regular security updates
- Database optimization as needed

### 9. Support

For issues with deployment:
1. Check server error logs
2. Enable debug mode temporarily
3. Verify all requirements are met
4. Test each component individually

### 10. Security Checklist

✅ Debug mode disabled in production  
✅ Strong database passwords  
✅ .htaccess files protecting sensitive directories  
✅ HTTPS enabled (recommended)  
✅ Regular backups scheduled  
✅ File permissions properly set  
✅ Database user has minimal required privileges  

---

**Q'go Cargo Job File Management System**  
HTML/JavaScript/PHP/MySQL Edition  
Version 2.0.0 - Shared Hosting Compatible