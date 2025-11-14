# 快速开始 - Silly Tavern 自动认证 v2.0

## 30秒快速配置

### 第一步：复制脚本
打开 `auto-auth-401-sillyTavern-v2.js` 文件（推荐），复制全部内容

### 第二步：在Tuboshu中配置
1. 在Tuboshu中添加或编辑Silly Tavern网站
2. 找到"JS脚本"字段
3. 粘贴脚本内容

### 第三步：修改凭证
在脚本中找到这两行，修改为你的实际凭证：
```javascript
const USERNAME = 'star';           // 改成你的用户名
const PASSWORD = 'boyu123456789';  // 改成你的密码
```

### 第四步：保存
点击保存按钮，完成！

---

## v2.0 完整工作流程

```
1. 访问网站 → https://your-sillyTavern.com
     ↓
2. 检测到401错误
     ↓
3. 自动认证 → https://star:boyu123456789@your-sillyTavern.com
     ↓
4. 认证成功（页面正常显示）
     ↓
5. 等待2秒（CLEANUP_DELAY）
     ↓
6. 自动清理URL → https://your-sillyTavern.com
     ↓
7. 最终效果：干净的URL + 已认证状态 ✨
```

---

## v2.0 脚本内容预览

```javascript
const USERNAME = 'star';
const PASSWORD = 'boyu123456789';
const CLEANUP_DELAY = 2000; // 清理延迟时间

// v2.0 脚本会自动：
// 1. 检测401错误
// 2. 构建认证URL → username:password@domain
// 3. 自动重定向并认证
// 4. 等待CLEANUP_DELAY毫秒
// 5. 清理URL凭证 → 恢复原始干净URL
// 6. 页面正常，URL干净，保持认证状态 ✨
```

---

## 常见问题

| 问题 | 解决方案 |
|------|--------|
| 脚本没有执行 | 检查是否正确粘贴到JS脚本字段 |
| 还是显示401 | 检查用户名和密码是否正确 |
| 页面一直重定向 | 检查服务器是否真的需要认证 |

---

## 文件位置

```
tuboshu/
└── resource/
    └── scripts/
        ├── auto-auth-401-sillyTavern-v2.js  ← v2.0 最新推荐
        ├── auto-auth-401-sillyTavern.js     ← v1.1 经典版本
        ├── auto-auth-401.js                 ← 通用版本
        ├── README.md                        ← 详细文档
        └── QUICK_START.md                   ← 本文件
```

---

## 下一步

- 查看 `README.md` 了解更多详情
- 在Tuboshu中配置脚本
- 访问Silly Tavern网站测试

祝你使用愉快！ 🎉
