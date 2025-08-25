# 自动化测试文档

## 测试概述

本项目包含完整的自动化测试套件，涵盖单元测试、集成测试和代码覆盖率分析。

## 测试结构

```
src/test/
├── runTest.ts              # 测试运行器
└── suite/
    ├── index.ts            # 测试套件索引
    ├── extension.test.ts   # 扩展集成测试
    ├── websocket.test.ts   # WebSocket模块测试
    └── utils.test.ts       # 工具类测试
```

## 测试类型

### 1. 单元测试
- **ImageProcessor**: 图像处理模块测试
- **Logger**: 日志工具测试
- **Types**: 类型定义验证

### 2. 集成测试
- **Extension**: VS Code扩展集成测试
- **Commands**: 命令注册和执行测试
- **Configuration**: 配置管理测试

### 3. 覆盖率测试
- 使用 NYC 进行代码覆盖率分析
- 生成 HTML 和 LCOV 报告

## 运行测试

### 基本测试命令

```bash
# 运行所有测试
npm test

# 运行单元测试
npm run test:unit

# 运行带覆盖率的测试
npm run test:coverage

# 生成覆盖率报告
npm run coverage:report
```

### 开发测试命令

```bash
# 编译并运行测试
npm run compile && npm test

# 代码检查
npm run lint

# 修复代码格式
npm run lint:fix
```

## 测试结果

### 成功的测试用例 ✅

1. **WebSocket模块测试** (11个测试)
   - ImageProcessor 实例创建
   - 图像数据验证
   - 数据格式转换
   - 二进制数据解析
   - 错误处理

2. **工具类测试** (7个测试)
   - Logger 静态方法
   - 消息记录功能
   - 多种消息格式支持

3. **扩展集成测试** (5个测试通过，1个失败)
   - 扩展存在性验证
   - 扩展激活测试
   - 配置管理测试
   - 工作空间变更处理

### 待修复的测试用例 ⚠️

1. **命令注册测试**: 扩展命令在测试环境中注册失败
   - 原因：VS Code测试环境中扩展激活时序问题
   - 解决方案：增加激活等待时间或模拟命令注册

## 测试配置

### TypeScript配置 (tsconfig.json)
```json
{
  "types": ["node", "vscode", "mocha"]
}
```

### ESLint配置 (.eslintrc.json)
```json
{
  "env": {
    "mocha": true
  },
  "overrides": [
    {
      "files": ["**/*.test.ts"],
      "globals": {
        "suite": "readonly",
        "test": "readonly"
      }
    }
  ]
}
```

### 覆盖率配置 (.nycrc.json)
```json
{
  "include": ["out/**/*.js"],
  "exclude": ["out/test/**"],
  "reporter": ["text", "html", "lcov"]
}
```

## 最佳实践

### 1. 测试命名
- 使用描述性的测试名称
- 遵循 "should do something" 格式
- 按功能模块组织测试

### 2. 测试隔离
- 每个测试相互独立
- 使用 setup/teardown 进行清理
- 避免全局状态污染

### 3. 错误处理
- 测试正常流程和异常情况
- 验证错误消息和类型
- 使用 assert.throws 测试异常

### 4. 异步测试
- 使用 async/await 或 done 回调
- 设置合适的超时时间
- 处理 Promise 拒绝

## 持续集成

### GitHub Actions 配置
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 故障排除

### 常见问题

1. **Mocha 全局变量未定义**
   - 确保 ESLint 配置包含 mocha 环境
   - TypeScript 配置包含 mocha 类型

2. **VS Code 扩展测试失败**
   - 检查扩展是否正确激活
   - 验证命令注册时序
   - 确保测试环境配置正确

3. **覆盖率报告不生成**
   - 检查 NYC 配置
   - 确保源映射启用
   - 验证文件路径正确

## 测试指标

当前测试覆盖率：
- **行覆盖率**: 目标 >80%
- **函数覆盖率**: 目标 >90%
- **分支覆盖率**: 目标 >75%

## 下一步改进

1. 增加 WebSocket 连接的模拟测试
2. 添加 PreviewPanel 的单元测试
3. 实现端到端测试
4. 集成性能测试
5. 添加更多边界情况测试
