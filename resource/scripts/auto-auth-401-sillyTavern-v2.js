/**
 * Silly Tavern 自动认证脚本 - v2.0 带URL清理版
 * 功能：检测到401认证错误时，自动使用用户名:密码@网址重新访问，
 *       认证完成后等待2秒自动清理URL中的凭证部分
 * 
 * 使用步骤：
 * 1. 在Tuboshu中添加Silly Tavern网站
 * 2. 点击编辑，找到"JS脚本"字段
 * 3. 将此脚本内容复制粘贴到该字段
 * 4. 保存配置
 */

(function() {
    'use strict';
    
    // ===== 配置区域 =====
    const USERNAME = 'star';
    const PASSWORD = 'boyu123456789';
    const CLEANUP_DELAY = 2000; // 认证后等待时间（毫秒）
    // ===== 配置区域结束 =====
    
    let authAttempted = false;
    let cleanupScheduled = false;
    
    // 构建带凭证的URL
    function buildAuthUrl() {
        const url = new URL(window.location.href);
        const cleanHost = url.host.replace(/^[^@]*@/, '');
        return `${url.protocol}//${USERNAME}:${PASSWORD}@${cleanHost}${url.pathname}${url.search}${url.hash}`;
    }
    
    // 构建清理后的URL（去除凭证）
    function buildCleanUrl() {
        const url = new URL(window.location.href);
        const cleanHost = url.host.replace(/^[^@]*@/, '');
        return `${url.protocol}//${cleanHost}${url.pathname}${url.search}${url.hash}`;
    }
    
    // 检测当前URL是否包含凭证
    function hasCredentialsInUrl() {
        return window.location.href.includes('@') && /^https?:\/\/[^:@]+:[^@]+@/.test(window.location.href);
    }
    
    // 检测是否为401错误页面
    function is401Error() {
        const text = (document.body?.innerText || '') + (document.title || '');
        return /401|Unauthorized|身份验证|需要身份验证|basicAuthUser/.test(text);
    }
    
    // 执行认证重定向
    function authenticate() {
        if (authAttempted) return;
        authAttempted = true;
        
        console.log('[Auto-Auth] 检测到401错误，使用凭证重新访问...');
        const authUrl = buildAuthUrl();
        
        setTimeout(() => {
            window.location.href = authUrl;
        }, 300);
    }
    
    // 清理URL中的凭证并重定向
    function cleanupAndRedirect() {
        if (cleanupScheduled) return;
        cleanupScheduled = true;
        
        console.log(`[Auto-Auth] 认证完成，${CLEANUP_DELAY/1000}秒后清理URL凭证...`);
        
        setTimeout(() => {
            const cleanUrl = buildCleanUrl();
            console.log('[Auto-Auth] 清理URL凭证，重定向到原始链接...');
            window.location.href = cleanUrl;
        }, CLEANUP_DELAY);
    }
    
    // 检查页面状态
    function checkPage() {
        if (hasCredentialsInUrl() && !is401Error()) {
            console.log('[Auto-Auth] 检测到带凭证URL且页面正常，准备清理...');
            cleanupAndRedirect();
        } else if (is401Error() && !authAttempted) {
            console.log('[Auto-Auth] 发现401错误页面，开始认证...');
            authenticate();
        }
    }
    
    // 初始化
    function init() {
        // 页面加载完成后检查
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkPage);
        } else {
            checkPage();
        }
        
        // 监听页面变化（AJAX加载等）
        const observer = new MutationObserver(() => {
            if (hasCredentialsInUrl() && !is401Error() && !cleanupScheduled) {
                cleanupAndRedirect();
            } else if (!authAttempted && is401Error()) {
                authenticate();
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
        
        // 拦截fetch请求
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args).then(response => {
                if (response.status === 401 && !authAttempted) {
                    console.log('[Auto-Auth] 检测到401响应，开始认证...');
                    authenticate();
                } else if (hasCredentialsInUrl() && response.ok && !cleanupScheduled) {
                    console.log('[Auto-Auth] 请求成功且URL含凭证，准备清理...');
                    cleanupAndRedirect();
                }
                return response;
            });
        };
        
        console.log('[Auto-Auth] 脚本已加载 - 自动401认证+URL清理');
        console.log(`[Auto-Auth] 配置: 用户名=${USERNAME}, 清理延迟=${CLEANUP_DELAY}ms`);
    }
    
    // 执行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
