# Expo + Android 模拟器 常用指令速查

> 适用于 Windows PowerShell 环境
> 项目路径: `e:\Del\PhoneApp`

---

## 1. 模拟器管理

### 列出所有已创建的模拟器 (AVD)
```powershell
emulator -list-avds
```

### 启动模拟器
```powershell
# 启动指定名称的模拟器（名称来自上面的 list-avds）
emulator -avd Pixel_7_API_34

# 后台启动（不阻塞当前终端）
Start-Process emulator -ArgumentList "-avd Pixel_7_API_34"
```

### 关闭模拟器
```powershell
adb emu kill
```

---

## 2. ADB 常用指令

### 查看已连接的设备/模拟器
```powershell
adb devices
```

### 安装 APK 到模拟器
```powershell
adb install "C:\path\to\app.apk"

# 覆盖安装（已有旧版本时）
adb install -r "C:\path\to\app.apk"
```

### 卸载应用
```powershell
adb uninstall com.anonymous.PhoneApp
# 卸载 Expo Go
adb uninstall host.exp.exponent
```

### 查看已安装的第三方应用
```powershell
adb shell pm list packages -3
```

### 清除应用数据（不卸载）
```powershell
adb shell pm clear com.anonymous.PhoneApp
```

### 截屏
```powershell
adb exec-out screencap -p > screenshot.png
```

### 查看模拟器日志（调试崩溃用）
```powershell
# 查看所有日志（Ctrl+C 停止）
adb logcat

# 只看 React Native 相关日志
adb logcat *:E ReactNative:V ReactNativeJS:V

# 清除旧日志后再查看
adb logcat -c; adb logcat *:E
```

### 向模拟器推送文件
```powershell
adb push "本地文件路径" /sdcard/Download/
```

### 从模拟器拉取文件
```powershell
adb pull /sdcard/Download/file.txt "本地保存路径"
```

---

## 3. Expo 开发指令

### 启动 Metro 开发服务器
```powershell
cd e:\Del\PhoneApp

# 正常启动
npx expo start

# 清除缓存启动（改了 babel 配置、装了新包后推荐用这个）
npx expo start --clear

# 指定端口（默认 8081 被占用时）
npx expo start --port 8082
```

### Metro 运行时快捷键
| 按键      | 功能                |
|-----------|---------------------|
| `a`       | 在 Android 模拟器上打开 |
| `r`       | 重新加载 App         |
| `j`       | 打开调试器           |
| `m`       | 切换开发菜单         |
| `shift+m` | 更多工具             |
| `s`       | 切换到开发构建模式    |

### 直接启动并打开 Android
```powershell
npx expo start --android --clear
```

### 安装项目依赖
```powershell
# 安装 Expo 兼容版本的包（推荐）
npx expo install 包名1 包名2

# 普通 npm 安装
npm install 包名
```

### 查看 Expo 项目配置诊断
```powershell
npx expo-doctor
```

---

## 4. 端口占用问题

### 查看哪个进程占用了端口
```powershell
netstat -ano | findstr :8081
```

### 根据 PID 杀掉进程
```powershell
taskkill /PID 12345 /F
```

---

## 5. 完整开发流程（每次开发时）

```powershell
# ① 打开第一个 PowerShell：启动模拟器
emulator -avd Pixel_7_API_34

# ② 打开第二个 PowerShell：启动开发服务器
cd e:\Del\PhoneApp
npx expo start --clear

# ③ 在 Metro 界面按 a 键推送到模拟器

# ④ 开发过程中修改代码后会自动热更新（Hot Reload）
#    如果没自动刷新，按 r 键手动重载
```

---

## 6. 常见问题

### "Cannot find module 'xxx'"
```powershell
# 清除缓存并重新安装
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

### "TypeError: fetch failed"（Expo Go 下载失败）
手动在模拟器的 Google Play Store 里搜索安装 "Expo Go"

### Metro 缓存导致的奇怪问题
```powershell
# 清除 Metro 和 Expo 缓存
npx expo start --clear
```

### 彻底重置（核弹级）
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npx expo start --clear
```
