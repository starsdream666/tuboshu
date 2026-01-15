/**
 * Silly Tavern 自动认证脚本 - 简化版
 * 功能：检测到401认证错误时自动认证，认证后自动清理URL
 * 逻辑：更简单直接的实现方式
 */

(function() {
    'use strict';
    
    // ===== 配置区域 =====
    const USERNAME = 'star';
    const PASSWORD = 'boyu123456789';
    const CLEANUP_DELAY = 2000; // 认证后等待时间（毫秒）
    // ===== 配置区域结束 =====
    
    let processed = false; // 防止重复处理
    
    // 检测当前URL是否包含凭证
    function hasCredentials() {
        return window.location.href.includes('@') && /@[^\/]+\//.test(window.location.href);
    }
    
    // 构建带凭证的URL
    function buildAuthUrl() {
        const url = window.location.href;
        const urlObj = new URL(url);
        const cleanHost = urlObj.host.replace(/^[^@]*@/, '');
        return `${urlObj.protocol}//${USERNAME}:${PASSWORD}@${cleanHost}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    
    // 构建清理后的URL
    function buildCleanUrl() {
        const url = window.location.href;
        const urlObj = new URL(url);
        const cleanHost = urlObj.host.replace(/^[^@]*@/, '');
        return `${urlObj.protocol}//${cleanHost}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    }
    
    // 检测是否为401错误
    function is401Error() {
        const text = document.body ? document.body.innerText : '';
        const title = document.title || '';
        return /401|Unauthorized|身份验证|basicAuthUser/i.test(text + title);
    }
    
    // 执行认证
    function doAuth() {
        if (processed) return;
        processed = true;
        
        console.log('[Simple-Auth] 开始认证流程...');
        const authUrl = buildAuthUrl();
        console.log('[Simple-Auth] 重定向到认证URL');
        
        setTimeout(() => {
            window.location.href = authUrl;
        }, 500);
    }
    
    // 执行清理
    function doCleanup() {
        if (processed) return;
        processed = true;
        
        console.log(`[Simple-Auth] 检测到凭证URL，${CLEANUP_DELAY/1000}秒后清理...`);
        
        setTimeout(() => {
            const cleanUrl = buildCleanUrl();
            console.log('[Simple-Auth] 清理URL，重定向到干净链接...');
            window.location.href = cleanUrl;
        }, CLEANUP_DELAY);
    }
    
    // 主逻辑
    function main() {
        const currentUrl = window.location.href;
        console.log('[Simple-Auth] 当前URL:', currentUrl);
        
        // 情况1：URL包含凭证，执行清理
        if (hasCredentials()) {
            console.log('[Simple-Auth] 检测到凭证URL，准备清理...');
            doCleanup();
        }
        // 情况2：检测到401错误，执行认证
        else if (is401Error()) {
            console.log('[Simple-Auth] 检测到401错误，准备认证...');
            doAuth();
        }
        else {
            console.log('[Simple-Auth] 页面正常，无需处理');
        }
    }
    
    // 页面加载完成后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
    
    // 额外保险：3秒后再次检查
    setTimeout(() => {
        if (!processed) {
            console.log('[Simple-Auth] 3秒后补充检查...');
            main();
        }
    }, 3000);
    
    console.log('[Simple-Auth] 脚本已加载');
    console.log(`[Simple-Auth] 配置: ${USERNAME} / 延迟: ${CLEANUP_DELAY}ms`);
})();
