# 安卓 App 构建指南

## 你需要找一个会电脑的人帮你执行下面三步，5分钟就够

---

### 第一步：改配置

打开这个文件，修改里面的域名：
`mobile/lib/core/constants.dart`

把第 4 行改成你的实际域名：
```
static const String apiBaseUrl = 'https://你的域名/api';
static const String livekitWsUrl = 'wss://你的域名';
static const String wsUrl = 'https://你的域名';
```

---

### 第二步：安装 Flutter（如果还没装）

在一台 Windows/Mac/Linux 电脑上：

1. 下载 Flutter：https://docs.flutter.dev/get-started/install
2. 解压到任意目录
3. 把 flutter/bin 加到系统 PATH

或者直接：
- Windows: 下载安装 Android Studio（自带 Android SDK）
- Mac: 同上

---

### 第三步：构建 APK

打开命令行，进入 `mobile` 目录：

```bash
cd mobile
flutter pub get
flutter build apk --release
```

构建完成后，APK 文件在：
```
mobile/build/app/outputs/flutter-apk/app-release.apk
```

把这个 APK 文件发给用户，在安卓手机上直接安装即可。

---

## 如果想在模拟器上先测试

```bash
cd mobile
flutter pub get
flutter run
```

需要先连接安卓手机（开启 USB 调试模式）或启动安卓模拟器。
