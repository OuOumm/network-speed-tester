# 🚀 网络流量测试工具

> 现代化的多线程网络测速与流量测试工具，支持实时速度监控、流量统计和进度可视化

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-2.0.0-blue.svg)](package.json)

## 📋 项目概述

网络流量测试工具是一款基于现代Web技术开发的网络性能测试应用。通过多线程并发下载技术，精确测量网络带宽性能，提供实时的速度监控、流量统计和可视化进度展示。工具采用模块化架构设计，具有高度的可扩展性和良好的用户体验。

### 核心优势
- 🎯 **精确控制**：支持设置目标流量，达到后自动停止
- ⚡ **多线程技术**：支持1-16个并发线程，提升测试效率
- 📊 **实时监控**：毫秒级速度更新，10点移动平均算法平滑显示
- 🌐 **智能适配**：自动切换流量单位（MB/GB/TB），跨平台兼容
- 🔧 **模块化设计**：ES6+ Class架构，代码清晰易维护

## ✨ 功能特性

### 核心功能
- **多线程下载测试**：支持1-16个并发线程，可自定义线程数量
- **实时速度计算**：基于requestAnimationFrame的平滑更新机制
- **流量统计监控**：精确统计下载流量，支持MB/GB/TB单位自动切换
- **进度可视化**：实时进度条显示，完成百分比精确到小数点后1位
- **智能流量控制**：达到设定目标流量后自动终止测试
- **日志记录系统**：详细的测试日志，支持一键清空

### 高级功能
- **IP地址检测**：自动获取并显示国内/国外IP信息
- **节点延迟测试**：实时测试所选节点的网络延迟
- **自定义测试节点**：支持添加自定义URL进行测试
- **剪贴板功能**：点击IP地址可快速复制到剪贴板
- **响应式设计**：完美适配桌面端和移动端设备

### 技术特性
- **现代化架构**：ES6+模块化开发，纯前端实现
- **性能优化**：防抖节流处理，避免UI更新过于频繁
- **错误处理**：完善的异常捕获和用户友好的错误提示
- **内存管理**：合理的资源清理，防止内存泄漏
- **代码质量**：完整的JSDoc文档注释，TypeScript类型定义

## 🛠️ 技术栈

### 前端技术
- **HTML5 + CSS3**：现代化的网页标准和样式
- **Tailwind CSS**：实用优先的CSS框架，快速构建美观界面
- **Font Awesome**：丰富的图标库，提升用户界面体验
- **原生JavaScript**：ES6+现代语法，无需额外框架依赖

### 开发工具
- **http-server**：轻量级本地开发服务器
- **Node.js**：JavaScript运行时环境（≥14.0.0）
- **pnpm**：快速、节省磁盘空间的包管理器

### 浏览器兼容性
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ Internet Explorer：不支持（推荐使用现代浏览器）

## 📦 安装指南

### 环境要求
- Node.js ≥ 14.0.0
- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 稳定的网络连接

### 快速安装

#### 方式一：使用Git克隆（推荐）
```bash
# 克隆项目到本地
git clone https://github.com/your-username/network-speed-tester.git

# 进入项目目录
cd network-speed-tester

# 安装依赖
pnpm install

# 启动开发服务器
pnpm start
```

#### 方式二：直接下载
1. 访问项目发布页面下载最新版本
2. 解压到本地目录
3. 在项目目录中打开终端，运行：`pnpm install`
4. 启动服务器：`pnpm start`

#### 方式三：使用npx（无需安装）
```bash
# 在项目目录中直接运行
npx http-server -p 8080 -o
```

### 验证安装
安装完成后，浏览器会自动打开 `http://localhost:8080`，看到流量测试工具界面即表示安装成功。

## 🎯 使用说明

### 基础测试流程

#### 1. 选择测试节点
- **预设节点**：提供百度APK、淘宝CDN、Cloudflare等优质节点
- **自定义节点**：输入支持跨域访问的大文件URL
- **延迟测试**：选择节点后自动测试网络延迟

#### 2. 配置测试参数
- **线程数量**：建议4-8个线程，平衡速度和稳定性
- **目标流量**：设置需要下载的总流量（MB/GB/TB）
- **单位选择**：根据测试需求选择合适的流量单位

#### 3. 开始测试
- 点击"开始测试"按钮启动多线程下载
- 实时观察下载速度、已用流量和完成进度
- 测试过程中可随时手动停止

#### 4. 查看结果
- **实时数据**：速度、流量、进度的实时更新
- **测试日志**：详细的操作记录和状态信息
- **统计信息**：测试完成后的总结报告

### 高级使用技巧

#### 自定义节点配置
```javascript
// 在network-tester.js中添加自定义节点
this.testNodes = [
    // ... 现有节点
    { id: 'custom1', name: '我的服务器', url: 'https://myserver.com/large-file.zip' }
];
```

