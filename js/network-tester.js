/**
 * 网络流量测试工具
 * @module NetworkTester
 * @description 多线程网络流量测试工具，支持实时速度监控和流量控制
 */

import ScreenWakeLock from './screen-wake-lock.js';

/**
 * 测试节点配置
 * @typedef {Object} TestNode
 * @property {string} id - 节点ID
 * @property {string} name - 节点名称
 * @property {string} url - 测试URL
 */

/**
 * 测试线程状态
 * @typedef {Object} TestThread
 * @property {number} id - 线程ID
 * @property {string} url - 测试URL
 * @property {AbortController} controller - 中止控制器
 * @property {number} downloaded - 已下载字节数
 * @property {boolean} isActive - 是否活跃
 */

/**
 * IP信息
 * @typedef {Object} IPInfo
 * @property {string} domestic - 国内IP
 * @property {string} foreign - 国外IP
 */

/**
 * 流量单位配置
 * @typedef {Object} UnitMultiplier
 * @property {number} MB - MB到字节的乘数
 * @property {number} GB - GB到字节的乘数
 * @property {number} TB - TB到字节的乘数
 */

/**
 * 网络流量测试器类
 */
class NetworkTester {
    /**
     * 创建网络测试器实例
     */
    constructor() {
        /** @type {TestNode[]} 预设测试节点 */
        this.testNodes = [
            { id: 'cn1', name: '百度APK', url: 'https://issuecdn.baidupcs.com/issue/netdisk/apk/BaiduNetdisk_11.44.3.apk' },
            { id: 'cn2', name: '淘宝CDN', url: 'https://cloud.video.taobao.com/play/u/null/p/1/e/6/t/1/441113371921.mpv' },
            { id: 'us1', name: 'Cloudflare', url: 'https://speed.cloudflare.com/__down?bytes=1073741824' },
            { id: 'custom', name: '自定义节点', url: '' }
        ];

        /** @type {UnitMultiplier} 流量单位乘数 */
        this.unitMultipliers = {
            'MB': 1024 * 1024,
            'GB': 1024 * 1024 * 1024,
            'TB': 1024 * 1024 * 1024 * 1024
        };

        /** @type {IPInfo} IP信息 */
        this.ipInfo = { domestic: '', foreign: '' };

        /** @type {TestThread[]} 活跃测试线程 */
        this.activeThreads = [];

        /** @type {boolean} 是否正在测试 */
        this.isTesting = false;

        /** @type {number} 总下载字节数 */
        this.totalDownloaded = 0;

        /** @type {number} 目标流量字节数 */
        this.targetTrafficBytes = 0;

        /** @type {number} 测试开始时间 */
        this.startTime = 0;

        /** @type {number} 最后更新时间 */
        this.lastUpdateTime = 0;

        /** @type {number} 最后记录的下载量 */
        this.lastDownloaded = 0;

        /** @type {number[]} 速度历史记录 */
        this.speedHistory = [];

        /** @type {number} 速度平滑窗口大小 */
        this.speedSmoothingWindow = 10;

        /** @type {number} 更新间隔（毫秒） */
        this.updateInterval = 100;

        /** @type {number|null} 更新定时器ID */
        this.updateTimer = null;

        /** @type {ScreenWakeLock} 屏幕常亮管理器 */
        this.screenWakeLock = new ScreenWakeLock();

        // 设置日志回调，让ScreenWakeLock使用NetworkTester的日志系统
        this.screenWakeLock.setLogCallback((message) => {
            this.log(message);
        });

        // 启用后台运行支持
        this.screenWakeLock.setBackgroundSupport(true);
        this.screenWakeLock.setHeartbeatInterval(20000); // 20秒心跳间隔

        this.init();
    }

    /**
     * 初始化屏幕常亮功能
     * @private
     */
    initScreenWakeLock() {
        // 设置状态变化回调
        this.screenWakeLock.setStatusChangeCallback((status, data) => {
            switch (status) {
                case 'acquired':
                    this.log('[屏幕常亮] 屏幕唤醒锁已激活');
                    break;
                case 'released':
                    this.log('[屏幕常亮] 屏幕唤醒锁已释放');
                    break;
                case 'failed':
                    this.log('[屏幕常亮] 屏幕唤醒锁获取失败');
                    break;
                case 'unsupported':
                    this.log('[屏幕常亮] 当前浏览器不支持屏幕唤醒锁功能');
                    break;
                case 'error':
                    this.log(`[屏幕常亮] 发生错误: ${data?.message || '未知错误'}`);
                    break;
            }
        });
    }

