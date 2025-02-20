class GridUi {
    constructor(options) {
        // 保存初始化参数
        this.options = options;
        
        // 网格系统参数
        this.gridCols = options.gridCols || 12;  // 默认12列
        this.gridRows = options.gridRows || 10;  // 默认10行
        
        // 标记是否为虚拟类型
        this.isVirtual = options.html ? false : true;
        
        // 创建DOM元素（只有非虚拟类型才创建）
        if (!this.isVirtual) {
            this.dom$ = $(options.html);
            
            // 应用样式
            if (options.style) {
                this.dom$.css(options.style);
            }
            
            // 如果指定了父元素，则添加到父元素中
            if (options.parent$) {
                options.parent$.append(this.dom$);
            }
        }
        
        // 保存布局信息
        if (options.layout) {
            // 处理 grid 对齐布局
            if (options.layout.rows && options.layout.align) {
                this.gridAlign = options.layout.align;
                this.layout = options.layout.rows;
            } else {
                this.layout = options.layout;
            }
        } else {
            this.layout = [];
        }
        
        // 初始化位置信息对象
        this.position = {
            start: null,   // {gridLine: number, offset: number}
            end: null,     // {gridLine: number, offset: number} 
            top: null,     // {gridLine: number, offset: number}
            bottom: null   // {gridLine: number, offset: number}
        };

        // 初始化debug模式
        this.debug = options.debug || false;
        this.debugOptions = options.debugOptions || {
            showRowBoundaries: true,  // 是否显示行边界
            rowBoundaryColor: 'rgba(255,0,0,0.2)',  // 行边界的颜色
            showDebugInfo: false  // 是否显示调试信息
        };
        // 初始化debug模式
        if (options.debug) {
            this.debugger = new GridDebugger(this, options.debugOptions);
        }

        // 行尺寸计算模式
        this.rowSizeMode = options.rowSizeMode || 'fast'; // 'fast' 或 'precise'
    }

    // 设置网格单元尺寸（由顶层容器调用并向下传递）
    setGridUnit(unitWidth, unitHeight) {
        this.gridUnitWidth = unitWidth;
        this.gridUnitHeight = unitHeight;
    }

    // 获取元素完整尺寸（包含margin）
    getElementFullSize(element) {
        if (element.isVirtual) return null;
        
        const $dom = element.dom$;
        return {
            width: $dom.outerWidth(true),  // 包含 content + padding + border + margin
            height: $dom.outerHeight(true)
        };
    }

    // 获取元素的margin偏移
    // getElementMarginOffset(element) {
    //     if (element.isVirtual) return { left: 0, top: 0 };
        
    //     const $dom = element.dom$;
    //     return {
    //         left: parseFloat($dom.css('marginLeft')) || 0,
    //         top: parseFloat($dom.css('marginTop')) || 0,
    //         right: parseFloat($dom.css('marginRight')) || 0,
    //         bottom: parseFloat($dom.css('marginBottom')) || 0
    //     };
    // }

    // 计算元素位置
    calculateElementPosition(element, startGridLine, startOffset, topGridLine, topOffset) {
        // 如果是虚拟类型，只返回初始位置，实际布局会在processElement中处理
        if (element.isVirtual) {
            return {
                start: {
                    gridLine: startGridLine,
                    offset: startOffset
                },
                end: {
                    gridLine: startGridLine,  // 临时值，会在processElement中更新
                    offset: 0
                },
                top: {
                    gridLine: topGridLine,
                    offset: topOffset
                },
                bottom: {
                    gridLine: topGridLine,  // 临时值，会在processElement中更新
                    offset: 0
                }
            };
        }

        // 获取元素完整尺寸（已包含margin）
        const fullSize = this.getElementFullSize(element);
        
        // 计算网格跨度
        const effectiveWidth = fullSize.width + startOffset; // 补偿起始偏移，偏移总是负数
        const colSpan = Math.ceil(effectiveWidth / this.gridUnitWidth);
        const endOffset = effectiveWidth - (colSpan * this.gridUnitWidth); // 偏移总是负数
        
        const effectiveHeight = fullSize.height + topOffset; // 补偿起始偏移，偏移总是负数
        const rowSpan = Math.ceil(effectiveHeight / this.gridUnitHeight);
        const bottomOffset = effectiveHeight - (rowSpan * this.gridUnitHeight); // 偏移总是负数
        
        return {
            start: {
                gridLine: startGridLine,
                offset: startOffset
            },
            end: { 
                gridLine: startGridLine + colSpan, 
                offset: endOffset
            },
            top: {
                gridLine: topGridLine,
                offset: topOffset
            },
            bottom: {
                gridLine: topGridLine + rowSpan,
                offset: bottomOffset
            }
        };
    }

    // 设置元素位置
    setElementPosition(element, startGridLine, startOffset = 0, topGridLine, topOffset = 0) {
        // 计算所有边的位置信息
        const position = this.calculateElementPosition(
            element, 
            startGridLine, 
            startOffset, 
            topGridLine, 
            topOffset
        );
        
        // 保存位置信息到元素
        element.position = position;
        
        // 只有非虚拟类型才设置DOM属性
        if (!element.isVirtual) {
            // 只设置网格位置和偏移，不使用justifySelf/alignSelf
            element.dom$.css({
                gridArea: `${position.top.gridLine} / ${position.start.gridLine} / ${position.bottom.gridLine} / ${position.end.gridLine}`,
                transform: `translate(${position.start.offset}px, ${position.top.offset}px)`
            });
        }
    }

    // 获取元素的结束位置（用于确定下一个元素的起始位置）
    getEndPosition(element) {
        if (!element.position) return null;
        return {
            gridLine: element.position.end.gridLine,
            offset: element.position.end.offset
        };
    }

    // 获取元素的底部位置（用于确定下一行元素的起始位置）
    // getBottomPosition(element) {
    //     if (!element.position) return null;
    //     return {
    //         gridLine: element.position.bottom.gridLine,
    //         offset: element.position.bottom.offset
    //     };
    // }

    // 处理GAP元素
    // processGap(gap, currentGridLine) {
    //     // 如果是数字，表示列数
    //     if (typeof gap === 'number') {
    //         return {
    //             gridLine: currentGridLine + gap,
    //             offset: 0
    //         };
    //     }
    //     // TODO: 处理其他类型的GAP，比如GAP(element.width())
    //     return null;
    // }

    // 设置debug模式的网格线显示
    setupDebugGrid() {
        if (this.debugger) {
            this.debugger.setupGrid();
        }
    }

    // 计算一行中的最大底部位置
    calculateMaxBottomPosition(rowElements, currentTopGridLine) {
        // 获取实际的元素数组
        const elements = rowElements.elements || rowElements;
        
        let maxBottomGridLine = currentTopGridLine; // 使用当前行的顶部网格线作为初始值
        let maxBottomOffset = 0;

        for (let element of elements) {
            if (!element.position) continue;

            const bottomPosition = element.position.bottom;
            if (bottomPosition.gridLine > maxBottomGridLine ||
                (bottomPosition.gridLine === maxBottomGridLine && 
                 bottomPosition.offset > maxBottomOffset)) {
                maxBottomGridLine = bottomPosition.gridLine;
                maxBottomOffset = bottomPosition.offset;
            }
        }

        return {
            gridLine: maxBottomGridLine,
            offset: maxBottomOffset
        };
    }

    // 处理单个元素（包括可能的嵌套布局）
    processElement(element, currentGridLine, currentOffset, topGridLine, topOffset, topContainer) {
        // 1. 初始化元素
        this.initializeElement(element, topContainer);
        
        // 2. 设置元素位置
        this.setElementPosition(
            element,
            currentGridLine,
            currentOffset,
            topGridLine,
            topOffset
        );

        // 3. 处理嵌套布局
        if (element.layout && element.layout.length > 0) {
            this.processNestedLayout(element, topContainer);
        }
    }

    // 初始化元素
    initializeElement(element, topContainer) {
        if (element instanceof GridUi) {
            // 设置网格单元尺寸
            element.setGridUnit(this.gridUnitWidth, this.gridUnitHeight);
            
            // 只有非虚拟类型才需要添加到DOM
            if (!element.isVirtual && !element.dom$.parent().is(topContainer.dom$)) {
                topContainer.dom$.append(element.dom$);
            }
        }
    }

    // 处理嵌套布局
    processNestedLayout(element, topContainer) {
        // 计算嵌套布局的起始位置
        const layoutPosition = this.calculateNestedLayoutPosition(element);
        
        // 处理嵌套布局
        const layoutResult = element.processLayout(
            layoutPosition.startGridLine,
            layoutPosition.startOffset,
            layoutPosition.topGridLine,
            layoutPosition.topOffset,
            topContainer
        );

        // 更新元素位置
        this.updateElementPosition(element, layoutResult);
    }

    // 计算嵌套布局的起始位置
    calculateNestedLayoutPosition(element) {
        let layoutStartGridLine = element.position.start.gridLine;
        let layoutStartOffset = element.position.start.offset;
        let layoutTopGridLine = element.position.top.gridLine;
        let layoutTopOffset = element.position.top.offset;

        if (!element.isVirtual) {
            const $dom = element.dom$;
            layoutStartOffset += parseFloat($dom.css('paddingLeft')) || 0;
            layoutTopOffset += parseFloat($dom.css('paddingTop')) || 0;
        }

        return {
            startGridLine: layoutStartGridLine,
            startOffset: layoutStartOffset,
            topGridLine: layoutTopGridLine,
            topOffset: layoutTopOffset
        };
    }

    // 更新元素位置
    updateElementPosition(element, layoutResult) {
        if (element.isVirtual) {
            // 虚拟类型：直接使用子元素布局的结果
            element.position.end.gridLine = layoutResult.maxEndGridLine;
            element.position.end.offset = layoutResult.maxEndOffset;
            element.position.bottom.gridLine = layoutResult.maxBottomGridLine;
            element.position.bottom.offset = layoutResult.maxBottomOffset;
        } else {
            // 非虚拟类型：只在子元素超出时更新
            if (this.shouldUpdatePosition(element, layoutResult)) {
                this.updatePositionAndDOM(element, layoutResult);
            }
        }
    }

    // 判断是否需要更新位置
    shouldUpdatePosition(element, layoutResult) {
        return layoutResult.maxEndGridLine > element.position.end.gridLine ||
            (layoutResult.maxEndGridLine === element.position.end.gridLine && 
             layoutResult.maxEndOffset > element.position.end.offset) ||
            layoutResult.maxBottomGridLine > element.position.bottom.gridLine ||
            (layoutResult.maxBottomGridLine === element.position.bottom.gridLine && 
             layoutResult.maxBottomOffset > element.position.bottom.offset);
    }

    // 更新位置和DOM
    updatePositionAndDOM(element, layoutResult) {
        element.position.end.gridLine = layoutResult.maxEndGridLine;
        element.position.end.offset = layoutResult.maxEndOffset;
        element.position.bottom.gridLine = layoutResult.maxBottomGridLine;
        element.position.bottom.offset = layoutResult.maxBottomOffset;

        // 更新DOM
        element.dom$.css({
            gridArea: `${element.position.top.gridLine} / ${element.position.start.gridLine} / ${element.position.bottom.gridLine} / ${element.position.end.gridLine}`
        });
    }

    // 修改位置规范化方法，同时处理水平和垂直方向
    normalizePosition(position, gridUnitSize) {
        if(position.offset > gridUnitSize){
            const extraGridsH = Math.ceil(position.offset / gridUnitSize);
            position.offset = position.offset - extraGridsH * this.gridUnitWidth;
            position.gridLine = position.gridLine + extraGridsH;
        }
        return position;
    }

    // 处理layout，添加topContainer参数
    processLayout(startGridLine, startOffset, topGridLine, topOffset, topContainer) {
        if (this.layout && this.layout.length > 0) {
            let currentTopGridLine = topGridLine;
            let currentTopOffset = topOffset;
            
            // 声明边界变量，但不立即初始化
            let minStartGridLine, minStartOffset;
            let minTopGridLine, minTopOffset;
            let maxEndGridLine, maxEndOffset;
            let maxBottomGridLine, maxBottomOffset;

            // 处理每一行
            for (let [rowIndex, row] of this.layout.entries()) {
                const elements = row.elements || row;
                
                // 1. 计算行尺寸
                const rowSize = this.rowSizeMode === 'precise'
                    ? this.calculateRowSizePrecise(
                        elements,
                        startGridLine,
                        startOffset,
                        currentTopGridLine,
                        currentTopOffset,
                        topContainer
                      )
                    : this.calculateRowSizeFast(elements);

                // 2. 处理行（包括对齐等）
                const rowEndPosition = this.processRow(
                    row, 
                    startGridLine,
                    startOffset,
                    currentTopGridLine,
                    currentTopOffset,
                    topContainer
                );

                // 3. 计算这一行的最大底部位置，用于下一行
                const maxBottom = this.calculateMaxBottomPosition(row, currentTopGridLine);

                // 4. 在完成行处理后，获取第一个元素的实际位置用于调试显示
                const firstElement = elements[0];
                const rowStartPosition = firstElement.position.start;

                // 5. 在debug模式下显示行边界，使用实际的最终位置
                if (this.debugger) {
                    this.debugger.showRowBoundary(
                        currentTopGridLine,
                        currentTopOffset,
                        maxBottom.gridLine,
                        maxBottom.offset,
                        rowStartPosition,
                        rowEndPosition,
                        rowIndex,
                        rowSize.width
                    );
                }

                // 规范化起始位置
                const normalizedStart = this.normalizePosition(rowStartPosition, this.gridUnitWidth);

                const normalizedEnd = this.normalizePosition(rowEndPosition, this.gridUnitWidth);

                const normalizedTop = this.normalizePosition({
                    gridLine: currentTopGridLine,
                    offset: currentTopOffset
                }, this.gridUnitHeight);

                const normalizedBottom = this.normalizePosition({
                    gridLine: maxBottom.gridLine,
                    offset: maxBottom.offset
                }, this.gridUnitHeight);

                if (rowIndex === 0) {
                    minStartGridLine = normalizedStart.gridLine;
                    minStartOffset = normalizedStart.offset;
                    minTopGridLine = normalizedTop.gridLine;
                    minTopOffset = normalizedTop.offset;
                    maxEndGridLine = normalizedEnd.gridLine;
                    maxEndOffset = normalizedEnd.offset;
                    maxBottomGridLine = normalizedBottom.gridLine;
                    maxBottomOffset = normalizedBottom.offset;
                } else {
                    // 使用规范化后的值进行比较
                    if (normalizedStart.gridLine < minStartGridLine || 
                        (normalizedStart.gridLine === minStartGridLine && normalizedStart.offset < minStartOffset)) {
                        minStartGridLine = normalizedStart.gridLine;
                        minStartOffset = normalizedStart.offset;
                    }

                    if (normalizedTop.gridLine < minTopGridLine || 
                        (normalizedTop.gridLine === minTopGridLine && normalizedTop.offset < minTopOffset)) {
                        minTopGridLine = normalizedTop.gridLine;
                        minTopOffset = normalizedTop.offset;
                    }

                    if (normalizedEnd.gridLine > maxEndGridLine || 
                        (normalizedEnd.gridLine === maxEndGridLine && normalizedEnd.offset > maxEndOffset)) {
                        maxEndGridLine = normalizedEnd.gridLine;
                        maxEndOffset = normalizedEnd.offset;
                    }

                    if (normalizedBottom.gridLine > maxBottomGridLine || 
                        (normalizedBottom.gridLine === maxBottomGridLine && normalizedBottom.offset > maxBottomOffset)) {
                        maxBottomGridLine = normalizedBottom.gridLine;
                        maxBottomOffset = normalizedBottom.offset;
                    }
                }

                currentTopGridLine = maxBottom.gridLine;
                currentTopOffset = maxBottom.offset;
            }

            // 返回完整的边界信息
            return {
                minStartGridLine,
                minStartOffset,
                minTopGridLine,
                minTopOffset,
                maxEndGridLine,
                maxEndOffset,
                maxBottomGridLine,
                maxBottomOffset
            };
        }
        return null;
    }

    // 两种计算方式
    calculateRowSizeFast(elements) {
        let totalWidth = 0;
        let maxHeight = 0;
        
        for (let element of elements) {
            if (!element.isVirtual) {
                const fullSize = this.getElementFullSize(element);
                totalWidth += fullSize.width;
                maxHeight = Math.max(maxHeight, fullSize.height);
            } else if (element.layout && element.layout.length > 0) {
                const { width, height } = this.calculateVirtualElementSize(element, this);
                totalWidth += width;
                maxHeight = Math.max(maxHeight, height);
            }
        }

        return {
            width: totalWidth,
            height: maxHeight
        };
    }

    calculateRowSizePrecise(elements, startGridLine, startOffset, topGridLine, topOffset, topContainer) {
        // 如果是在render阶段之前调用（gridUnit还未设置），则使用快速模式
        if (!this.gridUnitWidth || !this.gridUnitHeight) {
            return this.calculateRowSizeFast(elements);
        }

        // 1. 先按照实际布局规则临时布局一次
        let currentGridLine = startGridLine;
        let currentOffset = startOffset;

        // 记录所有元素的临时位置
        for (let element of elements) {
            this.processElement(
                element,
                currentGridLine,
                currentOffset,
                topGridLine,
                topOffset,
                topContainer
            );

            // 更新下一个元素的起始位置
            const endPosition = this.getEndPosition(element);
            currentGridLine = endPosition.gridLine;
            currentOffset = endPosition.offset;
        }

        // 2. 计算行的实际尺寸
        const firstElement = elements[0];
        const lastElement = elements[elements.length - 1];

        // 行宽度 = 最后元素结束位置 - 第一个元素起始位置
        const width = (lastElement.position.end.gridLine - firstElement.position.start.gridLine) * this.gridUnitWidth +
                     (lastElement.position.end.offset - firstElement.position.start.offset);

        // 行高度 = 所有元素的最大底部位置 - 最小顶部位置
        const minTop = Math.min(...elements.map(el => 
            el.position.top.gridLine * this.gridUnitHeight + el.position.top.offset
        ));
        const maxBottom = Math.max(...elements.map(el => 
            el.position.bottom.gridLine * this.gridUnitHeight + el.position.bottom.offset
        ));
        const height = maxBottom - minTop;

        // 3. 清除所有元素的临时位置信息
        elements.forEach(element => {
            element.position = { start: null, end: null, top: null, bottom: null };
        });

        return { width, height };
    }

    // 在 processRow 中使用
    processRow(rowElements, startGridLine, startOffset, topGridLine, topOffset, topContainer) {
        const elements = rowElements.elements || rowElements;
        const rowAlign = rowElements.align || {};

        if (!rowAlign.horizontal && !rowAlign.vertical) {
            return this.processRowElements(
                elements, startGridLine, startOffset, 
                topGridLine, topOffset, topContainer
            );
        }

        // 使用精确模式时传入完整的位置参数
        const rowSize = this.rowSizeMode === 'precise'
            ? this.calculateRowSizePrecise(
                elements,
                startGridLine,
                startOffset,
                topGridLine,
                topOffset,
                topContainer
              )
            : this.calculateRowSizeFast(elements);

        const { horizontalOffset, verticalOffset } = this.calculateAlignmentOffset(
            rowAlign, rowSize.width, rowSize.height
        );

        return this.processRowElements(
            elements,
            startGridLine,
            startOffset + horizontalOffset,
            topGridLine,
            topOffset + verticalOffset,
            topContainer
        );
    }

    // 统一处理行元素的函数（替代之前的两个重复函数）
    processRowElements(elements, startGridLine, startOffset, topGridLine, topOffset, topContainer) {
        let currentGridLine = startGridLine;
        let currentOffset = startOffset;

        for (let element of elements) {
            this.processElement(
                element, currentGridLine, currentOffset, 
                topGridLine, topOffset, topContainer
            );

            const endPosition = this.getEndPosition(element);
            currentGridLine = endPosition.gridLine;
            currentOffset = endPosition.offset;
        }

        return { gridLine: currentGridLine, offset: currentOffset };
    }

    // render方法
    render() {
        if (!this.isVirtual) {
            // 获取容器的实际尺寸（包含padding）
            const containerWidth = this.dom$.width();   
            const containerHeight = this.dom$.height(); 
            
            // 计算单个网格的宽度和高度
            this.gridUnitWidth = Math.floor(containerWidth / this.gridCols);
            this.gridUnitHeight = Math.floor(containerHeight / this.gridRows);
            
            // 设置grid布局
            this.dom$.css({
                display: 'grid',
                gridTemplateColumns: `repeat(${this.gridCols}, ${this.gridUnitWidth}px)`,
                gridTemplateRows: `repeat(${this.gridRows}, ${this.gridUnitHeight}px)`
            });

            // 设置debug模式的网格线显示
            if (this.debugger) {
                this.dom$.css('position', 'relative');
                this.debugger.setupGrid();
            }

            // 如果是顶级容器，设置给所有debugger
            if (this.debug) {
                this.setDebuggerTopContainer(this);
            }

            // 处理布局并获取虚拟块信息
            const virtualBlock = this.processLayout(1, 0, 1, 0, this);

            // 如果设置了网格对齐，计算并应用整体偏移
            if (this.gridAlign && (this.gridAlign.horizontal || this.gridAlign.vertical)) {
                // 计算虚拟块的实际宽度和高度，考虑起始位置
                const blockWidth = 
                    (virtualBlock.maxEndGridLine - virtualBlock.minStartGridLine) * this.gridUnitWidth + 
                    (virtualBlock.maxEndOffset - virtualBlock.minStartOffset);

                const blockHeight = 
                    (virtualBlock.maxBottomGridLine - virtualBlock.minTopGridLine) * this.gridUnitHeight + 
                    (virtualBlock.maxBottomOffset - virtualBlock.minTopOffset);

                // 复用现有的对齐偏移计算
                const { horizontalOffset, verticalOffset } = this.calculateAlignmentOffset(
                    this.gridAlign,
                    blockWidth,
                    blockHeight,
                    containerWidth,
                    containerHeight
                );

                // 为所有直接子元素添加偏移
                this.dom$.children().each((_, child) => {
                    const $child = $(child);
                    if(this.debug && $child.hasClass('grid-debug-container')) {
                        return;
                    }
                    const currentTransform = $child.css('transform');
                    
                    let currentX = 0, currentY = 0;
                    
                    if (currentTransform !== 'none') {
                        // 解析矩阵值
                        const matrix = currentTransform.match(/matrix\((.*?)\)/)[1].split(',');
                        currentX = parseFloat(matrix[4]);
                        currentY = parseFloat(matrix[5]);
                    }
                    
                    // 应用新的偏移
                    const newX = currentX + horizontalOffset;
                    const newY = currentY + verticalOffset;
                    $child.css('transform', `translate(${newX}px, ${newY}px)`);
                });
            }
        }
        return this;
    }

    // 1. 计算虚拟元素的尺寸
    calculateVirtualElementSize(element, topContainer) {
        if (!element.layout || element.layout.length === 0) return { width: 0, height: 0 };

        let maxWidth = 0;
        let totalHeight = 0;

        for (let row of element.layout) {
            const rowElements = row.elements || row;
            const rowAlign = row.align || {};

            // 计算这一行的基本尺寸
            let rowWidth = 0;
            let rowMaxHeight = 0;

            for (let child of rowElements) {
                if (!child.isVirtual) {
                    const childSize = this.getElementFullSize(child);
                    rowWidth += childSize.width;
                    rowMaxHeight = Math.max(rowMaxHeight, childSize.height);
                } else if (child.layout && child.layout.length > 0) {
                    // 递归计算虚拟子元素的尺寸
                    const { width, height } = this.calculateVirtualElementSize(child, topContainer);
                    rowWidth += width;
                    rowMaxHeight = Math.max(rowMaxHeight, height);
                }
            }

            // 考虑行对齐可能带来的额外空间
            if (rowAlign.horizontal === 'center' || rowAlign.horizontal === 'right') {
                rowWidth = Math.max(rowWidth, topContainer.gridCols * topContainer.gridUnitWidth);
            }

            maxWidth = Math.max(maxWidth, rowWidth);
            totalHeight += rowMaxHeight;
        }

        return { width: maxWidth, height: totalHeight };
    }

    // 4. 计算对齐偏移
    calculateAlignmentOffset(rowAlign, totalWidth, maxHeight, containerWidth, containerHeight) {
        const horizontalOffset = this.calculateHorizontalOffset(rowAlign.horizontal, totalWidth, containerWidth);
        const verticalOffset = this.calculateVerticalOffset(rowAlign.vertical, maxHeight, containerHeight);
        return { horizontalOffset, verticalOffset };
    }

    // 5. 计算水平对齐偏移
    calculateHorizontalOffset(horizontalAlign, totalWidth, containerWidth) {
        if (!horizontalAlign) return 0;

        const availableWidth = containerWidth || this.gridCols * this.gridUnitWidth;
        const extraSpace = availableWidth - totalWidth;
        
        if (horizontalAlign === 'center') return extraSpace / 2;
        if (horizontalAlign === 'right') return extraSpace;
        return 0;
    }

    // 6. 计算垂直对齐偏移
    calculateVerticalOffset(verticalAlign, maxHeight, containerHeight) {
        if (!verticalAlign) return 0;

        // const rowSpan = Math.ceil(maxHeight / this.gridUnitHeight);
        const availableHeight = containerHeight || Math.ceil(maxHeight / this.gridUnitHeight) * this.gridUnitHeight;
        const extraSpace = availableHeight - maxHeight;

        if (verticalAlign === 'middle') return extraSpace / 2;
        if (verticalAlign === 'bottom') return extraSpace;
        return 0;
    }

    // 递归设置所有debugger的顶级容器
    setDebuggerTopContainer(topContainer) {
        if (this.debugger) {
            this.debugger.setTopContainer(topContainer);
        }

        // 递归设置子元素的debugger
        if (this.layout) {
            this.layout.forEach(row => {
                const elements = row.elements || row;
                elements.forEach(element => {
                    if (element.debug) {
                        element.setDebuggerTopContainer(topContainer);
                    }
                });
            });
        }
    }
}

