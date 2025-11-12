# iWork4SE Mobile App

Ứng dụng mobile cho ứng viên (Applicant) trên nền tảng iWork4SE.

## Tính năng

- 🔐 Đăng nhập/Đăng ký
- 🔍 Tìm kiếm và lọc việc làm
- 📄 Xem chi tiết việc làm
- ✅ Ứng tuyển việc làm
- 💾 Lưu việc làm yêu thích
- 📊 Dashboard theo dõi ứng tuyển
- 👤 Quản lý hồ sơ cá nhân
- 📋 Xem danh sách việc làm đã ứng tuyển
- 💼 Quản lý CV

## Yêu cầu hệ thống

- Node.js >= 16
- npm hoặc yarn
- Expo CLI
- iOS Simulator (cho macOS) hoặc Android Emulator
- Backend API đang chạy tại http://localhost:8080

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Cấu hình API URL:
   - Mở file `app.json`
   - Cập nhật `extra.apiUrl` với URL backend của bạn
   - Hoặc tạo file `.env` với `API_BASE_URL=http://your-backend-url:8080`

3. Khởi chạy ứng dụng:
```bash
npm start
```

4. Chạy trên thiết bị:
- iOS: `npm run ios` (cần macOS và Xcode)
- Android: `npm run android` (cần Android Studio)
- Expo Go: Quét QR code bằng ứng dụng Expo Go trên điện thoại

## Cấu trúc thư mục

```
src/
  ├── api/              # API service layer
  ├── constants/        # Constants and config
  ├── contexts/         # React contexts (Auth, etc.)
  ├── navigation/       # Navigation configuration
  ├── screens/          # Screen components
  │   ├── auth/         # Authentication screens
  │   └── main/         # Main application screens
  └── types/            # TypeScript types
```

## Các màn hình chính

### Authentication
- **LoginScreen**: Đăng nhập
- **RegisterScreen**: Đăng ký tài khoản mới

### Main Application
- **DashboardScreen**: Trang chủ với thống kê và đơn ứng tuyển gần đây
- **JobsScreen**: Danh sách việc làm với tìm kiếm và lọc
- **JobDetailScreen**: Chi tiết việc làm và ứng tuyển
- **AppliedJobsScreen**: Danh sách việc làm đã ứng tuyển
- **SavedJobsScreen**: Danh sách việc làm đã lưu
- **ProfileScreen**: Thông tin hồ sơ cá nhân
- **ProfileEditScreen**: Chỉnh sửa hồ sơ

## API Integration

Ứng dụng sử dụng cùng API backend với web frontend:
- Base URL: Cấu hình trong `app.json` hoặc `.env`
- Authentication: JWT tokens được lưu trong AsyncStorage
- Token refresh: Tự động refresh khi token hết hạn

## Development

### Chạy trên thiết bị thật
1. Cài đặt Expo Go từ App Store (iOS) hoặc Play Store (Android)
2. Chạy `npm start`
3. Quét QR code hiển thị trong terminal

### Chạy trên emulator/simulator
- iOS: `npm run ios`
- Android: `npm run android`

## Troubleshooting

### Lỗi kết nối API
- Kiểm tra backend có đang chạy không
- Kiểm tra API_BASE_URL trong `app.json` hoặc `.env`
- Với Android emulator, sử dụng `10.0.2.2` thay vì `localhost`
- Với iOS simulator, có thể sử dụng `localhost`

### Lỗi cài đặt dependencies
```bash
rm -rf node_modules
npm install
```

## Tech Stack

- **React Native**: Framework mobile
- **Expo**: Development platform
- **TypeScript**: Type safety
- **React Navigation**: Navigation library
- **AsyncStorage**: Local storage
- **Axios**: HTTP client (via fetch API)

## Notes

- Ứng dụng chỉ hỗ trợ role APPLICANT
- Cần backend API đang chạy để sử dụng đầy đủ tính năng
- Token được lưu trong AsyncStorage và tự động refresh