#### 性能调优建议
- **线程数量**：根据网络带宽调整，100M宽带建议4-6线程
- **目标流量**：小流量测试用MB，大流量测试用GB
- **节点选择**：选择物理距离近、带宽充足的节点

#### 故障排除
- **连接失败**：检查目标URL是否支持跨域访问
- **速度异常**：尝试更换测试节点或调整线程数量
- **界面卡顿**：减少线程数量或降低更新频率

## ⚙️ 配置方法

### 基本配置
项目主要配置位于 `js/network-tester.js` 文件中：

```javascript
// 测试节点配置
this.testNodes = [
    { id: 'cn1', name: '百度APK', url: 'https://issuecdn.baidupcs.com/issue/netdisk/apk/BaiduNetdisk_11.44.3.apk' },
    // 可添加更多节点...
];

// 性能参数配置
this.speedSmoothingWindow = 10;  // 速度平滑窗口大小
this.updateInterval = 100;       // UI更新间隔（毫秒）
```

### 高级配置

#### 自定义样式
在 `index.html` 的 `<style>` 标签中修改Tailwind配置：
```javascript
tailwind.config = {
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6',    // 主色调
                secondary: '#10B981',  // 辅助色
                danger: '#EF4444'      // 危险色
            }
        }
    }
}
```

#### 功能扩展
通过继承 `NetworkTester` 类实现自定义功能：
```javascript
class CustomNetworkTester extends NetworkTester {
    // 添加自定义方法
    customFunction() {
        // 实现自定义逻辑
    }
}
```

## 🔧 开发指南

### 项目结构
```
network-speed-tester/
├── index.html              # 主页面文件
├── js/
│   ├── app.js             # 应用入口文件
│   └── network-tester.js  # 核心功能模块
├── package.json           # 项目配置和依赖
├── README.md             # 项目文档
└── LICENSE               # 许可证文件
```

### 开发环境搭建
```bash
# 1. 克隆项目
git clone https://github.com/your-username/network-speed-tester.git

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器（支持热重载）
pnpm dev

# 4. 浏览器访问
# http://localhost:8080
```

### 代码规范
- **命名规范**：使用驼峰命名法，类名首字母大写
- **注释规范**：使用JSDoc标准，包含参数和返回值说明
- **错误处理**：使用try-catch捕获异常，提供用户友好提示
- **模块化**：功能模块化，避免代码重复

### 提交规范
遵循Conventional Commits规范：
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 🤝 贡献指南

我们欢迎所有形式的贡献，包括但不限于：
- 🐛 **问题报告**：提交bug报告或功能建议
- 💡 **功能开发**：实现新功能或优化现有功能
- 📖 **文档改进**：完善README、添加使用教程
- 🌍 **国际化**：添加多语言支持
- 🎨 **UI/UX改进**：优化用户界面和体验

### 贡献流程
1. **Fork项目**：点击右上角的Fork按钮
2. **创建分支**：`git checkout -b feature/your-feature-name`
3. **提交更改**：`git commit -m 'feat: add some feature'`
4. **推送分支**：`git push origin feature/your-feature-name`
5. **发起Pull Request**：描述清楚更改内容和目的

### 代码审查
- 所有提交都需要经过代码审查
- 确保代码符合项目规范
- 添加必要的测试用例
- 更新相关文档

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)，您可以自由地使用、修改和分发本软件。

### 许可证摘要
- ✅ 商业使用
- ✅ 修改
- ✅ 分发
- ✅ 私人使用
- ❌ 责任（作者不承担任何责任）
- ❌ 担保（不提供任何担保）

## 🙏 致谢

感谢以下项目和工具的支持：
- [Tailwind CSS](https://tailwindcss.com/) - 现代化的CSS框架
- [Font Awesome](https://fontawesome.com/) - 优秀的图标库
- [http-server](https://github.com/http-party/http-server) - 轻量级HTTP服务器
- [Node.js](https://nodejs.org/) - JavaScript运行时环境

## 项目反馈

- **项目主页**：[https://github.com/OuOumm/network-speed-tester](https://github.com/OuOumm/network-speed-tester)
- **问题反馈**：[提交Issue](https://github.com/OuOumm/network-speed-tester/issues)

## 📈 更新日志

### v2.0.0 (2025-09-19)
- ✨ **全新架构**：采用ES6+ Class模块化重构
- 🎯 **智能单位**：流量显示自动切换MB/GB/TB单位
- ⚡ **性能优化**：requestAnimationFrame平滑更新，防抖节流处理
- 🎨 **UI升级**：Tailwind CSS现代化界面，响应式设计
- 📱 **移动适配**：完美支持移动端设备访问
- 🔧 **开发体验**：完整的JSDoc文档，TypeScript类型定义

### v1.0.0 (早期版本)
- 基础多线程下载功能
- 实时速度监控
- 简单进度显示
- 基础日志记录

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！

Made with ❤️ by OuOumm