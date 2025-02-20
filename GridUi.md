# GridUi 使用说明

GridUi 是一个用于创建和管理灵活布局的类。它支持嵌套布局、虚拟布局和精确的元素定位。

## 1. 基本概念

GridUi 有三种主要元素类型：
1. 无布局的真实元素
2. 有布局的真实元素（由类型1和2组成）
3. 有布局的虚拟元素

## 2. 创建基础元素

```javascript
// 创建标签元素
const label = new GridUi({
    html: `<label style="font-size:12px;background-color: lightgreen">
             <nobr>Name</nobr>
           </label>`
});

// 创建输入框元素
const input = new GridUi({
    html: `<input style="font-size:12px;" 
           type="text" autocomplete="off">`
});

// 创建按钮元素
const button = new GridUi({
    html: `<button style="font-size:12px;width:48px;">
             Cancel
           </button>`
});
```

## 3. 创建布局容器

```javascript
// 创建行容器
const row = new GridUi({
    parent$: $('#container'),  // 父容器（可选）
    html: `<div id="row1" style="margin-bottom:15px;"></div>`,
    layout: [
        [label, input]  // 一行包含两个元素
    ]
});

// 创建多行容器
const container = new GridUi({
    parent$: $('body'),
    html: `<div id="container" style="position: absolute;"></div>`,
    layout: [
        [row1],
        [row2],
        [row3]
    ]
});
```

## 4. 配置选项

```javascript
{
    parent$: jQuery对象,          // 父容器
    html: String,                // HTML模板
    layout: Array,              // 二维数组定义布局
    isVirtual: Boolean,         // 是否虚拟布局
    isVirtualCol: Boolean,      // 是否虚拟列
    isParentRendered: Boolean,  // 父容器是否已渲染
    state: String,              // 状态
    width: Number,              // 宽度
    height: Number,             // 高度
    top: Number,                // 上边距
    bottom: Number,             // 下边距
    left: Number,               // 左边距
    right: Number              // 右边距
}
```

## 5. 主要方法

### 布局操作
```javascript
// 设置布局
layout.setLayout([[row1], [row2]]);

// 渲染布局
layout.renderLayout();

// 渲染行
layout.renderRows();

// 获取特定行
const row = layout.getRow(1);
```

### 元素操作
```javascript
// 显示/隐藏
layout.show();
layout.hide();

// 获取尺寸
const width = layout.getWidth();
const height = layout.getHeight();

// 获取位置
const top = layout.getTop();
const left = layout.getLeft();
```

### 对齐方法
```javascript
// 顶部对齐
layout.alignTopTo(target, 'top', offset);

// 底部对齐
layout.alignBottomTo(target, 'bottom', offset);

// 左侧对齐
layout.alignLeftTo(target, 'left', offset);

// 右侧对齐
layout.alignRightTo(target, 'right', offset);

// 垂直居中
layout.alignVerticalCenterTo(target, offset);

// 水平居中
layout.alignHorizonCenterTo(target, offset);

// 完全居中
layout.placeToCenterOf(target, offsetX, offsetY);
```

### DOM操作
```javascript
// 附加到目标
layout.appendTo(target);

// 移动
layout.move(deltaX, deltaY);
layout.moveTo(x, y);
```

## 6. 虚拟布局示例

```javascript
const virtualLayout = new GridUi({
    isVirtual: true,
    layout: [
        [div1, div2, div3]
    ]
});
```

## 7. 注意事项

1. 真实元素必须配置 html 属性
2. 布局数组必须是二维数组
3. 父容器必须已渲染才能渲染子元素
4. 虚拟布局不创建实际 DOM 元素
5. 布局渲染有状态控制：constructed -> layoutAppended -> layoutRendered

## 8. 状态流程

1. constructed: 初始状态
2. layoutAppended: 布局已附加
3. layoutRendered: 布局已渲染


