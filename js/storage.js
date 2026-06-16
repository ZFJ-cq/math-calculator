// storage.js
// 本地持久化封装（使用 localStorage）

(function(global) {
    const KEY_SETTINGS = 'calc_settings_v1';
    const KEY_HISTORY = 'calc_history_v1';
    const KEY_FAVORITES = 'calc_favorites_v1';

    function safeParse(str) {
        if (!str) return null;
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    function getSettings() {
        const defaults = { subject: 'primary', mode: 'scientific', theme: 'light', angleMode: 'rad' };
        const stored = safeParse(localStorage.getItem(KEY_SETTINGS));
        return Object.assign({}, defaults, stored || {});
    }

    function saveSettings(settings) {
        try { localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings)); } catch (e) { console.warn('保存设置失败', e); }
    }

    function getHistory() {
        return safeParse(localStorage.getItem(KEY_HISTORY)) || [];
    }

    function saveHistory(item) {
        const arr = getHistory();
        arr.push(item);
        try { localStorage.setItem(KEY_HISTORY, JSON.stringify(arr)); } catch (e) { console.warn('保存历史失败', e); }
    }

    function getFavorites() {
        return safeParse(localStorage.getItem(KEY_FAVORITES)) || [];
    }

    function saveFavorites(item) {
        const arr = getFavorites();
        arr.push(item);
        try { localStorage.setItem(KEY_FAVORITES, JSON.stringify(arr)); } catch (e) { console.warn('保存收藏失败', e); }
    }

    function clearHistory() {
        try { localStorage.removeItem(KEY_HISTORY); } catch (e) { console.warn('清空历史失败', e); }
    }

    function removeHistoryById(id) {
        const arr = getHistory().filter(item => item.id !== id);
        try { localStorage.setItem(KEY_HISTORY, JSON.stringify(arr)); } catch (e) { console.warn('移除历史项失败', e); }
    }

    function clearFavorites() {
        try { localStorage.removeItem(KEY_FAVORITES); } catch (e) { console.warn('清空收藏失败', e); }
    }

    function removeFavoriteById(id) {
        const arr = getFavorites().filter(item => item.id !== id);
        try { localStorage.setItem(KEY_FAVORITES, JSON.stringify(arr)); } catch (e) { console.warn('移除收藏失败', e); }
    }

    global.storage = {
        getSettings,
        saveSettings,
        getHistory,
        saveHistory,
        removeHistoryById,
        clearHistory,
        getFavorites,
        saveFavorites,
        removeFavoriteById,
        clearFavorites
    };

})(window);