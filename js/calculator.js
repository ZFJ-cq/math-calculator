// calculator.js
// 核心计算逻辑

(function(global) {

    /**
     * 执行计算
     * @param {string} expression - 数学表达式
     * @param {Object} options - 计算选项
     * @returns {Object} 计算结果对象
     */
    // 导入 deg(x) 以便显式使用度数表示
    try {
        math.import({ deg: function(x) { return x * Math.PI / 180; } }, { override: true });
    } catch (e) {
        // ignore if already imported
    }

    function calculate(expression, options = {}) {
        const resultObj = {
            input: expression,
            result: null,
            steps: [],
            error: null,
            timestamp: Date.now()
        };

        if (!expression || typeof expression !== 'string') {
            resultObj.error = "输入为空或无效";
            return resultObj;
        }

        // Helper: evaluate a single expression string with AST adjustments
        function evalSingle(exprStr) {
            // Preprocessing: replace common Unicode symbols with ascii/math functions
            let s = String(exprStr);

            // replace multiplication signs
            s = s.replace(/×/g, '*').replace(/·/g, '*').replace(/÷/g, '/');

            // relation symbols
            s = s.replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≠/g, '!=');

            // remove trailing equals or stray = signs (user typed '=' to indicate calculate)
            s = s.replace(/=+$/g, '');
            s = s.replace(/\s*=\s*/g, '');

            // superscripts (² ³ ⁿ ¹ ⁴ ... ) => ^...
            const supMap = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','ⁿ':'n' };
            s = s.replace(/([0-9A-Za-z\)\]])([⁰¹²³⁴⁵⁶⁷⁸⁹ⁿ]+)/g, function(m, base, supers) {
                let digits = '';
                for (let ch of supers) digits += (supMap[ch] || '');
                return base + '^' + digits;
            });

            // explicit squares/cubes (fallback)
            s = s.replace(/²/g, '^2').replace(/³/g, '^3');

            // sqrt and cube root
            s = s.replace(/√\s*\(/g, 'sqrt(');
            s = s.replace(/√\s*([0-9A-Za-z\.]+)/g, 'sqrt($1)');
            s = s.replace(/∛\s*\(/g, 'nthRoot(');
            s = s.replace(/∛\s*([0-9A-Za-z\.]+)/g, 'nthRoot($1, 3)');

            // degree symbol already handled elsewhere in parsing pipeline, but keep safe
            s = s.replace(/(\d+(?:\.\d+)?)\s*°/g, 'deg($1)');

            // return AST parsed node for further transformations
            let node;
            try {
                node = math.parse(s);
            } catch (e) {
                throw new Error('解析表达式失败: ' + e.message + '（原始：' + s + '）');
            }

            // angle mode: if options.angleMode === 'deg', convert trig parameters
            if (options.angleMode === 'deg') {
                node.traverse(function(n) {
                    if (n && n.type === 'FunctionNode' && n.fn && n.fn.name && ['sin','cos','tan','asin','acos','atan'].includes(n.fn.name)) {
                        if (n.args && n.args[0]) {
                            const arg = n.args[0];
                            const newArg = math.parse('(' + arg.toString() + ') * pi / 180');
                            n.args[0] = newArg;
                        }
                    }
                });
            }

            const value = node.compile().evaluate();
            return { value, parsed: s, node };
        }

        try {
            const originalExpr = expression;

            // Handle '±' operator by evaluating two variants
            if (originalExpr.indexOf('±') !== -1) {
                const plusExpr = originalExpr.replace(/±/g, '+');
                const minusExpr = originalExpr.replace(/±/g, '-');
                const plusRes = evalSingle(plusExpr);
                const minusRes = evalSingle(minusExpr);

                const format = (v) => {
                    if (math.isBigNumber(v)) return v.toString();
                    if (math.isComplex(v)) return `${v.re} + ${v.im}i`;
                    if (math.isFraction(v)) return v.toFraction().toString();
                    return utils.formatNumber(v, options.precision || 10);
                };

                resultObj.steps.push(`输入: ${originalExpr}`);
                resultObj.steps.push(`作为: ${plusExpr} = ${format(plusRes.value)}`);
                resultObj.steps.push(`作为: ${minusExpr} = ${format(minusRes.value)}`);
                resultObj.result = `${format(plusRes.value)} , ${format(minusRes.value)}`;
                return resultObj;
            }

            // Normal single evaluation
            const r = evalSingle(originalExpr);
            const evalResult = r.value;

            if (math.isBigNumber(evalResult)) {
                resultObj.result = evalResult.toString();
            } else if (math.isComplex(evalResult)) {
                resultObj.result = `${evalResult.re} + ${evalResult.im}i`;
            } else if (math.isFraction(evalResult)) {
                resultObj.result = evalResult.toFraction().toString();
            } else if (typeof evalResult === 'boolean') {
                resultObj.result = evalResult ? 'true' : 'false';
            } else {
                resultObj.result = utils.formatNumber(evalResult, options.precision || 10);
            }

            // Steps: show original input and parsed expression (if different)
            resultObj.steps.push(`输入: ${originalExpr}`);
            if (r.parsed && r.parsed !== originalExpr) {
                resultObj.steps.push(`解析为: ${r.parsed}`);
            }
            if (options.angleMode === 'deg') {
                resultObj.steps.push('角度模式: 度（已将三角函数参数从度转换为弧度）');
            }
            resultObj.steps.push(`计算: ${originalExpr} = ${resultObj.result}`);

        } catch (error) {
            resultObj.error = `计算错误: ${error.message}`;
        }

        return resultObj;
    }

    /**
     * 解析并显示分步过程 (简化版)
     * @param {string} expression - 表达式
     * @returns {Array} 步骤数组
     */
    function getCalculationSteps(expression) {
        // 这里可以实现更复杂的分步解析逻辑
        // 目前返回一个简单的模拟步骤
        return [
            `原始表达式: ${expression}`,
            `进行计算...`,
            `得到结果: ...` // 这个应该由实际计算逻辑填充
        ];
    }

    /**
     * 格式化输出结果 (支持多种格式)
     * @param {number|string} value - 结果值
     * @param {string} format - 输出格式 ('decimal', 'fraction', 'scientific')
     * @returns {string} 格式化后的字符串
     */
    function formatOutput(value, format = 'decimal') {
        if (format === 'fraction') {
            // 这里可以使用 math.js 的 fraction 功能
            // 例如: math.fraction(value).toFraction()
            // 为简化，这里只是返回字符串
            return String(value);
        } else if (format === 'scientific') {
            // 使用科学计数法
            return Number(value).toExponential(5);
        } else {
            // 默认返回十进制
            return String(value);
        }
    }

    // 暴露到全局作用域
    global.calculator = {
        calculate,
        getCalculationSteps,
        formatOutput
    };

})(window);