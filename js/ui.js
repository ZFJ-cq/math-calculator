// ui.js
// UI 控制逻辑

(function(global) {

    let currentSubject = 'primary';
    let currentMode = 'scientific';
    let currentTheme = 'light'; // 默认主题
    let currentAngleMode = 'rad'; // 'rad' 或 'deg'
    let lastResult = null; // 保存最近一次计算结果，供模式切换时重渲染使用

    const MODE_LABELS = {
        simple: '简单',
        scientific: '科学',
        professional: '专业'
    };

    // DOM 元素引用
    const domElements = {
        expressionInput: document.getElementById('expression-input'),
        calculateBtn: document.getElementById('calculate-btn'),
        clearBtn: document.getElementById('clear-btn'),
        resultDisplay: document.getElementById('result-display'),
        stepsDisplay: document.getElementById('steps-display'),
        historyList: document.getElementById('history-list'),
        favoritesList: document.getElementById('favorites-list'),
        mobileHistoryList: document.getElementById('mobile-history-list'),
        mobileFavoritesList: document.getElementById('mobile-favorites-list'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        clearFavoritesBtn: document.getElementById('clear-favorites-btn'),
        mobileClearHistoryBtn: document.getElementById('mobile-clear-history-btn'),
        mobileClearFavoritesBtn: document.getElementById('mobile-clear-favorites-btn'),
        mobileSubjectSelect: document.getElementById('mobile-subject-select'),
        virtualKeyboard: document.getElementById('virtual-keyboard'),
        themeToggleBtn: document.getElementById('theme-toggle'),
        modeToggleBtn: document.getElementById('mode-toggle'),
        modeBadge: document.getElementById('mode-badge'),
        subjectButtons: document.querySelectorAll('.subject-list button'),
        functionButtons: document.querySelectorAll('.function-list button'),
        tabButtons: document.querySelectorAll('.bottom-tabbar .tab-btn'),
        symbolsToolbar: document.querySelector('.symbols-toolbar'),
        symbolsBtn: document.getElementById('symbols-btn'),
        symbolsModal: document.getElementById('symbols-modal'),
        symbolsCloseBtn: document.getElementById('symbols-close'),
        symbolsBody: document.getElementById('symbols-body'),
        toggleStepsBtn: document.getElementById('toggle-steps-btn'),
        angleToggleBtn: document.getElementById('angle-toggle')
    };

    // 初始化
    function initUI() {
        loadSettings();
        setupEventListeners();
        renderHistoryList();
        renderFavoritesList();
        updateVirtualKeyboard();
        setupStepsToggle();
        applyTheme(currentTheme);
        updateSubject(currentSubject);

        // 修复移动端 tab 初始状态为计算视图
        showTab('calculator');
    }

    /**
     * 加载设置
     */
    function loadSettings() {
        const settings = storage.getSettings();
        currentSubject = settings.subject;
        currentMode = settings.mode;
        currentTheme = settings.theme;
        currentAngleMode = settings.angleMode || 'rad';

        // 更新 UI 状态
        domElements.mobileSubjectSelect.value = currentSubject;
        domElements.themeToggleBtn.textContent = currentTheme === 'dark' ? '浅色模式' : '深色模式';
        if (domElements.modeBadge) domElements.modeBadge.innerHTML = `模式: <strong>${MODE_LABELS[currentMode] || currentMode}</strong>`;
        if (domElements.modeToggleBtn) domElements.modeToggleBtn.textContent = '切换模式';
        if (domElements.angleToggleBtn) domElements.angleToggleBtn.textContent = currentAngleMode === 'deg' ? '角度: 度' : '角度: 弧度';
    }

    /**
     * 设置事件监听器
     */
    function setupEventListeners() {
        // 计算按钮
        domElements.calculateBtn.addEventListener('click', handleCalculate);

        // 清除按钮
        domElements.clearBtn.addEventListener('click', () => {
            domElements.expressionInput.value = '';
            domElements.resultDisplay.textContent = '请输入表达式并点击计算';
            domElements.stepsDisplay.classList.remove('show');
            domElements.stepsDisplay.innerHTML = '';
        });

        // 输入框实时计算 (可选)
        domElements.expressionInput.addEventListener('input', () => {
            // 可以在这里实现 "实时计算"
            // 但为了性能和用户体验，通常只在点击按钮时计算
        });

        // 移动端学段切换
        domElements.mobileSubjectSelect.addEventListener('change', (e) => {
            updateSubject(e.target.value);
        });

        // 主题切换
        domElements.themeToggleBtn.addEventListener('click', toggleTheme);

        // 模式切换
        domElements.modeToggleBtn.addEventListener('click', toggleMode);

        // 角度模式切换
        domElements.angleToggleBtn?.addEventListener('click', () => {
            currentAngleMode = currentAngleMode === 'rad' ? 'deg' : 'rad';
            const settings = storage.getSettings();
            settings.angleMode = currentAngleMode;
            storage.saveSettings(settings);
            domElements.angleToggleBtn.textContent = currentAngleMode === 'deg' ? '角度: 度' : '角度: 弧度';
            // 立即重渲染上次结果以反映角度模式
            try { if (lastResult) displayResult(lastResult); } catch(e) { console.warn('角度切换重渲染失败', e); }
        });

        // 学段按钮
        domElements.subjectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                updateSubject(btn.dataset.subject);
            });
        });

        // 功能按钮
        domElements.functionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.id;
                switch(action) {
                    case 'history-btn':
                        showTab('history');
                        break;
                    case 'favorites-btn':
                        showTab('favorites');
                        break;
                    case 'tools-btn':
                        showTab('tools');
                        break;
                    default:
                        console.log(`未处理的功能按钮: ${action}`);
                }
            });
        });

        // 清空历史/收藏（桌面）
        domElements.clearHistoryBtn?.addEventListener('click', () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                storage.clearHistory();
                renderHistoryList();
                renderHistoryList();
            }
        });
        domElements.clearFavoritesBtn?.addEventListener('click', () => {
            if (confirm('确定要清空所有收藏吗？')) {
                storage.clearFavorites();
                renderFavoritesList();
                renderFavoritesList();
            }
        });

        // 清空历史/收藏（移动）
        domElements.mobileClearHistoryBtn?.addEventListener('click', () => {
            if (confirm('确定要清空所有历史记录吗？')) {
                storage.clearHistory();
                renderHistoryList();
            }
        });
        domElements.mobileClearFavoritesBtn?.addEventListener('click', () => {
            if (confirm('确定要清空所有收藏吗？')) {
                storage.clearFavorites();
                renderFavoritesList();
            }
        });

        // Tab 切换
        domElements.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                showTab(tabName);
            });
        });

        // 符号参考（模态）打开/关闭
        domElements.symbolsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            showSymbolsModal();
        });
        domElements.symbolsCloseBtn?.addEventListener('click', hideSymbolsModal);
        domElements.symbolsModal?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) hideSymbolsModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && domElements.symbolsModal && getComputedStyle(domElements.symbolsModal).display === 'flex') {
                hideSymbolsModal();
            }
        });

        // 符号插入
        domElements.symbolsToolbar?.addEventListener('click', (e) => {
            if (e.target.classList.contains('symbol')) {
                const symbolValue = e.target.dataset.value;
                const input = domElements.expressionInput;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const currentValue = input.value;
                input.value = currentValue.substring(0, start) + symbolValue + currentValue.substring(end);
                // 将光标放在插入符号之后
                setTimeout(() => {
                    input.setSelectionRange(start + symbolValue.length, start + symbolValue.length);
                    input.focus();
                }, 0);
            }
        });

        // 历史/收藏 列表委托处理（点击、收藏、删除）
        domElements.historyList?.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (e.target.classList.contains('action-btn')) {
                if (e.target.classList.contains('del')) {
                    storage.removeHistoryById(id);
                    renderHistoryList();
                } else if (e.target.classList.contains('fav')) {
                    const item = storage.getHistory().find(it => it.id === id);
                    if (item) {
                        // 避免重复收藏（按 input 判重）
                        const exists = storage.getFavorites().some(f => f.input === item.input);
                        if (!exists) storage.saveFavorites(Object.assign({}, item, { id: Date.now().toString() }));
                        renderFavoritesList();
                    }
                }
            } else {
                // 点击历史项文本：填充输入框并显示结果
                const li = e.target.closest('li');
                if (li && li.dataset && li.dataset.id) {
                    const h = storage.getHistory().find(it => it.id === li.dataset.id);
                    if (h) {
                        domElements.expressionInput.value = h.input;
                        domElements.resultDisplay.textContent = h.result;
                        domElements.stepsDisplay.innerHTML = '';
                        domElements.stepsDisplay.classList.remove('show');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            }
        });

        domElements.mobileHistoryList?.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            if (e.target.classList.contains('action-btn')) {
                if (e.target.classList.contains('del')) {
                    storage.removeHistoryById(id);
                    renderHistoryList();
                } else if (e.target.classList.contains('fav')) {
                    const item = storage.getHistory().find(it => it.id === id);
                    if (item) {
                        const exists = storage.getFavorites().some(f => f.input === item.input);
                        if (!exists) storage.saveFavorites(Object.assign({}, item, { id: Date.now().toString() }));
                        renderFavoritesList();
                    }
                }
            } else {
                const li = e.target.closest('li');
                if (li && li.dataset && li.dataset.id) {
                    const h = storage.getHistory().find(it => it.id === li.dataset.id);
                    if (h) {
                        domElements.expressionInput.value = h.input;
                        domElements.resultDisplay.textContent = h.result;
                        domElements.stepsDisplay.innerHTML = '';
                        domElements.stepsDisplay.classList.remove('show');
                        showTab('calculator');
                    }
                }
            }
        });

        // 收藏列表委托
        domElements.favoritesList?.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) {
                const id = e.target.dataset.id;
                if (e.target.classList.contains('del')) {
                    storage.removeFavoriteById(id);
                    renderFavoritesList();
                }
            } else {
                const li = e.target.closest('li');
                if (li && li.dataset && li.dataset.id) {
                    const f = storage.getFavorites().find(it => it.id === li.dataset.id);
                    if (f) {
                        domElements.expressionInput.value = f.input;
                        domElements.resultDisplay.textContent = f.result;
                        domElements.stepsDisplay.innerHTML = '';
                        domElements.stepsDisplay.classList.remove('show');
                        showTab('calculator');
                    }
                }
            }
        });

        domElements.mobileFavoritesList?.addEventListener('click', (e) => {
            if (e.target.classList.contains('action-btn')) {
                const id = e.target.dataset.id;
                if (e.target.classList.contains('del')) {
                    storage.removeFavoriteById(id);
                    renderFavoritesList();
                }
            } else {
                const li = e.target.closest('li');
                if (li && li.dataset && li.dataset.id) {
                    const f = storage.getFavorites().find(it => it.id === li.dataset.id);
                    if (f) {
                        domElements.expressionInput.value = f.input;
                        domElements.resultDisplay.textContent = f.result;
                        domElements.stepsDisplay.innerHTML = '';
                        domElements.stepsDisplay.classList.remove('show');
                        showTab('calculator');
                    }
                }
            }
        });

        // 虚拟键盘按键
        domElements.virtualKeyboard.addEventListener('click', (e) => {
            if (e.target.classList.contains('keyboard-key')) {
                const key = e.target.textContent;
                if (key === '⌫') {
                    // 退格
                    const input = domElements.expressionInput;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const currentValue = input.value;
                    if (start === end) {
                        // 删除光标前一个字符
                        if (start > 0) {
                            input.value = currentValue.substring(0, start - 1) + currentValue.substring(start);
                            input.setSelectionRange(start - 1, start - 1);
                        }
                    } else {
                        // 删除选中的文本
                        input.value = currentValue.substring(0, start) + currentValue.substring(end);
                        input.setSelectionRange(start, start);
                    }
                } else if (key === 'Enter') {
                    // 回车执行计算
                    handleCalculate();
                } else if (key === '=') {
                    // 等号直接计算（方便小学使用习惯）
                    handleCalculate();
                } else if (key === 'Space') {
                    // 插入空格
                    const input = domElements.expressionInput;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const currentValue = input.value;
                    input.value = currentValue.substring(0, start) + ' ' + currentValue.substring(end);
                    input.setSelectionRange(start + 1, start + 1);
                } else {
                    // 插入普通字符
                    const input = domElements.expressionInput;
                    const start = input.selectionStart;
                    const end = input.selectionEnd;
                    const currentValue = input.value;
                    input.value = currentValue.substring(0, start) + key + currentValue.substring(end);
                    input.setSelectionRange(start + key.length, start + key.length);
                }
                const focusEl = domElements.expressionInput;
                focusEl.focus();
            }
        });
    }

    /**
     * 处理计算请求
     */
    function handleCalculate() {
        const expression = domElements.expressionInput.value.trim();
        if (!expression) {
            domElements.resultDisplay.textContent = '请输入有效的表达式';
            return;
        }

        const result = calculator.calculate(expression, { precision: 10, angleMode: currentAngleMode });
        displayResult(result);

        // 保存到历史记录
        if (!result.error) {
            storage.saveHistory({
                id: Date.now().toString(), // 简单 ID
                input: expression,
                result: result.result,
                steps: result.steps,
                subject: currentSubject,
                mode: currentMode,
                angleMode: currentAngleMode,
                timestamp: result.timestamp
            });
            renderHistoryList(); // 更新历史列表
        }
    }

    /**
     * 显示计算结果
     * @param {Object} result - 计算结果对象
     */
    function displayResult(result) {
        // 尝试重新计算键盘 padding（避免结果/步骤被遮挡）
        try { recalcKeyboardPadding(); } catch (e) {}
        // 缓存结果以便模式切换时重渲染
        lastResult = result;

        if (result.error) {
            domElements.resultDisplay.textContent = result.error;
            domElements.stepsDisplay.classList.remove('show');
            domElements.stepsDisplay.innerHTML = '';
            if (domElements.toggleStepsBtn) domElements.toggleStepsBtn.style.display = 'none';
            return;
        }

        domElements.resultDisplay.textContent = result.result;

        const steps = result.steps || [];

        // 根据模式决定显示策略
        if (currentMode === 'simple') {
            // 只显示最终结果，隐藏步骤
            domElements.stepsDisplay.classList.remove('show');
            domElements.stepsDisplay.innerHTML = '';
            if (domElements.toggleStepsBtn) domElements.toggleStepsBtn.style.display = 'none';
            return;
        }

        if (steps.length === 0) {
            domElements.stepsDisplay.classList.remove('show');
            domElements.stepsDisplay.innerHTML = '';
            if (domElements.toggleStepsBtn) domElements.toggleStepsBtn.style.display = 'none';
            return;
        }

        // scientific: 显示简要步骤（最后一步），提供“查看详情”展开
        if (currentMode === 'scientific') {
            const brief = [steps[steps.length - 1]]; // 取最后一条为简要步骤
            domElements.stepsDisplay.innerHTML = `
                <h4>计算步骤（简要）</h4>
                <ul>
                    ${brief.map(step => `<li>${step}</li>`).join('')}
                </ul>
            `;
            domElements.stepsDisplay.dataset.allSteps = JSON.stringify(steps);
            domElements.stepsDisplay.classList.add('show');
            if (domElements.toggleStepsBtn) {
                domElements.toggleStepsBtn.style.display = 'inline-flex';
                domElements.toggleStepsBtn.classList.remove('active');
                domElements.toggleStepsBtn.textContent = '查看详情';
            }
            return;
        }

        // professional: 显示完整步骤（默认展开），允许折叠
        if (currentMode === 'professional') {
            domElements.stepsDisplay.innerHTML = `
                <h4>计算步骤</h4>
                <ul>
                    ${steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            `;
            domElements.stepsDisplay.dataset.allSteps = JSON.stringify(steps);
            domElements.stepsDisplay.classList.add('show');
            if (domElements.toggleStepsBtn) {
                domElements.toggleStepsBtn.style.display = 'inline-flex';
                domElements.toggleStepsBtn.classList.add('active');
                domElements.toggleStepsBtn.textContent = '收起步骤';
            }

            // 自动滚动到步骤区域，考虑虚拟键盘高度（若显示）
            setTimeout(() => {
                try {
                    recalcKeyboardPadding();
                    const kbPad = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
                    const rect = domElements.stepsDisplay.getBoundingClientRect();
                    const offsetTop = window.scrollY + rect.top - Math.max(kbPad, 120) - 20;
                    window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
                } catch (e) {
                    domElements.stepsDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 120);
            return;
        }
    }

    // Toggle steps button handler
    function setupStepsToggle() {
        if (!domElements.toggleStepsBtn) return;
        domElements.toggleStepsBtn.addEventListener('click', () => {
            // 根据当前模式决定切换行为
            if (currentMode === 'scientific') {
                // 在简要 <-> 全部 之间切换
                const isCurrentlyBrief = domElements.toggleStepsBtn.textContent === '查看详情' || domElements.toggleStepsBtn.textContent === '查看步骤';
                if (isCurrentlyBrief) {
                    // 展开为全部
                    const historySteps = domElements.stepsDisplay.dataset.allSteps ? JSON.parse(domElements.stepsDisplay.dataset.allSteps) : null;
                    if (historySteps) {
                        domElements.stepsDisplay.innerHTML = `\n                            <h4>计算步骤</h4>\n                            <ul>\n                                ${historySteps.map(step => `<li>${step}</li>`).join('')}\n                            </ul>\n                        `;
                        domElements.toggleStepsBtn.textContent = '收起详情';
                        domElements.toggleStepsBtn.classList.add('active');
                        setTimeout(() => {
                            recalcKeyboardPadding();
                            const kbPad = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
                            const rect = domElements.stepsDisplay.getBoundingClientRect();
                            const offsetTop = window.scrollY + rect.top - Math.max(kbPad, 120) - 20;
                            window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
                        }, 80);
                    }
                } else {
                    // 收起为简要
                    const historySteps = domElements.stepsDisplay.dataset.allSteps ? JSON.parse(domElements.stepsDisplay.dataset.allSteps) : null;
                    if (historySteps) {
                        const brief = [historySteps[historySteps.length - 1]];
                        domElements.stepsDisplay.innerHTML = `\n                            <h4>计算步骤（简要）</h4>\n                            <ul>\n                                ${brief.map(step => `<li>${step}</li>`).join('')}\n                            </ul>\n                        `;
                        domElements.toggleStepsBtn.textContent = '查看详情';
                        domElements.toggleStepsBtn.classList.remove('active');
                        setTimeout(() => {
                            recalcKeyboardPadding();
                            const kbPad = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
                            const rect = domElements.stepsDisplay.getBoundingClientRect();
                            const offsetTop = window.scrollY + rect.top - Math.max(kbPad, 120) - 20;
                            window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
                        }, 80);
                    }
                }
                return;
            }

            if (currentMode === 'professional') {
                // 在 全部 <-> 隐藏 之间切换
                const isShown = domElements.stepsDisplay.classList.toggle('show');
                if (isShown) {
                    domElements.toggleStepsBtn.classList.add('active');
                    domElements.toggleStepsBtn.textContent = '收起步骤';
                    setTimeout(() => domElements.stepsDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
                } else {
                    domElements.toggleStepsBtn.classList.remove('active');
                    domElements.toggleStepsBtn.textContent = '查看步骤';
                }
                return;
            }

            // fallback behavior: 切换显示/隐藏
            const isShown = domElements.stepsDisplay.classList.toggle('show');
            if (isShown) {
                domElements.toggleStepsBtn.classList.add('active');
                domElements.toggleStepsBtn.textContent = '收起步骤';
                setTimeout(() => {
                    recalcKeyboardPadding();
                    const kbPad = parseInt(getComputedStyle(document.body).paddingBottom) || 0;
                    const rect = domElements.stepsDisplay.getBoundingClientRect();
                    const offsetTop = window.scrollY + rect.top - Math.max(kbPad, 120) - 20;
                    window.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
                }, 80);
            } else {
                domElements.toggleStepsBtn.classList.remove('active');
                domElements.toggleStepsBtn.textContent = '查看步骤';
            }
        });
    }

    /**
     * 更新当前学段
     * @param {string} subject - 新的学段
     */
    function updateSubject(subject) {
        if (subject === currentSubject) return;

        currentSubject = subject;
        domElements.mobileSubjectSelect.value = subject;

        // 更新设置
        const settings = storage.getSettings();
        settings.subject = subject;
        storage.saveSettings(settings);

        // 更新虚拟键盘和符号面板
        updateVirtualKeyboard();

        console.log(`切换到学段: ${subject}`);
    }

    /**
     * 切换模式
     */
    function toggleMode() {
        const modes = ['simple', 'scientific', 'professional'];
        const currentIndex = modes.indexOf(currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        currentMode = modes[nextIndex];

        // 更新设置
        const settings = storage.getSettings();
        settings.mode = currentMode;
        storage.saveSettings(settings);

        // 更新徽章为中文
        if (domElements.modeBadge) domElements.modeBadge.innerHTML = `模式: <strong>${MODE_LABELS[currentMode] || currentMode}</strong>`;
        console.log(`切换到模式: ${currentMode}`);

        // 视觉提示（短暂闪烁）
        if (domElements.modeBadge) {
            domElements.modeBadge.classList.add('pulse');
            setTimeout(() => domElements.modeBadge.classList.remove('pulse'), 600);
        }

        // 立即重渲染上次结果以反映新模式（如果存在）
        try {
            if (lastResult) displayResult(lastResult);
        } catch (e) {
            console.warn('模式切换重渲染失败', e);
        }
    }

    /**
     * 切换主题
     */
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(currentTheme);

        // 更新设置
        const settings = storage.getSettings();
        settings.theme = currentTheme;
        storage.saveSettings(settings);

        domElements.themeToggleBtn.textContent = currentTheme === 'dark' ? '浅色模式' : '深色模式';
    }

    /**
     * 应用主题
     * @param {string} theme - 'light' 或 'dark'
     */
    function applyTheme(theme) {
        document.body.className = theme === 'dark' ? 'dark-theme' : '';
        // 可以添加更多主题相关的样式调整
    }

    /**
     * 返回各学段的键盘布局
     */
    function getKeyboardLayout(subject) {
        const base = [
            ['1','2','3','4','5','6','7','8','9','0'],
            ['+','-','*','/','^','(',' )','°'],
            ['sqrt(','sin(','cos(','tan(','log(','ln(','abs('],
            ['⌫','Space','=','Enter']
        ];
        if (subject === 'primary') {
            // 小学：更简洁的大键盘
            return [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['+','-','×','÷','·','(',')','='],
                ['⌫','Space','Enter']
            ];
        }
        if (subject === 'junior') {
            return [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['+','-','×','÷','·','^','²','³','ⁿ','='],
                ['√','∛','(',')','±','≥','≤','≠'],
                ['⌫','Space','Enter']
            ];
        }
        return base;
    }

    /**
     * 更新虚拟键盘
     */
    function updateVirtualKeyboard() {
        const keyboardLayout = getKeyboardLayout(currentSubject);

        // 设定样式类，便于针对小学做大按键样式
        domElements.virtualKeyboard.classList.toggle('primary', currentSubject === 'primary');

        domElements.virtualKeyboard.innerHTML = '';

        const inner = document.createElement('div');
        inner.className = 'keyboard-inner';

        // 添加抓手用于显式下滑收起
        const grabber = document.createElement('div');
        grabber.className = 'kb-grabber';
        inner.appendChild(grabber);

        const ariaMap = {
            '×':'乘','÷':'除','·':'乘','±':'正负','√':'根号','∛':'立方根','²':'平方','³':'立方','ⁿ':'次方',
            '≥':'大于等于','≤':'小于等于','≠':'不等','=':'等于','⌫':'退格','Space':'空格','Enter':'回车','°':'度'
        };

        keyboardLayout.forEach(row => {
            const rowElement = document.createElement('div');
            rowElement.className = 'keyboard-row';
            row.forEach(key => {
                const keyElement = document.createElement('div');
                keyElement.classList.add('keyboard-key');
                keyElement.setAttribute('role', 'button');
                keyElement.tabIndex = 0;

                if (key === 'Space') {
                    keyElement.textContent = 'Space';
                    keyElement.classList.add('space');
                    keyElement.setAttribute('aria-label', ariaMap['Space']);
                } else if (key === '⌫') {
                    keyElement.textContent = '⌫';
                    keyElement.setAttribute('aria-label', ariaMap['⌫']);
                } else if (key === 'Enter') {
                    keyElement.textContent = 'Enter';
                    keyElement.classList.add('primary');
                    keyElement.setAttribute('aria-label', ariaMap['Enter']);
                } else if (key === '=') {
                    keyElement.textContent = '=';
                    keyElement.classList.add('primary','equal');
                    keyElement.setAttribute('aria-label', ariaMap['=']);
                } else {
                    keyElement.textContent = key;
                    keyElement.setAttribute('aria-label', ariaMap[key] || key);
                }

                rowElement.appendChild(keyElement);
            });
            inner.appendChild(rowElement);
        });

        domElements.virtualKeyboard.appendChild(inner);

        // 触控手势：上/下滑可收起键盘（基于 touch 事件）
        (function attachKeyboardGestures() {
            let startY = 0;
            let lastY = 0;
            let dragging = false;
            const threshold = 60; // px

            const onTouchStart = (e) => {
                if (!e.touches || e.touches.length === 0) return;
                startY = e.touches[0].clientY;
                lastY = startY;
                dragging = true;
            };
            const onTouchMove = (e) => {
                if (!dragging || !e.touches || e.touches.length === 0) return;
                lastY = e.touches[0].clientY;
                const dy = lastY - startY;
                // 如果向下拖拽，提供视觉反馈
                if (dy > 8) {
                    inner.style.transform = `translateY(${dy}px)`;
                }
            };
            const onTouchEnd = (e) => {
                dragging = false;
                const dy = lastY - startY;
                inner.style.transition = '';
                inner.style.transform = '';
                if (dy > threshold) {
                    hideKeyboard();
                }
            };

            // attach to grabber and to keyboard container
            const grab = inner.querySelector('.kb-grabber');
            if (grab) {
                grab.addEventListener('touchstart', onTouchStart, {passive:true});
                grab.addEventListener('touchmove', onTouchMove, {passive:true});
                grab.addEventListener('touchend', onTouchEnd, {passive:true});
                grab.addEventListener('click', () => hideKeyboard());
            }

            domElements.virtualKeyboard.addEventListener('touchstart', onTouchStart, {passive:true});
            domElements.virtualKeyboard.addEventListener('touchmove', onTouchMove, {passive:true});
            domElements.virtualKeyboard.addEventListener('touchend', onTouchEnd, {passive:true});
        })();

        // 为避免遮挡内容，设置 body 的底部内边距与虚拟键盘高度一致（仅在移动端）
        setTimeout(() => {
            try {
                recalcKeyboardPadding();
            } catch (e) {
                // ignore
            }
        }, 50);

        // 为避免遮挡内容，设置 body 的底部内边距与虚拟键盘高度一致（仅在移动端）
        setTimeout(() => {
            try {
                const kb = domElements.virtualKeyboard.querySelector('.keyboard-inner') || domElements.virtualKeyboard;
                if (kb && getComputedStyle(domElements.virtualKeyboard).display !== 'none') {
                    const h = kb.offsetHeight || 0;
                    document.body.style.paddingBottom = h + 'px';
                } else {
                    document.body.style.paddingBottom = '';
                }
            } catch (e) {
                // ignore
            }
        }, 50);
    }

    /**
     * 显示指定 Tab
     * @param {string} tabName - Tab 名称
     */
    function showTab(tabName) {
        // 切换底部按钮状态
        document.querySelectorAll('.bottom-tabbar .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) targetBtn.classList.add('active');

        // 隐藏所有移动端视图
        const mobileHistory = document.getElementById('mobile-history-view');
        const mobileFavorites = document.getElementById('mobile-favorites-view');
        const calculatorArea = document.querySelector('.calculator-area');

        if (tabName === 'calculator') {
            if (mobileHistory) mobileHistory.style.display = 'none';
            if (mobileFavorites) mobileFavorites.style.display = 'none';
            if (calculatorArea) calculatorArea.style.display = 'flex';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // 打开计算视图时确保键盘（若需要）保持可见
            setTimeout(() => showKeyboard(), 40);
        } else if (tabName === 'history') {
            if (mobileHistory) mobileHistory.style.display = 'block';
            if (mobileFavorites) mobileFavorites.style.display = 'none';
            if (calculatorArea) calculatorArea.style.display = 'block';
            renderHistoryList();
            // 切换到历史时收起键盘，避免遮挡
            hideKeyboard();
        } else if (tabName === 'favorites') {
            if (mobileHistory) mobileHistory.style.display = 'none';
            if (mobileFavorites) mobileFavorites.style.display = 'block';
            if (calculatorArea) calculatorArea.style.display = 'block';
            renderFavoritesList();
            hideKeyboard();
        } else {
            // tools or other
            if (mobileHistory) mobileHistory.style.display = 'none';
            if (mobileFavorites) mobileFavorites.style.display = 'none';
            hideKeyboard();
        }

        console.log(`切换到 Tab: ${tabName}`);
    }

    /**
     * 渲染历史记录列表
     */
    function renderHistoryList() {
        const history = storage.getHistory();
        domElements.historyList.innerHTML = '';
        domElements.mobileHistoryList && (domElements.mobileHistoryList.innerHTML = '');

        if (history.length === 0) {
            domElements.historyList.innerHTML = '<li>暂无历史记录</li>';
            if (domElements.mobileHistoryList) domElements.mobileHistoryList.innerHTML = '<li>暂无历史记录</li>';
            return;
        }

        history.slice().reverse().forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.title = new Date(item.timestamp).toLocaleString();
            li.innerHTML = `
                <span class="history-label">${item.input} = ${item.result}</span>
                <div class="list-actions">
                    <button class="action-btn fav" data-id="${item.id}" title="收藏">⭐</button>
                    <button class="action-btn del" data-id="${item.id}" title="删除">🗑</button>
                </div>
            `;
            domElements.historyList.appendChild(li);

            if (domElements.mobileHistoryList) {
                const mli = li.cloneNode(true);
                domElements.mobileHistoryList.appendChild(mli);
            }
        });
    }

    /**
     * 渲染收藏列表
     */
    function renderFavoritesList() {
        const favorites = storage.getFavorites();
        domElements.favoritesList.innerHTML = '';
        domElements.mobileFavoritesList && (domElements.mobileFavoritesList.innerHTML = '');

        if (favorites.length === 0) {
            domElements.favoritesList.innerHTML = '<li>暂无收藏</li>';
            if (domElements.mobileFavoritesList) domElements.mobileFavoritesList.innerHTML = '<li>暂无收藏</li>';
            return;
        }

        favorites.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.title = item.name || '收藏项';
            li.innerHTML = `
                <span class="fav-label">${item.input} = ${item.result}</span>
                <div class="list-actions">
                    <button class="action-btn del" data-id="${item.id}" title="删除">🗑</button>
                </div>
            `;
            domElements.favoritesList.appendChild(li);

            if (domElements.mobileFavoritesList) {
                const mli = li.cloneNode(true);
                domElements.mobileFavoritesList.appendChild(mli);
            }
        });
    }

    // 符号参考支持：加载 / 渲染 / 打开 / 关闭
    let _symbolsCache = null;
    function loadSymbolsJson() {
        if (_symbolsCache) {
            renderSymbols(_symbolsCache);
            return Promise.resolve(_symbolsCache);
        }
        return fetch('data/symbols.json')
            .then(res => {
                if (!res.ok) throw new Error('网络错误: ' + res.status);
                return res.json();
            })
            .then(data => {
                _symbolsCache = data;
                renderSymbols(data);
                return data;
            })
            .catch(err => {
                domElements.symbolsBody && (domElements.symbolsBody.innerHTML = '<p style="color:var(--danger);">无法加载符号数据</p>');
                console.error('loadSymbolsJson error', err);
            });
    }

    function renderSymbols(data) {
        if (!domElements.symbolsBody) return;
        const html = data.map(group => {
            const items = group.symbols.map(s => `
                <div class="symbol-item" title="${s.name} · ${s.desc}">
                    <div class="symbol-char">${s.char}</div>
                    <div>
                        <div style="font-weight:600">${s.name}</div>
                        <div class="symbol-desc">${s.desc}</div>
                    </div>
                </div>
            `).join('');
            return `<section class="symbol-group"><h4 class="section-title">${group.title}</h4><div>${items}</div></section>`;
        }).join('');
        domElements.symbolsBody.innerHTML = html;
    }

    function showSymbolsModal() {
        if (!domElements.symbolsModal) return;
        domElements.symbolsModal.style.display = 'flex';
        domElements.symbolsModal.setAttribute('aria-hidden', 'false');
        loadSymbolsJson();
    }
    function hideSymbolsModal() {
        if (!domElements.symbolsModal) return;
        domElements.symbolsModal.style.display = 'none';
        domElements.symbolsModal.setAttribute('aria-hidden', 'true');
    }

    // ---------- 虚拟键盘显示/隐藏与视口处理 ----------
    function recalcKeyboardPadding() {
        try {
            const kbInner = domElements.virtualKeyboard.querySelector('.keyboard-inner');
            if (!kbInner) {
                document.body.style.paddingBottom = '';
                return;
            }
            const kbStyle = getComputedStyle(domElements.virtualKeyboard);
            if (kbStyle.display === 'none' || domElements.virtualKeyboard.classList.contains('hidden')) {
                document.body.style.paddingBottom = '';
                return;
            }
            const h = Math.ceil(kbInner.getBoundingClientRect().height || domElements.virtualKeyboard.getBoundingClientRect().height || 0);
            // 如果可视视口存在且键盘遮挡高度更大，则使用更大的值
            const vbHeight = window.visualViewport ? (window.innerHeight - Math.round(window.visualViewport.height)) : 0;
            const finalPad = Math.max(h, vbHeight);
            document.body.style.paddingBottom = finalPad ? finalPad + 'px' : '';
        } catch (e) {
            // ignore
        }
    }

    function hideKeyboard() {
        domElements.virtualKeyboard.classList.add('hidden');
        // 清除底部内边距
        document.body.style.paddingBottom = '';
    }

    function showKeyboard() {
        domElements.virtualKeyboard.classList.remove('hidden');
        // 等待渲染后重新计算 padding
        setTimeout(recalcKeyboardPadding, 60);
    }

    // 监听视口变化以避免键盘遮挡（优先使用 visualViewport）
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            recalcKeyboardPadding();
        }, { passive: true });
        window.visualViewport.addEventListener('scroll', () => {
            recalcKeyboardPadding();
        }, { passive: true });
    }
    window.addEventListener('resize', recalcKeyboardPadding);

    // 当输入框获得焦点时展示虚拟键盘（移动端友好）
    domElements.expressionInput.addEventListener('focus', () => {
        showKeyboard();
        setTimeout(() => {
            recalcKeyboardPadding();
            try { domElements.expressionInput.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch(e) {}
        }, 120);
    });

    // 在失去焦点时不强制收起（允许用户继续操作），但提供可配置行为（以后扩展）

    // 暴露到全局作用域
    global.ui = {
        initUI,
        renderHistoryList,
        renderFavoritesList,
        showSymbolsModal,
        hideSymbolsModal,
        showKeyboard,
        hideKeyboard,
        recalcKeyboardPadding
    };

})(window);