    /**
     * 初始化测试器
     */
    async init() {
        try {
            // 首先绑定DOM元素
            this.bindElements();
            
            await this.fetchIPInfo();
            this.populateTestNodes();
            this.bindEvents();
            this.initScreenWakeLock(); // 初始化屏幕常亮功能
            this.log('[信息] 网络测试器初始化完成');
        } catch (error) {
            this.log(`[错误] 初始化失败: ${error.message}`);
        }
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        const elements = {
            startBtn: 'startBtn',
            stopBtn: 'stopBtn',
            clearLogBtn: 'clearLog',
            helpBtn: 'helpBtn',
            closeHelpBtn: 'closeHelp',
            helpModal: 'helpModal',
            helpModalContent: 'helpModalContent',
            speedNodeSelect: 'speedNode',
            customNodeContainer: 'customNodeContainer',
            customNodeUrl: 'customNodeUrl',
            threadCountInput: 'threadCount',
            trafficLimitInput: 'trafficLimit',
            trafficUnitSelect: 'trafficUnit',
            domesticIPElement: 'domesticIP',
            foreignIPElement: 'foreignIP',
            nodeLatencyElement: 'nodeLatency',
            downloadSpeedElement: 'downloadSpeed',
            trafficUsedElement: 'trafficUsed',
            progressElement: 'progress',
            progressBarElement: 'progressBar',
            testLogElement: 'testLog'
        };

        this.elements = {};
        Object.keys(elements).forEach(key => {
            this.elements[key] = document.getElementById(elements[key]);
        });
    }