## 9. 装饰器
const formContainer = new GridUi({
    parent$: $('#loginForm'),
    html: `<div></div>`,
    layout: [
        [BLANK_DIV('5rem') ,usernameLabel, BLANK_DIV('5px') ,usernameInput],
        [BLANK_DIV('5rem', '5px')],
        [BLANK_DIV('5rem') ,passwordLabel, BLANK_DIV('5px') ,passwordInput],
        [BLANK_DIV('5rem', '5px')],
        [BLANK_DIV('10rem'),checkbox, BLANK_DIV('5px') ,checkboxLabel],
        [BLANK_DIV('5rem', '1rem')],
        [BLANK_DIV('10rem'),loginBtn, BLANK_DIV('5px') ,cancelBtn]
    ],
    alignLeftTo: AAA.right,
    alignCenterTo: AAA,
});




## 10. 完整示例解析

### 10.1 创建表单布局

```javascript
// 1. 创建标签和输入框
const nameLabel = new GridUi({
    html: `<label style="font-size:12px;background-color: lightgreen">
             <nobr>Name</nobr>
           </label>`
});

const nameInput = new GridUi({
    html: `<input style="font-size:12px;" 
           type="text" autocomplete="off">`
});

// 2. 创建第一行布局
const row1 = new GridUi({
    parent$: $('#l0'),
    html: `<div id="r1" style="margin-bottom:15px;"></div>`,
    layout: [
        [nameLabel, nameInput]
    ]
});

// 3. 获取元素宽度（用于后续布局）
const labelWidth = nameLabel.getWidth();

// 4. 创建复选框行
const checkbox = new GridUi({
    html: `<input type="checkbox">`
});

const checkboxLabel = new GridUi({
    html: `<label style="font-size:12px;background-color: lightgreen; 
           margin-left: 2px;">
             <nobr>Define Interface</nobr>
           </label>`
});

const row2 = new GridUi({
    html: `<div id="r2" style="margin:15px 0 15px 15px;"></div>`,
    layout: [
        [checkbox, checkboxLabel]
    ]
});

// 5. 创建按钮行
const cancelBtn = new GridUi({
    html: `<button id="btn-cancel" style="font-size:12px;width:48px;">
             Cancel
           </button>`
});

const okBtn = new GridUi({
    html: `<button id="btn-ok" style="font-size:12px;width:48px;
           margin-left:15px;">
             Ok
           </button>`
});

const row3 = new GridUi({
    parent$: $('#l0'),
    html: `<div id="r3" style="margin-left:${labelWidth}px;"></div>`,
    layout: [
        [cancelBtn, okBtn]
    ]
});
```

### 9.2 创建主容器布局

```javascript
// 创建主容器并设置布局
const mainContainer = new GridUi({
    parent$: $('body'),
    html: `<div id="l0" style="position: absolute; z-index:99; 
           display: block;background-color: lightgreen"></div>`,
    layout: [
        [row1],
        [row2],
        [row3]
    ]
});

// 三种等效的布局设置方式
mainContainer.setLayout([[row1], [row2], [row3]]); // 方式1：使用setLayout方法
mainContainer.layout = [[row1], [row2], [row3]];   // 方式2：直接赋值
mainContainer.renderRows();                         // 方式3：渲染行
```

### 9.3 虚拟布局示例

```javascript
// 创建单行虚拟布局
const virtualRow = new GridUi({
    isVirtual: true,
    layout: [
        [div1, div2]
    ]
});

// 创建多元素虚拟布局
const virtualContainer = new GridUi({
    isVirtual: true,
    state: 'layoutRendered',
    layout: [
        [div1, div2, div3, div4, div5, div6]
    ]
});
```

### 9.4 布局对齐示例

```javascript
// 获取行宽度
const rowWidth = layout.getRow(1).getWidth();

// 行对齐
layout.getRow(1).alignLeftTo(div2, 'left');
layout.getRow(2).alignRightTo(div2, 'right');
```

### 9.5 注意事项

1. 布局容器可以嵌套使用
2. 可以使用元素的尺寸来动态设置其他元素的位置（如使用labelWidth设置按钮行的左边距）
3. 虚拟布局适用于需要对齐但不需要实际DOM元素的场景
4. 设置布局有多种方式，建议使用setLayout方法以确保正确渲染
5. 可以通过getRow方法获取特定行进行单独操作

以上示例展示了 GridUi 的主要使用场景和不同的布局方式。示例中的代码都是有效的，并且展示了类的主要功能。
