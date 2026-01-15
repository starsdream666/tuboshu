/**
 * Silly Tavern 自动认证脚本 - 调试版
 * 功能：检测到401认证错误时自动认证，认证后自动清理URL
 * 特点：增加详细的调试信息输出
 */

(function() {
    'use strict';
    
    // ===== 配置区域 =====
    const USERNAME = 'star';
    const PASSWORD = 'boyu123456789';
    const CLEANUP_DELAY = 2000; // 认证后等待时间（毫秒）
    // ===== 配置区域结束 =====
    
    let processed = false;
    let checkCount = 0;
    
    // 调试日志函数
    function debugLog(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[DEBUG-Auth ${timestamp}] ${message}`, data || '');
    }
    
    // 检测当前URL是否包含凭证
    function hasCredentials() {
        const url = window.location.href;
        const hasAt = url.includes('@');
        const hasPattern = /@[^\/]+\//.test(url);
        debugLog(`URL凭证检测:`, {
            url: url,
            hasAt: hasAt,
            hasPattern: hasPattern,
            result: hasAt && hasPattern
        });
        return hasAt && hasPattern;
    }
    
    // 构建带凭证的URL
    function buildAuthUrl() {
        const url = window.location.href;
        const urlObj = new URL(url);
        const cleanHost = urlObj.host.replace(/^[^@]*@/, '');
        const authUrl = `${urlObj.protocol}//${USERNAME}:${PASSWORD}@${cleanHost}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        debugLog(`构建认证URL:`, {
            原始URL: url,
            清理后Host: cleanHost,
            认证URL: authUrl.replace(PASSWORD, '****')
        });
        return authUrl;
    }
    
    // 构建清理后的URL
    function buildCleanUrl() {
        const url = window.location.href;
        const urlObj = new URL(url);
        const cleanHost = urlObj.host.replace(/^[^@]*@/, '');
        const cleanUrl = `${urlObj.protocol}//${cleanHost}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
        debugLog(`构建清理URL:`, {
            原始URL: url,
            清理后URL: cleanUrl
        });
        return cleanUrl;
    }
    
    // 检测是否为401错误
    function is401Error() {
        const bodyText = document.body ? document.body.innerText : '';
        const title = document.title || '';
        const html = document.documentElement ? document.documentElement.innerHTML : '';
        
        const checks = {
            bodyText: bodyText.slice(0, 200),
            title: title,
            has401InBody: /401/i.test(bodyText),
            hasUnauthorizedInBody: /Unauthorized/i.test(bodyText),
            has身份验证InBody: /身份验证/i.test(bodyText),
            hasBasicAuthInBody: /basicAuthUser/i.test(bodyText),
            has401InTitle: /401/i.test(title),
            hasUnauthorizedInTitle: /Unauthorized/i.test(title),
            has401InHTML: /401/i.test(html),
            hasUnauthorizedInHTML: /Unauthorized/i.test(html)
        };
        
        const result = checks.has401InBody || checks.hasUnauthorizedInBody || 
                      checks.has身份验证InBody || checks.hasBasicAuthInBody ||
                      checks.has401InTitle || checks.hasUnauthorizedInTitle ||
                      checks.has401InHTML || checks.hasUnauthorizedInHTML;
        
        debugLog(`401错误检测:`, {
            ...checks,
            最终结果: result
        });
        
        return result;
    }
    
    // 执行认证
    function doAuth() {
        if (processed) {
            debugLog('认证已处理，跳过');
            return;
        }
        processed = true;
        
        debugLog('开始执行认证流程');
        const authUrl = buildAuthUrl();
        
        debugLog(`准备跳转到认证URL，0.5秒后执行`);
        setTimeout(() => {
            debugLog('执行跳转到认证URL');
            window.location.href = authUrl;
        }, 500);
    }
    
    // 执行清理
    function doCleanup() {
        if (processed) {
            debugLog('清理已处理，跳过');
            return;
        }
        processed = true;
        
        debugLog(`开始执行清理流程，${CLEANUP_DELAY/1000}秒后清理URL`);
        
        setTimeout(() => {
            const cleanUrl = buildCleanUrl();
            debugLog('执行跳转到清理URL');
            window.location.href = cleanUrl;
        }, CLEANUP_DELAY);
    }
    
    // 主检查逻辑
    function mainCheck() {
        checkCount++;
        debugLog(`第${checkCount}次检查 - 页面状态:`, {
            readyState: document.readyState,
            URL: window.location.href,
            processed: processed
        });
        
        if (processed) {
            debugLog('已处理过，跳过检查');
            return;
        }
        
        const hasCredentials = hasCredentials();
        const is401 = is401Error();
        
        debugLog('检查结果:', {
            hasCredentials: hasCredentials,
            is401Error: is401,
            处理状态: processed
        });
        
        if (hasCredentials) {
            debugLog('条件匹配：检测到凭证URL，执行清理');
            doCleanup();
        } else if (is401) {
            debugLog('条件匹配：检测到401错误，执行认证');
            doAuth();
        } else {
            debugLog('无匹配条件，页面正常');
        }
    }
    
    // 初始化
    function init() {
        debugLog('脚本初始化开始');
        debugLog('配置信息:', {
            USERNAME: USERNAME,
            CLEANUP_DELAY: CLEANUP_DELAY,
            当前URL: window.location.href,
            页面标题: document.title
        });
        
        // 立即检查一次
        mainCheck();
        
        // 页面加载完成后检查
        if (document.readyState === 'loading') {
            debugLog('页面还在加载，添加DOMContentLoaded监听');
            document.addEventListener('DOMContentLoaded', () => {
                debugLog('DOMContentLoaded触发');
                mainCheck();
            });
        }
        
        // 定期检查（前10秒每2秒检查一次）
        let intervalCount = 0;
        const checkInterval = setInterval(() => {
            intervalCount++;
            debugLog(`定时检查 #${intervalCount}`);
            
            if (processed || intervalCount >= 5) {
                debugLog('停止定时检查', { processed, intervalCount });
                clearInterval(checkInterval);
                return;
            }
            
            mainCheck();
        }, 2000);
        
        debugLog('脚本初始化完成');
    }
    
    // 启动脚本
    init();
})();