    /**
     * 填充测试节点下拉菜单
     */
    populateTestNodes() {
        this.testNodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.name;
            this.elements.speedNodeSelect.appendChild(option);
        });
    }

    /**
     * 获取IP地址信息
     */
    async fetchIPInfo() {
        try {
            // 获取国内IP
            const domesticResponse = await fetch('https://myip.ipip.net/json');
            const domesticData = await domesticResponse.json();
            this.ipInfo.domestic = domesticData.data.ip;
            this.elements.domesticIPElement.textContent = this.ipInfo.domestic;
        } catch (error) {
            this.elements.domesticIPElement.textContent = '获取失败';
            this.log(`[错误] 国内IP获取失败: ${error.message}`);
        }

        try {
            // 获取国外IP
            const foreignResponse = await fetch('https://api.ipify.org?format=json');
            const foreignData = await foreignResponse.json();
            this.ipInfo.foreign = foreignData.ip;
            this.elements.foreignIPElement.textContent = this.ipInfo.foreign;
        } catch (error) {
            this.elements.foreignIPElement.textContent = '获取失败';
            this.log(`[错误] 国外IP获取失败: ${error.message}`);
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.startTest());
        this.elements.stopBtn.addEventListener('click', () => this.stopTest());
        this.elements.clearLogBtn.addEventListener('click', () => this.clearLog());
        this.elements.helpBtn.addEventListener('click', () => this.openHelpModal());
        this.elements.closeHelpBtn.addEventListener('click', () => this.closeHelpModal());
        this.elements.speedNodeSelect.addEventListener('change', () => this.handleNodeChange());
        this.elements.domesticIPElement.addEventListener('click', (e) => this.copyToClipboard(e));
        this.elements.foreignIPElement.addEventListener('click', (e) => this.copyToClipboard(e));

        // 点击模态框外部关闭
        this.elements.helpModal.addEventListener('click', (e) => {
            if (e.target === this.elements.helpModal) {
                this.closeHelpModal();
            }
        });
    }

    /**
     * 处理节点选择变化
     */
    handleNodeChange() {
        const selectedNodeId = this.elements.speedNodeSelect.value;
        const selectedNode = this.testNodes.find(node => node.id === selectedNodeId);

        if (selectedNode && selectedNode.id === 'custom') {
            this.elements.customNodeContainer.classList.remove('hidden');
            this.elements.nodeLatencyElement.textContent = '--ms';
        } else {
            this.elements.customNodeContainer.classList.add('hidden');
            if (selectedNode && selectedNode.url) {
                this.testNodeLatency(selectedNode.url);
            } else {
                this.elements.nodeLatencyElement.textContent = '--ms';
            }
        }
    }

    /**
     * 测试节点延迟
     * @param {string} url - 测试URL
     */
    testNodeLatency(url) {
        if (!url) return;

        const startTime = performance.now();
        const img = new Image();

        img.onload = img.onerror = () => {
            const latency = Math.round(performance.now() - startTime);
            this.elements.nodeLatencyElement.textContent = `${latency}ms`;
        };

        // 使用随机参数避免缓存
        const timestamp = new Date().getTime();
        img.src = `${url}?t=${timestamp}`;
    }

    /**
     * 验证测试参数
     * @returns {Object|null} 验证结果或null
     */
    validateTestParams() {
        const selectedNodeId = this.elements.speedNodeSelect.value;
        if (!selectedNodeId) {
            this.log('[错误] 请选择测试节点');
            return null;
        }

        let testUrl = '';
        if (selectedNodeId === 'custom') {
            testUrl = this.elements.customNodeUrl.value.trim();
            if (!testUrl) {
                this.log('[错误] 请输入自定义节点URL');
                return null;
            }
            const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
            if (!urlPattern.test(testUrl)) {
                this.log('[错误] 请输入正确的URL格式 (如: https://example.com)');
                return null;
            }
        } else {
            const selectedNode = this.testNodes.find(node => node.id === selectedNodeId);
            if (selectedNode) {
                testUrl = selectedNode.url;
            }
        }

        const threadCount = parseInt(this.elements.threadCountInput.value);
        if (isNaN(threadCount) || threadCount < 1 || threadCount > 16) {
            this.log('[错误] 请设置有效的线程数量 (1-16)');
            return null;
        }

        const trafficLimit = parseFloat(this.elements.trafficLimitInput.value);
        const trafficUnit = this.elements.trafficUnitSelect.value;
        if (isNaN(trafficLimit) || trafficLimit <= 0) {
            this.log('[错误] 请设置有效的目标流量');
            return null;
        }

        return {
            testUrl,
            threadCount,
            trafficLimit,
            trafficUnit
        };
    }

    /**
     * 开始测试
     */
    async startTest() {
        if (this.isTesting) return;

        const params = this.validateTestParams();
        if (!params) return;

        const { testUrl, threadCount, trafficLimit, trafficUnit } = params;

        // 转换为字节
        this.targetTrafficBytes = trafficLimit * this.unitMultipliers[trafficUnit];

        // 重置测试状态
        this.isTesting = true;
        this.totalDownloaded = 0;
        this.lastDownloaded = 0;
        this.speedHistory = [];
        this.startTime = Date.now();
        this.lastUpdateTime = this.startTime;
        this.activeThreads = [];

        // 更新UI状态
        this.updateUIState(true);

        // 激活屏幕常亮功能
        await this.screenWakeLock.acquire();

        // 记录开始日志
        this.log(`[信息] 开始测试，节点: ${this.getSelectedNodeName()}, 线程: ${threadCount}, 目标流量: ${trafficLimit}${trafficUnit}`);

        // 创建测试线程
        for (let i = 0; i < threadCount; i++) {
            this.createTestThread(i, testUrl);
        }

        // 开始更新进度
        this.startProgressUpdate();
    }

    /**
     * 创建测试线程
     * @param {number} threadId - 线程ID
     * @param {string} baseUrl - 基础URL
     */
    createTestThread(threadId, baseUrl) {
        // 添加随机参数避免缓存
        const randomParam = Math.random().toString(36).substring(7);
        const testUrl = `${baseUrl}?thread=${threadId}&r=${randomParam}&t=${Date.now()}`;

        const thread = {
            id: threadId,
            url: testUrl,
            controller: new AbortController(),
            downloaded: 0,
            isActive: true
        };

        this.activeThreads.push(thread);

        // 开始下载
        this.downloadFile(testUrl, thread)
            .catch(error => {
                if (error.name !== 'AbortError') {
                    this.log(`[线程 ${threadId}] 错误: ${error.message}`);
                }
                thread.isActive = false;
                this.checkAllThreadsCompleted();
            });
    }

    /**
     * 下载文件
     * @param {string} url - 文件URL
     * @param {TestThread} thread - 测试线程
     */
    async downloadFile(url, thread) {
        const response = await fetch(url, {
            signal: thread.controller.signal,
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        this.log(`[线程 ${thread.id}] 连接成功，开始下载`);

        await this.readStream(reader, thread);
    }

    /**
     * 读取流数据
     * @param {ReadableStreamDefaultReader} reader - 流读取器
     * @param {TestThread} thread - 测试线程
     */
    async readStream(reader, thread) {
        try {
            while (this.isTesting && thread.isActive) {
                const { done, value } = await reader.read();

                if (done) {
                    this.log(`[线程 ${thread.id}] 完成下载，重新连接...`);
                    
                    // 下载完成后重新连接以继续测试
                    setTimeout(() => {
                        if (this.isTesting) {
                            this.reconnectThread(thread);
                        }
                    }, 1000);
                    return;
                }

                if (value) {
                    const chunkSize = value.byteLength;
                    thread.downloaded += chunkSize;
                    this.totalDownloaded += chunkSize;

                    // 检查是否达到目标流量
                    if (this.totalDownloaded >= this.targetTrafficBytes) {
                        this.stopTest();
                        this.log(`[信息] 已达到目标流量 ${this.formatBytes(this.targetTrafficBytes)}`);
                        return;
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                throw error;
            }
        }
    }

    /**
     * 重新连接线程
     * @param {TestThread} thread - 测试线程
     */
    reconnectThread(thread) {
        // 移除旧线程
        this.activeThreads = this.activeThreads.filter(t => t.id !== thread.id);
        
        // 创建新线程
        const baseUrl = thread.url.split('?')[0];
        this.createTestThread(thread.id, baseUrl);
    }

    /**
     * 检查所有线程是否已完成
     */
    checkAllThreadsCompleted() {
        const allInactive = this.activeThreads.every(thread => !thread.isActive);
        if (allInactive && this.isTesting) {
            this.log('[警告] 所有线程已中断，测试将停止');
            this.stopTest();
        }
    }

    /**
     * 开始进度更新
     */
    startProgressUpdate() {
        const update = () => {
            if (!this.isTesting) return;
            
            this.updateProgress();
            this.updateTimer = setTimeout(update, this.updateInterval);
        };
        update();
    }

    /**
     * 更新进度
     */
    updateProgress() {
        const now = Date.now();
        const interval = now - this.lastUpdateTime;

        // 计算当前速度 (字节/秒)
        const downloadedInInterval = this.totalDownloaded - this.lastDownloaded;
        const currentSpeed = interval > 0 ? (downloadedInInterval / (interval / 1000)) : 0;

        // 保存速度历史用于平滑计算
        this.speedHistory.push(currentSpeed);
        if (this.speedHistory.length > this.speedSmoothingWindow) {
            this.speedHistory.shift();
        }

        // 计算平均速度
        const averageSpeed = this.speedHistory.reduce((sum, speed) => sum + speed, 0) / this.speedHistory.length;

        // 更新UI
        this.updateProgressUI(averageSpeed);

        // 更新最后记录时间和下载量
        this.lastUpdateTime = now;
        this.lastDownloaded = this.totalDownloaded;
    }

    /**
     * 更新进度UI
     * @param {number} speed - 平均速度（字节/秒）
     */
    updateProgressUI(speed) {
        const speedMBps = speed / (1024 * 1024);
        const { value: trafficValue, unit: trafficUnit } = this.formatTrafficDisplay(this.totalDownloaded);
        const progress = Math.min(100, (this.totalDownloaded / this.targetTrafficBytes) * 100);

        this.elements.downloadSpeedElement.textContent = speedMBps.toFixed(2) + ' MB/s';
        this.elements.trafficUsedElement.textContent = `${trafficValue.toFixed(2)} ${trafficUnit}`;
        this.elements.progressElement.textContent = progress.toFixed(1) + ' %';
        this.elements.progressBarElement.style.width = `${progress}%`;
    }

    /**
     * 更新UI状态
     * @param {boolean} isTesting - 是否正在测试
     */
    updateUIState(isTesting) {
        this.elements.startBtn.disabled = isTesting;
        this.elements.stopBtn.disabled = !isTesting;
        this.elements.speedNodeSelect.disabled = isTesting;
        this.elements.threadCountInput.disabled = isTesting;
        this.elements.trafficLimitInput.disabled = isTesting;
        this.elements.trafficUnitSelect.disabled = isTesting;
        this.elements.customNodeUrl.disabled = isTesting;
    }

    /**
     * 停止测试
     */
    async stopTest() {
        if (!this.isTesting) return;

        // 标记测试为停止
        this.isTesting = false;

        // 清除更新定时器
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }

        // 终止所有线程
        this.activeThreads.forEach(thread => {
            thread.controller.abort();
            thread.isActive = false;
            this.log(`[线程 ${thread.id}] 已停止`);
        });

        this.activeThreads = [];

        // 计算总耗时和平均速度
        const totalTime = (Date.now() - this.startTime) / 1000; // 秒
        const avgSpeed = totalTime > 0 ? (this.totalDownloaded / totalTime) / (1024 * 1024) : 0;

        // 确保进度UI更新到最终状态
        this.updateProgressUI((this.totalDownloaded / totalTime));

        this.log(`[信息] 测试已停止，总耗时: ${this.formatTime(totalTime)}, 平均速度: ${avgSpeed.toFixed(2)} MB/s, 总流量: ${this.formatBytes(this.totalDownloaded)}`);

        // 重置UI状态
        this.updateUIState(false);

        // 释放屏幕常亮功能
        await this.screenWakeLock.release();
    }

    /**
     * 记录日志
     * @param {string} message - 日志消息
     */
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'mb-1 border-b border-gray-100 pb-1 last:border-0 last:mb-0 last:pb-0';
        logEntry.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;

        // 安全检查：确保元素已绑定
        if (this.elements && this.elements.testLogElement) {
            this.elements.testLogElement.appendChild(logEntry);
            this.elements.testLogElement.scrollTop = this.elements.testLogElement.scrollHeight;
        } else {
            // 如果元素还未绑定，延迟执行或输出到控制台
            console.log(`[NetworkTester] ${message}`);
            
            // 延迟添加到DOM（如果元素稍后可用）
            setTimeout(() => {
                if (this.elements && this.elements.testLogElement) {
                    this.elements.testLogElement.appendChild(logEntry);
                    this.elements.testLogElement.scrollTop = this.elements.testLogElement.scrollHeight;
                }
            }, 1000);
        }
    }

    /**
     * 清空日志
     */
    clearLog() {
        this.elements.testLogElement.innerHTML = '<div class="text-slate-500">日志已清空</div>';
    }

    /**
     * 打开帮助模态框
     */
    openHelpModal() {
        this.elements.helpModal.classList.remove('hidden');
        this.elements.helpModal.classList.add('flex');

        // 触发动画
        setTimeout(() => {
            this.elements.helpModal.classList.remove('opacity-0');
            this.elements.helpModalContent.classList.remove('scale-95', 'opacity-0');
            this.elements.helpModalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    /**
     * 关闭帮助模态框
     */
    closeHelpModal() {
        this.elements.helpModal.classList.add('opacity-0');
        this.elements.helpModalContent.classList.remove('scale-100', 'opacity-100');
        this.elements.helpModalContent.classList.add('scale-95', 'opacity-0');

        // 完全隐藏模态框
        setTimeout(() => {
            this.elements.helpModal.classList.remove('flex');
            this.elements.helpModal.classList.add('hidden');
        }, 300);
    }

    /**
     * 复制到剪贴板
     * @param {Event} event - 点击事件
     */
    async copyToClipboard(event) {
        const text = event.target.textContent;
        try {
            await navigator.clipboard.writeText(text);
            const originalText = event.target.textContent;
            event.target.textContent = '已复制!';

            setTimeout(() => {
                event.target.textContent = originalText;
            }, 2000);
        } catch (error) {
            this.log(`[错误] 复制失败: ${error.message}`);
        }
    }

    /**
     * 获取选中节点名称
     * @returns {string} 节点名称
     */
    getSelectedNodeName() {
        const selectedNodeId = this.elements.speedNodeSelect.value;
        const selectedNode = this.testNodes.find(node => node.id === selectedNodeId);

        if (selectedNode && selectedNode.id === 'custom') {
            return '自定义节点';
        } else if (selectedNode) {
            return selectedNode.name;
        }

        return '未知节点';
    }

    /**
     * 格式化流量显示，自动选择合适的单位
     * @param {number} bytes - 字节数
     * @returns {Object} 包含数值和单位的对象 {value: number, unit: string}
     */
    formatTrafficDisplay(bytes) {
        if (bytes === 0) return { value: 0, unit: 'MB' };

        const k = 1024;
        const sizes = ['MB', 'GB', 'TB'];
        
        // 计算合适的单位级别（从MB开始）
        let i = 0;
        let value = bytes / (k * k); // 先转换为MB
        
        while (value >= k && i < sizes.length - 1) {
            value /= k;
            i++;
        }

        return { value, unit: sizes[i] };
    }

    /**
     * 格式化字节为人类可读格式
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的字符串
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化时间
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     */
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds.toFixed(1)}秒`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}分${secs.toFixed(0)}秒`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            return `${hours}时${mins}分${secs.toFixed(0)}秒`;
        }
    }

    /**
     * 销毁测试器
     */
    destroy() {
        this.stopTest();
        // 清理事件监听器
        if (this.elements && typeof this.elements === 'object') {
            Object.keys(this.elements).forEach(key => {
                const element = this.elements[key];
                if (element && element.cloneNode) {
                    element.replaceWith(element.cloneNode(true));
                }
            });
        }
    }
}

// 导出类以供外部使用
export default NetworkTester;