# 快速开始 - Silly Tavern 自动认证

## 30秒快速配置

### 第一步：复制脚本
打开 `auto-auth-401-sillyTavern.js` 文件，复制全部内容

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

## 工作流程

```
访问网站
  ↓
检测到401错误
  ↓
自动重定向到: https://star:boyu123456789@your-domain.com
  ↓
认证成功，页面正常显示
```

---

## 脚本内容预览

```javascript
const USERNAME = 'star';
const PASSWORD = 'boyu123456789';

// 脚本会自动：
// 1. 检测401错误
// 2. 构建认证URL
// 3. 自动重定向
// 4. 页面正常加载
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
        ├── auto-auth-401-sillyTavern.js  ← 推荐使用
        ├── auto-auth-401.js              ← 通用版本
        ├── README.md                     ← 详细文档
        └── QUICK_START.md                ← 本文件
```

---

## 下一步

- 查看 `README.md` 了解更多详情
- 在Tuboshu中配置脚本
- 访问Silly Tavern网站测试

祝你使用愉快！ 🎉
