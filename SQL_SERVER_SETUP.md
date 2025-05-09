# Hướng dẫn Kết nối SQL Server

## I. Cài đặt và Cấu hình SQL Server

### 1. Cài đặt SQL Server (nếu chưa cài)
- Tải SQL Server Express từ trang web của Microsoft: [https://www.microsoft.com/en-us/sql-server/sql-server-downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
- Cài đặt SQL Server với các tùy chọn mặc định
- Lưu ý thông tin instance name (ví dụ: `SQLEXPRESS`) và mật khẩu của tài khoản `sa`

### 2. Cài đặt SQL Server Management Studio (SSMS)
- Tải SSMS từ [https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)
- Cài đặt SSMS

## II. Tạo Database

### 1. Kết nối SSMS với SQL Server
- Mở SSMS
- Nhập thông tin kết nối:
  - Server name: `DESKTOP-D7SSCQ5` hoặc `localhost\SQLEXPRESS` (nếu bạn cài instance SQLEXPRESS)
  - Authentication: SQL Server Authentication
  - Login: `sa`
  - Password: `Vietanh24`
- Nhấn "Connect"

### 2. Tạo Database Quanli
- Có 2 cách:
  - **Cách 1**: Chạy script SQL đã tạo
    - Chọn File > Open > File 
    - Mở file `create_database.sql`
    - Nhấn F5 hoặc nút "Execute" để chạy script
  - **Cách 2**: Tạo thủ công
    - Chuột phải vào "Databases" > "New Database"
    - Nhập tên database: `Quanli`
    - Nhấn OK

## III. Cấu hình Kết nối trong Ứng dụng Node.js

### 1. Cập nhật Thông tin Kết nối
- Mở file `src/config/config.json`
- Cập nhật thông tin kết nối:
  ```json
  {
    "development": {
      "username": "sa",
      "password": "Vietanh24",
      "database": "Quanli",
      "host": "DESKTOP-D7SSCQ5",
      "dialect": "mssql",
      "dialectOptions": {
        "options": {
          "encrypt": true,
          "trustServerCertificate": true
        }
      }
    }
  }
  ```

### 2. Cập nhật file `src/config/connectDB.js` tương tự

### 3. Kiểm tra Kết nối
- Chạy ứng dụng:
  ```
  npm start
  ```
- Nếu thấy thông báo "Connection to SQL Server has been established successfully" thì đã kết nối thành công

## IV. Xử lý Sự cố

### 1. Không thể kết nối
- Kiểm tra xem SQL Server có đang chạy không (Services > SQL Server)
- Kiểm tra thông tin kết nối:
  - Tên host: `DESKTOP-D7SSCQ5` hoặc tên instance của bạn
  - Tài khoản: `sa`
  - Mật khẩu: `Vietanh24`
- Đảm bảo rằng SQL Server Authentication được bật
  - Trong SSMS, chuột phải vào Server > Properties > Security > SQL Server and Windows Authentication mode

### 2. Lỗi "Login failed for user 'sa'"
- Kiểm tra xem tài khoản `sa` đã được bật chưa
  - Trong SSMS, mở Security > Logins
  - Chuột phải vào `sa` > Properties > Status > Login enabled

### 3. Lỗi "Cannot open database "Quanli" requested by the login. The login failed"
- Kiểm tra xem database `Quanli` có tồn tại không
- Đảm bảo người dùng `sa` có quyền truy cập database 