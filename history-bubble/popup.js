document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('history-list');
    const footer = document.getElementById('footer');
    const clearBtn = document.getElementById('clear-btn');
    const footerText = document.getElementById('footer-text');

    // 初始化国际化
    if (document.getElementById('title')) {
        document.getElementById('title').textContent = chrome.i18n.getMessage('appName');
    }
    if (footerText) {
        footerText.textContent = chrome.i18n.getMessage('fullHistory');
    }

    function getFaviconUrl(pageUrl) {
        const url = new URL(chrome.runtime.getURL('/_favicon/'));
        url.searchParams.set('pageUrl', pageUrl);
        url.searchParams.set('size', '32');
        return url.toString();
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function updateDivider() {
        if (!listElement || !footer) return;
        // 检查是否滚动到底部
        const isAtBottom = listElement.scrollHeight - listElement.scrollTop <= listElement.clientHeight + 1;
        footer.classList.toggle('border-top', !isAtBottom);
    }

    function loadHistory() {
        if (!listElement) return;

        chrome.history.search({ text: '', maxResults: 500 }, (items) => {
            listElement.innerHTML = '';

            if (!items || items.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = chrome.i18n.getMessage('noHistory');
                listElement.appendChild(empty);
                updateDivider();
                return;
            }

            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'history-item';
                
                const displayTitle = item.title || item.url || 'Untitled';
                
                row.innerHTML = `
                    <img class="favicon" src="${getFaviconUrl(item.url)}" onerror="this.src='icons/default_favicon.png'">
                    <div class="content-wrapper">
                        <span class="title" title="${displayTitle}">${displayTitle}</span>
                        <span class="time">${formatTime(item.lastVisitTime)}</span>
                    </div>
                    <button class="icon-btn-highlight delete-btn" data-url="${item.url}">
                        <img src="icons/delete.png" alt="delete">
                    </button>
                `;

                // 点击跳转
                row.addEventListener('click', (e) => {
                    if (!e.target.closest('.delete-btn')) {
                        chrome.tabs.create({ url: item.url });
                    }
                });

                // 删除逻辑
                const deleteBtn = row.querySelector('.delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const url = deleteBtn.getAttribute('data-url');
                        chrome.history.deleteUrl({ url: url }, () => {
                            row.style.opacity = '0';
                            setTimeout(() => {
                                row.remove();
                                updateDivider();
                            }, 50);
                        });
                    });
                }

                listElement.appendChild(row);
            });

            setTimeout(updateDivider, 50);
        });
    }

    // 事件绑定
    if (listElement) listElement.addEventListener('scroll', updateDivider);
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://settings/clearBrowserData' });
        });
    }

    if (footer) {
        footer.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome://history' });
        });
    }

    loadHistory();
});