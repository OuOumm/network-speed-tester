/**
 * 网络流量测试工具 - 主入口文件
 * @module app
 * @description 基于 NetworkTester 类的流量测试应用
 */

import NetworkTester from './network-tester.js';

/**
 * 应用主函数
 */
function main() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
        initializeApp();
    }
}

/**
 * 初始化应用
 */
function initializeApp() {
    // 创建网络测试器实例
    const tester = new NetworkTester();
    try {
        // 将实例挂载到全局对象，便于调试
        window.networkTester = tester;
        
        // 监听页面卸载事件，确保资源清理
        window.addEventListener('beforeunload', () => {
            if (tester && typeof tester.destroy === 'function') {
                tester.destroy();
            }
        });
        
        tester.log('[信息] 初始化网络测试工具成功[版本：1.0.0]，等待开始测试...');
    } catch (error) {
        tester.log('[错误] 初始化网络测试工具失败:', error);
        alert('初始化失败: ' + error.message);
    }   
}

// 启动应用
main();