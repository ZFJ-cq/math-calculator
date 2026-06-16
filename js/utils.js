// utils.js
// 通用工具函数

(function(global) {
    /**
     * 格式化数字输出
     * @param {number|string|object} value
     * @param {number} precision
     * @returns {string}
     */
    function formatNumber(value, precision = 10) {
        if (value === null || value === undefined) return '';

        try {
            if (value && typeof value.toString === 'function') {
                const s = value.toString();
                if (typeof s === 'string' && s.length > 0 && !s.startsWith('[object')) {
                    return s;
                }
            }
        } catch (e) {}

        if (typeof value === 'number') {
            if (!Number.isFinite(value)) return String(value);
            return Number.parseFloat(value.toPrecision(precision)).toString();
        }

        if (typeof value === 'string' && !isNaN(Number(value))) {
            return Number.parseFloat(Number(value).toPrecision(precision)).toString();
        }

        return String(value);
    }

    global.utils = {
        formatNumber
    };

})(window);