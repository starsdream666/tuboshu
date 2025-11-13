/**
 * Silly Tavern 自动认证脚本 - 简化版
 * 功能：检测到401认证错误时，自动使用用户名:密码@网址的方式重新访问
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
    // ===== 配置区域结束 =====
    
    let authAttempted = false;
    
    /**
     * 构建带凭证的URL
     */
    function buildAuthUrl() {
        const url = new URL(window.location.href);
        // 移除已存在的凭证
        const cleanHost = url.host.replace(/^[^@]*@/, '');
        return `${url.protocol}//${USERNAME}:${PASSWORD}@${cleanHost}${url.pathname}${url.search}${url.hash}`;
    }
    
    /**
     * 检测是否为401错误页面
     */
    function is401Error() {
        const text = (document.body?.innerText || '') + (document.title || '');
        return /401|Unauthorized|身份验证|需要身份验证|basicAuthUser/.test(text);
    }
    
    /**
     * 执行认证重定向
     */
    function authenticate() {
        if (authAttempted) return;
        authAttempted = true;
        
        console.log('[SillyTavern Auto-Auth] 检测到401错误，使用凭证重新访问...');
        const authUrl = buildAuthUrl();
        
        setTimeout(() => {
            window.location.href = authUrl;
        }, 300);
    }
    
    /**
     * 检查页面状态
     */
    function checkPage() {
        if (is401Error()) {
            console.log('[SillyTavern Auto-Auth] 发现401错误页面');
            authenticate();
        }
    }
    
    /**
     * 初始化
     */
    function init() {
        // 页面加载完成后检查
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkPage);
        } else {
            checkPage();
        }
        
        // 监听页面变化
        const observer = new MutationObserver(() => {
            if (!authAttempted && is401Error()) {
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
                    console.log('[SillyTavern Auto-Auth] 检测到401响应');
                    authenticate();
                }
                return response;
            });
        };
        
        console.log('[SillyTavern Auto-Auth] 脚本已加载，监听中...');
    }
    
    // 执行初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