// 添加到 GridUi 类外部
function BLANK_DIV(width) {
    // 如果传入的是数字，假定单位是px
    const widthStr = typeof width === 'number' ? `${width}px` : width;
    
    return new GridUi({
        html: '<div></div>',
        style: {
            width: widthStr,
            height: '5px',
            backgroundColor: 'blue'
        }
    });
}

// 1. 修改 row 工具对象，支持水平和垂直对齐
const row = {
    // 水平对齐
    left: (elements) => ({
        elements,
        align: { horizontal: 'left' }
    }),
    center: (elements) => ({
        elements,
        align: { horizontal: 'center' }
    }),
    right: (elements) => ({
        elements,
        align: { horizontal: 'right' }
    }),

    // 垂直对齐
    top: (elements) => ({
        elements,
        align: { vertical: 'top' }
    }),
    middle: (elements) => ({
        elements,
        align: { vertical: 'middle' }
    }),
    bottom: (elements) => ({
        elements,
        align: { vertical: 'bottom' }
    }),

    // 组合对齐
    centerMiddle: (elements) => ({
        elements,
        align: { horizontal: 'center', vertical: 'middle' }
    }),
    leftMiddle: (elements) => ({
        elements,
        align: { horizontal: 'left', vertical: 'middle' }
    })
    // ... 其他组合
};

