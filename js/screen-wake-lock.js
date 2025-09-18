/**
 * 屏幕常亮管理器
 * @module ScreenWakeLock
 * @description 防止移动设备屏幕自动熄灭，支持后台运行
 */

/**
 * 屏幕常锁管理器类
 * @class ScreenWakeLock
 * @description 管理屏幕常亮状态，确保在应用运行时屏幕保持唤醒
 */
class ScreenWakeLock {
    /**
     * 创建屏幕常锁管理器实例
     */
    constructor() {
        /** @type {WakeLockSentinel|null} 屏幕唤醒锁对象 */
        this.wakeLock = null;
        
        /** @type {boolean} 是否支持屏幕唤醒锁API */
        this.isSupported = 'wakeLock' in navigator;
        
        /** @type {boolean} 是否处于激活状态 */
        this.isActive = false;
        
        /** @type {Function|null} 状态变化回调函数 */
        this.statusChangeCallback = null;
        
        /** @type {Function|null} 日志回调函数 */
        this.logCallback = null;
        
        /** @type {number} 重试次数 */
        this.retryCount = 0;
        
        /** @type {number} 最大重试次数 */
        this.maxRetries = 3;
        
        /** @type {number} 重试延迟（毫秒） */
        this.retryDelay = 1000;
        
        /** @type {number|null} 心跳定时器ID */
        this.heartbeatTimer = null;
        
        /** @type {number} 心跳间隔（毫秒） */
        this.heartbeatInterval = 30000; // 30秒
        
        /** @type {boolean} 是否启用后台运行支持 */
        this.backgroundSupport = true;
        
        this.setupVisibilityHandler();
    }

    /**
     * 设置页面可见性变化处理器
     * @private
     */
    setupVisibilityHandler() {
        // 监听页面可见性变化，在页面重新可见时重新获取唤醒锁
        document.addEventListener('visibilitychange', () => {
            if (this.isActive && !this.wakeLock) {
                this.acquireWakeLock();
            }
            
            // 页面变为可见时，确保心跳机制正常运行
            if (!document.hidden && this.isActive) {
                this.startHeartbeat();
            } else if (document.hidden && this.isActive && this.backgroundSupport) {
                // 页面进入后台但启用后台支持，继续心跳
                this.startHeartbeat();
            } else {
                // 停止心跳
                this.stopHeartbeat();
            }
        });

        // 监听页面焦点变化，确保在重新获得焦点时唤醒锁仍然有效
        window.addEventListener('focus', () => {
            if (this.isActive && !this.wakeLock) {
                this.acquireWakeLock();
            }
        });

        // 监听页面卸载事件，确保释放资源
        window.addEventListener('beforeunload', () => {
            this.deactivate();
        });

        // 监听在线/离线状态变化
        window.addEventListener('online', () => {
            if (this.isActive && !this.wakeLock) {
                this.acquireWakeLock();
            }
        });

        window.addEventListener('offline', () => {
            // 离线时保持心跳，等待恢复在线
            if (this.isActive && this.backgroundSupport) {
                this.startHeartbeat();
            }
        });
    }

    /**
     * 获取屏幕唤醒锁
     * @returns {Promise<boolean>} 是否成功获取唤醒锁
     */
    async acquireWakeLock() {
        if (!this.isSupported) {
            this.log('[屏幕常亮] 当前浏览器不支持屏幕唤醒锁API');
            this.notifyStatusChange('unsupported');
            return false;
        }

        try {
            // 释放之前的唤醒锁
            if (this.wakeLock) {
                await this.releaseWakeLock();
            }

            // 请求新的唤醒锁
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.isActive = true;
            this.retryCount = 0;

            // 监听唤醒锁释放事件
            this.wakeLock.addEventListener('release', () => {
                this.log('[屏幕常亮] 唤醒锁已释放');
                this.wakeLock = null;
                
                // 如果仍然需要保持激活状态，尝试重新获取
                if (this.isActive) {
                    this.handleWakeLockRelease();
                }
            });

            this.log('[屏幕常亮] 成功获取屏幕唤醒锁');
            this.notifyStatusChange('acquired');
            
            // 启动心跳机制
            this.startHeartbeat();
            
            return true;

        } catch (error) {
            this.log('[屏幕常亮] 获取屏幕唤醒锁失败: ' + error);
            this.handleWakeLockError(error);
            return false;
        }
    }

