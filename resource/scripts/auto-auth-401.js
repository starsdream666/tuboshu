/**
 * Silly Tavern 自动认证脚本
 * 功能：检测到401认证错误时，自动使用用户名:密码@网址的方式重新访问
 * 使用方式：在Tuboshu中添加网站时，将此脚本内容复制到"JS脚本"字段
 */

(function() {
    'use strict';
    
    // 配置信息
    const CONFIG = {
        username: 'star',
        password: 'boyu123456789',
        maxRetries: 1,
        retryDelay: 500
    };
    
    // 状态管理
    let authAttempted = false;
    let currentRetryCount = 0;
    
    /**
     * 从当前URL中提取基础URL（不包含凭证）
     */
    function getCleanUrl() {
        const url = window.location.href;
        // 移除已存在的凭证
        return url.replace(/^(https?:\/\/)([^:@]+):([^@]+)@/, '$1');
    }
    
    /**
     * 构建带凭证的URL
     */
    function getAuthenticatedUrl() {
        const cleanUrl = getCleanUrl();
        const urlObj = new URL(cleanUrl);
        return `${urlObj.protocol}//${CONFIG.username}:${CONFIG.password}@${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    
    /**
     * 检测页面是否返回401错误
     */
    function is401Error() {
        // 方法1：检查HTTP状态码（通过fetch拦截）
        // 方法2：检查页面内容中的401标记
        const bodyText = document.body.innerText || '';
        const htmlText = document.documentElement.innerHTML || '';
        
        return (
            bodyText.includes('401') ||
            bodyText.includes('Unauthorized') ||
            bodyText.includes('身份验证') ||
            htmlText.includes('401') ||
            htmlText.includes('Unauthorized') ||
            document.title.includes('401') ||
            document.title.includes('Unauthorized')
        );
    }
    
    /**
     * 执行自动认证
     */
    function performAutoAuth() {
        if (authAttempted || currentRetryCount >= CONFIG.maxRetries) {
            console.log('[Auto-Auth] 已达到最大重试次数或已尝试过认证');
            return;
        }
        
        authAttempted = true;
        currentRetryCount++;
        
        console.log(`[Auto-Auth] 检测到401错误，准备使用凭证重新访问 (尝试 ${currentRetryCount}/${CONFIG.maxRetries})`);
        
        const authenticatedUrl = getAuthenticatedUrl();
        console.log(`[Auto-Auth] 重定向到: ${authenticatedUrl.replace(CONFIG.password, '****')}`);
        
        // 标记已进行认证
        sessionStorage.setItem('auto_auth_in_progress', 'true');
        
        // 延迟重定向，确保当前页面加载完成
        setTimeout(() => {
            window.location.href = authenticatedUrl;
        }, CONFIG.retryDelay);
    }
    
    /**
     * 检查认证是否已完成，自动重新加载原链接
     */
    function checkAuthCompletion() {
        const authInProgress = sessionStorage.getItem('auto_auth_in_progress');
        
        if (authInProgress === 'true') {
            // 清除标记
            sessionStorage.removeItem('auto_auth_in_progress');
            
            // 检查当前URL是否仍包含凭证
            const currentUrl = window.location.href;
            if (currentUrl.includes('@')) {
                console.log('[Auto-Auth] 认证成功，重新加载原链接...');
                
                // 构建清理后的URL
                const cleanUrl = currentUrl.replace(/^(https?:\/\/)([^:@]+):([^@]+)@/, '$1');
                
                // 延迟一小段时间确保认证已完全生效
                setTimeout(() => {
                    window.location.href = cleanUrl;
                }, 500);
            }
        }
    }
    
    /**
     * 初始化监听器
     */
    function initializeListeners() {
        // 监听页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkAndAuth);
        } else {
            checkAndAuth();
        }
        
        // 监听页面内容变化（AJAX加载）
        const observer = new MutationObserver(() => {
            if (is401Error() && !authAttempted) {
                console.log('[Auto-Auth] 通过MutationObserver检测到401错误');
                performAutoAuth();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false
        });
    }
    
    /**
     * 检查并执行认证
     */
    function checkAndAuth() {
        if (is401Error() && !authAttempted) {
            console.log('[Auto-Auth] 页面加载完成，检测到401错误');
            performAutoAuth();
        }
    }
    
    /**
     * 拦截fetch请求，检测401响应
     */
    function interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            return originalFetch.apply(this, args)
                .then(response => {
                    if (response.status === 401 && !authAttempted) {
                        console.log('[Auto-Auth] Fetch请求返回401状态码');
                        performAutoAuth();
                    }
                    return response;
                })
                .catch(error => {
                    console.error('[Auto-Auth] Fetch请求出错:', error);
                    throw error;
                });
        };
    }
    
    /**
     * 拦截XMLHttpRequest请求，检测401响应
     */
    function interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._requestUrl = url;
            return originalOpen.apply(this, [method, url, ...rest]);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('loadend', function() {
                if (this.status === 401 && !authAttempted) {
                    console.log('[Auto-Auth] XHR请求返回401状态码');
                    performAutoAuth();
                }
            });
            return originalSend.apply(this, args);
        };
    }
    
    /**
     * 主初始化函数
     */
    function init() {
        console.log('[Auto-Auth] 脚本已加载，开始监听401错误...');
        console.log(`[Auto-Auth] 配置 - 用户名: ${CONFIG.username}, 最大重试次数: ${CONFIG.maxRetries}`);
        
        // 首先检查认证是否已完成
        checkAuthCompletion();
        
        // 初始化各种监听器
        initializeListeners();
        interceptFetch();
        interceptXHR();
        
        console.log('[Auto-Auth] 初始化完成');
    }
    
    // 在脚本加载时立即执行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
        authAttempted = false;
        currentRetryCount = 0;
    });
})();
