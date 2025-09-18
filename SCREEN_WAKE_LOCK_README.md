# 🌟 屏幕常亮功能文档

## 📱 功能概述

本功能通过JavaScript实现防止移动设备屏幕自动熄灭，并确保在应用程序切换至后台运行状态时仍能正常生效。

## 🔧 技术实现

### 核心API
- 使用 `navigator.wakeLock` API（现代浏览器支持）
- 提供降级方案支持旧版浏览器
- 实现心跳机制确保后台运行稳定性

### 主要特性
- ✅ **自动检测支持**：智能检测浏览器是否支持屏幕唤醒锁API
- ✅ **后台运行支持**：通过心跳机制确保应用在后台时屏幕保持常亮
- ✅ **智能重试**：自动重试获取唤醒锁，最大重试次数可配置
- ✅ **状态监控**：实时监控唤醒锁状态变化
- ✅ **错误处理**：完善的错误处理和状态回调机制

## 🚀 使用方法

### 基本使用

```javascript
import ScreenWakeLock from './js/screen-wake-lock.js';

// 创建屏幕常亮管理器
const wakeLock = new ScreenWakeLock();

// 设置状态变化回调
wakeLock.setStatusChangeCallback((status, data) => {
    console.log('屏幕常亮状态:', status);
});

// 激活屏幕常亮
await wakeLock.acquire();

// 释放屏幕常亮
await wakeLock.release();
```

### 高级配置

```javascript
// 启用后台运行支持
wakeLock.setBackgroundSupport(true);

// 设置心跳间隔（毫秒）
wakeLock.setHeartbeatInterval(20000); // 20秒

// 获取当前状态
const status = wakeLock.getStatus();
console.log(status);
// 输出: {
//     isSupported: true,
//     isActive: true,
//     hasWakeLock: true,
//     retryCount: 0,
//     maxRetries: 3
// }
```

## 📋 状态说明

| 状态 | 说明 |
|------|------|
| `acquired` | 成功获取屏幕唤醒锁 |
| `released` | 屏幕唤醒锁已释放 |
| `failed` | 获取屏幕唤醒锁失败 |
| `unsupported` | 浏览器不支持屏幕唤醒锁API |
| `error` | 发生错误 |

## 🔄 后台运行机制

### 心跳机制
- 定期检查唤醒锁状态
- 自动重新获取丢失的唤醒锁
- 支持离线状态下的等待恢复

### 后台活动维持
使用多种技术确保后台运行时的稳定性：
1. **Service Worker消息**：向Service Worker发送保持活跃消息
2. **Fetch API keepalive**：使用keepalive选项维持网络连接
3. **Web Audio API**：创建静默音频保持活跃状态

## ⚙️ 配置选项

### 构造函数参数
无需参数，使用默认配置即可

### 可配置属性
- `maxRetries`: 最大重试次数（默认：3）
- `retryDelay`: 重试延迟（默认：1000毫秒）
- `heartbeatInterval`: 心跳间隔（默认：30000毫秒）
- `backgroundSupport`: 后台运行支持（默认：true）

## 🌐 浏览器兼容性

### 支持情况
- ✅ Chrome 84+
- ✅ Edge 84+
- ✅ Opera 70+
- ⚠️ Firefox: 部分支持（需要特殊配置）
- ⚠️ Safari: 实验性支持

### 降级处理
对于不支持`navigator.wakeLock`的浏览器，提供以下降级方案：
- 使用页面可见性API监控状态变化
- 实现备用的心跳机制
- 提供用户友好的状态反馈

## 🧪 测试方法

### 使用测试页面
打开 `screen-wake-lock-test.html` 文件进行功能测试：

1. 点击"激活屏幕常亮"按钮
2. 观察状态变化和日志输出
3. 尝试切换应用到后台，观察重试机制
4. 测试后台支持功能的开启/关闭

### 移动端测试
1. 在移动设备上打开测试页面
2. 激活屏幕常亮功能
3. 等待设备自动熄屏时间（通常30秒-1分钟）
4. 验证屏幕是否保持常亮状态
5. 切换到其他应用，验证后台运行支持

## 🔍 调试与监控

### 日志输出
所有重要操作都会输出到控制台，格式如下：
```
[屏幕常亮] 成功获取屏幕唤醒锁
[屏幕常亮] 心跳机制已启动
[屏幕常亮] 后台活动维持已执行
```

### 状态监控
通过`getStatus()`方法获取详细状态信息，便于调试和监控。

## ⚠️ 注意事项

1. **用户交互要求**：某些浏览器需要用户交互才能获取唤醒锁
2. **电池优化**：长时间使用可能影响设备电池寿命
3. **权限限制**：某些设备可能需要特殊权限
4. **浏览器策略**：不同浏览器的实现策略可能有所不同

## 🔗 相关链接

- [MDN Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Wake_Lock_API)
- [W3C Wake Lock Specification](https://www.w3.org/TR/wake-lock/)
- [Can I Use - Wake Lock API](https://caniuse.com/wake-lock)

## 📄 许可证

此功能遵循项目的整体许可证协议。