    /**
     * 释放屏幕唤醒锁
     * @returns {Promise<void>}
     */
    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                this.isActive = false;
                this.log('[屏幕常亮] 已释放屏幕唤醒锁');
                this.notifyStatusChange('released');
            } catch (error) {
                this.log('[屏幕常亮] 释放屏幕唤醒锁失败: ' + error);
            }
        }
    }

    /**
     * 处理唤醒锁释放事件
     * @private
     */
    async handleWakeLockRelease() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.log(`[屏幕常亮] 尝试重新获取唤醒锁 (${this.retryCount}/${this.maxRetries})`);
            
            // 延迟后重试
            setTimeout(() => {
                if (this.isActive) {
                    this.acquireWakeLock();
                }
            }, this.retryDelay);
        } else {
            this.log('[屏幕常亮] 已达到最大重试次数，停止尝试获取唤醒锁');
            this.notifyStatusChange('failed');
        }
    }

    /**
     * 处理唤醒锁错误
     * @private
     * @param {Error} error - 错误对象
     */
    handleWakeLockError(error) {
        const errorMessage = error.message || error.toString();
        
        // 常见的错误类型和处理
        if (errorMessage.includes('NotAllowedError')) {
            this.log('[屏幕常亮] 用户或系统拒绝了屏幕唤醒锁请求');
        } else if (errorMessage.includes('NotSupportedError')) {
            this.log('[屏幕常亮] 当前环境不支持屏幕唤醒锁');
        } else if (errorMessage.includes('AbortError')) {
            this.log('[屏幕常亮] 屏幕唤醒锁请求被中止');
        } else {
            this.log('[屏幕常亮] 获取屏幕唤醒锁时发生未知错误: ' + error);
        }

        this.notifyStatusChange('error', error);
    }

    /**
     * 设置状态变化回调
     * @param {Function} callback - 状态变化回调函数
     */
    setStatusChangeCallback(callback) {
        this.statusChangeCallback = callback;
    }

    /**
     * 通知状态变化
     * @private
     * @param {string} status - 状态类型
     * @param {*} data - 附加数据
     */
    notifyStatusChange(status, data = null) {
        if (this.statusChangeCallback) {
            this.statusChangeCallback(status, data);
        }
    }

    /**
     * 激活屏幕常亮功能
     * @returns {Promise<boolean>} 是否成功激活
     */
    async activate() {
        if (this.isActive) {
            this.log('[屏幕常亮] 屏幕常亮功能已激活');
            return true;
        }

        const success = await this.acquireWakeLock();
        return success;
    }

    /**
     * 停用屏幕常亮功能
     * @returns {Promise<void>}
     */
    async deactivate() {
        this.isActive = false;
        
        // 停止心跳机制
        this.stopHeartbeat();
        
        await this.releaseWakeLock();
    }

    /**
     * 获取当前状态
     * @returns {Object} 当前状态信息
     */
    getStatus() {
        return {
            isSupported: this.isSupported,
            isActive: this.isActive,
            hasWakeLock: !!this.wakeLock,
            retryCount: this.retryCount,
            maxRetries: this.maxRetries
        };
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.deactivate();
        this.statusChangeCallback = null;
        
        // 清理事件监听器
        document.removeEventListener('visibilitychange', this.setupVisibilityHandler);
        window.removeEventListener('focus', this.setupVisibilityHandler);
        window.removeEventListener('beforeunload', this.setupVisibilityHandler);
        window.removeEventListener('online', this.setupVisibilityHandler);
        window.removeEventListener('offline', this.setupVisibilityHandler);
    }

    /**
     * 开始心跳机制
     * @private
     */
    startHeartbeat() {
        this.stopHeartbeat(); // 先停止之前的心跳
        
        if (!this.isActive) return;
        
        this.heartbeatTimer = setInterval(() => {
            if (!this.isActive) {
                this.stopHeartbeat();
                return;
            }
            
            // 心跳逻辑：检查唤醒锁状态并尝试重新获取
            this.performHeartbeat();
        }, this.heartbeatInterval);
        
        this.log('[屏幕常亮] 心跳机制已启动');
    }

    /**
     * 停止心跳机制
     * @private
     */
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
            this.log('[屏幕常亮] 心跳机制已停止');
        }
    }

    /**
     * 执行心跳检查
     * @private
     */
    async performHeartbeat() {
        try {
            // 检查当前状态
            const isVisible = !document.hidden;
            const isOnline = navigator.onLine;
            
            // 如果唤醒锁丢失且应该保持激活状态，尝试重新获取
            if (this.isActive && !this.wakeLock) {
                if (isOnline) {
                    this.log('[屏幕常亮] 心跳检测到唤醒锁丢失，尝试重新获取');
                    await this.acquireWakeLock();
                } else if (this.backgroundSupport) {
                    // 离线但启用后台支持，记录状态
                    this.log('[屏幕常亮] 心跳检测到离线状态，等待网络恢复');
                }
            }
            
            // 后台运行时的特殊处理
            if (!isVisible && this.isActive && this.backgroundSupport) {
                // 在后台运行时，使用备用方法保持活跃
                this.maintainBackgroundActivity();
            }
            
        } catch (error) {
            this.log('[屏幕常亮] 心跳检查失败: ' + error);
        }
    }

    /**
     * 维持后台活动
     * @private
     */
    maintainBackgroundActivity() {
        // 使用多种技术确保在后台运行时保持活跃
        try {
            // 1. 使用Service Worker消息（如果可用）
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'keepAlive',
                    timestamp: Date.now()
                });
            }
            
            // 2. 使用fetch API的keepalive选项
            if (navigator.onLine) {
                fetch('data:text/plain,keepalive', {
                    method: 'GET',
                    keepalive: true,
                    mode: 'no-cors'
                }).catch(() => {
                    // 忽略网络错误
                });
            }
            
            // 3. 使用Web Audio API（某些浏览器支持）
            if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioContext.state === 'suspended') {
                        audioContext.resume().catch(() => {});
                    }
                    // 创建静默音频
                    const oscillator = audioContext.createOscillator();
                    oscillator.frequency.value = 0; // 无声
                    oscillator.connect(audioContext.destination);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                } catch (e) {
                    // 忽略音频相关错误
                }
            }
            
            this.log('[屏幕常亮] 后台活动维持已执行');
            
        } catch (error) {
            this.log('[屏幕常亮] 维持后台活动失败: ' + error);
        }
    }

    /**
     * 设置后台运行支持
     * @param {boolean} enabled - 是否启用后台运行支持
     */
    setBackgroundSupport(enabled) {
        this.backgroundSupport = enabled;
        
        if (enabled && this.isActive) {
            // 如果启用后台支持且当前激活，确保心跳机制运行
            this.startHeartbeat();
        } else if (!enabled) {
            // 如果禁用后台支持，停止心跳
            this.stopHeartbeat();
        }
        
        this.log(`[屏幕常亮] 后台运行支持已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 设置心跳间隔
     * @param {number} interval - 心跳间隔（毫秒）
     */
    setHeartbeatInterval(interval) {
        this.heartbeatInterval = Math.max(5000, interval); // 最小5秒
        
        // 如果心跳正在运行，重启以应用新间隔
        if (this.heartbeatTimer) {
            this.stopHeartbeat();
            this.startHeartbeat();
        }
    }

    /**
     * 获取屏幕唤醒锁（别名方法）
     * @returns {Promise<boolean>} 是否成功获取
     */
    async acquire() {
        return await this.acquireWakeLock();
    }

    /**
     * 释放屏幕唤醒锁（别名方法）
     * @returns {Promise<void>}
     */
    async release() {
        await this.releaseWakeLock();
    }
    /**
     * 设置日志回调
     * @param {Function} callback - 日志回调函数
     */
    setLogCallback(callback) {
        this.logCallback = callback;
    }

    /**
     * 记录日志
     * @private
     * @param {string} message - 日志消息
     */
    log(message) {
        if (this.logCallback) {
            this.logCallback(message);
        } else {
            // 如果没有设置日志回调，使用控制台输出
            console.log(message);
        }
    }
}

export default ScreenWakeLock;