// 3. 导出对齐工具对象
// export { row };

/**
 * 计算布局中所有行的尺寸以及顶级元素的虚拟块尺寸
 * @param {Array} layout - 布局配置
 * @param {GridUi} container - 容器实例
 * @param {boolean} isTopLevel - 是否是顶级元素的布局
 * @returns {{
 *   rowSizes: Array<{
 *     width: number,      // 行宽度（所有元素外部尺寸之和）
 *     height: number,     // 行高度（最高元素的外部尺寸）
 *     elements: Array,    // 行内元素引用
 *     rowIndex: number,   // 行索引
 *     align: Object       // 行对齐配置
 *   }>,
 *   virtualBlock?: {      // 仅在顶级元素时存在
 *     width: number,      // 虚拟块宽度（最宽行的宽度）
 *     height: number,     // 虚拟块高度（所有行高度之和）
 *     align: Object       // 虚拟块对齐配置
 *   }
 * }}
 */
function calculateLayoutSizes(layout, container, isTopLevel = false) {
    // 如果没有布局，返回空结果
    if (!layout || !layout.length) {
        return { rowSizes: [] };
    }

    // 计算单个元素的外部尺寸
    function getElementOuterSize(element) {
        if (element.isVirtual) {
            // 虚拟元素：递归计算其内部布局的尺寸
            if (element.layout && element.layout.length > 0) {
                const { rowSizes } = calculateLayoutSizes(element.layout, element);
                return {
                    width: Math.max(...rowSizes.map(row => row.width)),    // 取最宽行的宽度
                    height: rowSizes.reduce((sum, row) => sum + row.height, 0)  // 所有行高度之和
                };
            }
            return { width: 0, height: 0 };
        }

        // 非虚拟元素：直接获取DOM元素的外部尺寸
        const $dom = element.dom$;
        return {
            width: $dom.outerWidth(true),   // true表示包含margin
            height: $dom.outerHeight(true)
        };
    }

    // 处理每一行
    const rowSizes = layout.map((row, rowIndex) => {
        // 获取行内元素
        const elements = row.elements || row;
        
        // 计算行尺寸
        const sizes = elements.map(element => getElementOuterSize(element));
        
        return {
            width: sizes.reduce((sum, size) => sum + size.width, 0),  // 行宽 = 所有元素宽度之和
            height: Math.max(...sizes.map(size => size.height)),      // 行高 = 最高元素的高度
            elements,
            rowIndex,
            align: row.align
        };
    });

    // 如果是顶级元素，计算虚拟块尺寸
    if (isTopLevel) {
        const virtualBlock = {
            width: Math.max(...rowSizes.map(row => row.width)),    // 虚拟块宽度 = 最宽行的宽度
            height: rowSizes.reduce((sum, row) => sum + row.height, 0),  // 虚拟块高度 = 所有行高度之和
            align: layout.align  // 如果是grid布局，这里会包含grid的对齐信息
        };

        return { rowSizes, virtualBlock };
    }

    return { rowSizes };
}

// 添加到 GridUi 类外部，类似于 row 对象
const grid = {
    center: (rows) => ({
        rows,
        align: { horizontal: 'center' }
    }),
    middle: (rows) => ({
        rows,
        align: { vertical: 'middle' }
    }),
    centerMiddle: (rows) => ({
        rows,
        align: { horizontal: 'center', vertical: 'middle' }
    })
    // ... 其他对齐方式
};
