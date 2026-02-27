# Idea Bubble App -- 开发总结

## 开发目的

这是一款**想法(Idea)预管理 App**，定位于管理"想法在成为正式任务/计划之前"的过渡阶段。

**核心痛点**：用户在接触文章、图片、视频等内容后，会产生"想尝试做某件事"的想法。这些想法数量多、随机、容易遗忘，但如果直接将其拟定为正式任务或长期计划，会因心理上的成本高估而搁置不前。App 通过**轻量可视化的气泡界面**来捕捉、沉淀和筛选这些想法。

## 技术栈

- **Expo SDK 54** + **React Native 0.81.5** + **TypeScript**（strict mode）
- **react-native-reanimated 4.2.1** + **react-native-gesture-handler** -- 气泡拖拽与动画
- **@gorhom/bottom-sheet 5.2.8** -- 底部详情面板
- **expo-sqlite** -- 本地 SQLite 数据库（3张表：categories, ideas, idea_images）
- **expo-image-picker** + **expo-file-system** -- 图片选取与持久化存储
- **@react-native-community/datetimepicker** -- 日期时间选择
- **使用 `npx expo run:android` 开发构建**（非 Expo Go，因为 Expo Go 存在 Worklets 版本不匹配问题）

## UI 设计

单屏幕设计，无多页导航：

1. **左侧**：垂直分类侧边栏（可自定义分类，默认：Work & Study / Entertain / Others），点击筛选，长按或点底部齿轮图标打开分类管理弹窗
2. **中央**：气泡画布 -- 每个想法是一个圆形气泡(Bubble)，可自由拖拽
3. **右下角**：FAB "+" 按钮，点击新建想法
4. **底部弹出面板**：BottomSheet，点击气泡后弹出，显示/编辑想法详情

## 气泡视觉编码规则

- **大小**：由"意愿滑块"(willingness, 0~1)控制，willingness=1 时直径等于画布宽度
- **颜色**：由创建至今的时间线性渐变：白色(刚创建) → 浅黄(1天) → 橙色(1周) → 红色(2周后不再变化)
- **文字**：圆上显示想法名称 + 已过时间标签（如 "3h" 或 "5d"）
- **不可重叠**：拖拽时推开其他气泡
- **自动缩放**：当所有气泡总面积超出屏幕容量时，等比缩小所有气泡以全部放入一屏

## 想法数据字段

1. **Title** -- 标题
2. **Source / Origin** -- 文字描述来源
3. **Source Image** -- 最多6张图片（一行3张），从相册选取，存储在App本地目录
4. **Created Time** -- 自动读取系统时间，支持手动调整（Android上拆分为先选日期再选时间）
5. **Willingness** -- 0~1 浮点数，自定义手势滑块（解决了BottomSheet内原生Slider手势冲突）
6. **Category** -- 分类选择（chip样式）
7. **Sub-ideas** -- 仅占位，显示 "Coming soon"
8. **Elapsed time** -- 自动计算显示
9. **Delete** -- 删除按钮（含确认弹窗，级联删除图片）

## 文件结构

```
e:\Del\PhoneApp\
├── App.tsx                          # 入口：SafeAreaProvider + DatabaseProvider + MainScreen
├── babel.config.js                  # babel-preset-expo + reanimated/plugin
├── index.ts                         # registerRootComponent
├── COMMANDS.md                      # 模拟器/ADB/Expo 常用指令速查
├── src/
│   ├── theme/index.ts               # 颜色、间距、气泡配置常量
│   ├── models/types.ts              # TypeScript接口：Idea, Category, IdeaImage, BubbleData
│   ├── db/
│   │   ├── database.ts              # SQLite初始化、3张表Schema、默认分类seed
│   │   └── provider.tsx             # DatabaseContext Provider
│   ├── services/
│   │   ├── ideaService.ts           # Idea CRUD + position update
│   │   ├── categoryService.ts       # Category CRUD
│   │   └── imageService.ts          # 图片CRUD + 文件存储管理
│   ├── layout/
│   │   └── bubblePacker.ts          # 核心布局引擎：动态半径计算、自动缩放、碰撞检测/解决、
│   │                                #   新气泡放置、时间颜色插值
│   ├── hooks/
│   │   ├── useIdeas.ts              # Idea数据Hook（按分类过滤）
│   │   ├── useCategories.ts         # Category数据Hook
│   │   └── useBubbleLayout.ts       # 布局计算Hook
│   ├── screens/
│   │   └── MainScreen.tsx           # 主屏幕（组装所有组件、管理状态、图片增删）
│   └── components/
│       ├── BubbleCanvas.tsx          # 气泡画布容器
│       ├── Bubble.tsx                # 单个可拖拽气泡（absX/absY shared value控制位置）
│       ├── CategorySidebar.tsx       # 左侧分类侧边栏
│       ├── CategoryManager.tsx       # 分类管理弹窗（Modal）
│       ├── IdeaDetailSheet.tsx       # 底部详情面板（BottomSheet，含所有字段）
│       ├── SourceImageGrid.tsx       # 图片网格组件（3列，最多6张，支持预览/删除）
│       ├── WillSlider.tsx            # 自定义手势滑块（兼容BottomSheet）
│       └── FAB.tsx                   # 浮动添加按钮
```

## 已解决的关键问题

1. **Expo Go Worklets版本不匹配** -- 改用 `npx expo run:android` 开发构建
2. **DateTimePicker dismiss崩溃** -- Android上 `mode="datetime"` 不被原生支持，拆分为先date后time两步
3. **气泡拖拽松手跳动** -- 改用 `absX/absY` shared value 完全控制位置，不再用 translate 偏移
4. **BottomSheet内Slider无法拖动** -- 替换为自定义 gesture handler 滑块，配置 `activeOffsetX/failOffsetY`
5. **气泡最大尺寸不够大** -- `maxRadius` 改为动态计算，willingness=1 时直径等于画布宽度

## 待开发功能

- **Sub-ideas（次级想法）** -- 目前仅占位
- **Source Image 在新建时支持** -- 当前仅编辑已有想法时可添加图片（需先创建再添加）
- **深色模式**
- **数据导出**

## 新环境搭建要点

1. 需要 Node.js、Android SDK、Android 模拟器
2. `npm install` 安装依赖
3. **必须用 `npx expo run:android`**，不使用 `npx expo start` + Expo Go
4. 首次编译较慢（几分钟），后续增量编译快
5. 项目根目录有 `COMMANDS.md` 速查常用指令
