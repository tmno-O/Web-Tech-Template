(function () {
    var PRODUCTS_URL = 'data/json/products.json';
    var MAX_SUGGESTIONS = 6;
    var cachedProducts = null;

    function loadProducts(cb) {
        if (cachedProducts) { cb(cachedProducts); return; }
        fetch(PRODUCTS_URL)
            .then(function (r) { return r.json(); })
            .then(function (data) { cachedProducts = data.products; cb(cachedProducts); })
            .catch(function () {});
    }

    function formatPrice(n) {
        return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function escHtml(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function injectStyles() {
        if (document.getElementById('autocomplete-styles')) return;
        var style = document.createElement('style');
        style.id = 'autocomplete-styles';
        style.textContent = [
            '.ac-dropdown{display:none;position:absolute;top:100%;left:0;right:0;',
            'background:#fff;border:1px solid #e0e0e0;border-top:none;z-index:9999;',
            'box-shadow:0 6px 16px rgba(0,0,0,.12);border-radius:0 0 4px 4px;',
            'max-height:380px;overflow-y:auto;}',

            '.ac-dropdown-inline{display:none;background:#fff;',
            'border-top:1px solid #e0e0e0;z-index:9999;max-height:300px;overflow-y:auto;}',

            '.ac-item{display:flex;align-items:center;padding:8px 14px;',
            'cursor:pointer;border-bottom:1px solid #f0f0f0;gap:12px;',
            'transition:background .15s;}',
            '.ac-item:last-child{border-bottom:none;}',
            '.ac-item:hover,.ac-item--active{background:#f5f5f5;}',
            '.ac-item__img{width:44px;height:44px;object-fit:contain;flex-shrink:0;}',
            '.ac-item__name{flex:1;font-size:13px;color:#333;line-height:1.3;}',
            '.ac-item__price{font-size:13px;font-weight:600;color:#e52727;',
            'white-space:nowrap;margin-left:8px;}',
        ].join('');
        document.head.appendChild(style);
    }

    function navigate(product) {
        window.location.href = product.url + '?id=' + product.id;
    }

    function initAutocomplete(input, dropEl) {
        var lastRawQuery = '';
        var results      = [];
        var curIdx       = -1;

        function getItems() { return dropEl.querySelectorAll('.ac-item'); }

        function hide() {
            dropEl.style.display = 'none';
            dropEl.innerHTML = '';
            curIdx = -1;
        }

        function clearHL() {
            [].forEach.call(getItems(), function (el) { el.classList.remove('ac-item--active'); });
        }

        function setHL(i) {
            clearHL();
            var els = getItems();
            if (i >= 0 && i < els.length) {
                els[i].classList.add('ac-item--active');
                if (results[i]) input.value = results[i].name;
            }
        }

        function render(query) {
            var q = query.trim().toLowerCase();
            lastRawQuery = query;

            if (!q) { hide(); return; }

            results = (cachedProducts || []).filter(function (p) {
                return p.name.toLowerCase().indexOf(q) !== -1 ||
                       (p.category && p.category.toLowerCase().indexOf(q) !== -1);
            }).slice(0, MAX_SUGGESTIONS);

            curIdx = -1;
            if (!results.length) { hide(); return; }

            dropEl.innerHTML = results.map(function (p, i) {
                return '<div class="ac-item" data-i="' + i + '">' +
                    '<img class="ac-item__img" src="' + p.image + '" alt="">' +
                    '<span class="ac-item__name">' + escHtml(p.name) + '</span>' +
                    '<span class="ac-item__price">' + formatPrice(p.price) + '</span>' +
                    '</div>';
            }).join('');
            dropEl.style.display = 'block';

            [].forEach.call(getItems(), function (el) {
                el.addEventListener('mousedown', function (e) {
                    e.preventDefault();
                    var p = results[parseInt(el.dataset.i, 10)];
                    if (p) navigate(p);
                });
            });
        }

        input.addEventListener('input', function () {
            loadProducts(function () { render(input.value); });
        });

        input.addEventListener('keydown', function (e) {
            var els = getItems();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                curIdx = Math.min(curIdx + 1, els.length - 1);
                setHL(curIdx);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                curIdx = Math.max(curIdx - 1, -1);
                if (curIdx === -1) { clearHL(); input.value = lastRawQuery; }
                else setHL(curIdx);
            } else if (e.key === 'Escape') {
                hide();
            } else if (e.key === 'Enter' && curIdx >= 0 && results[curIdx]) {
                e.preventDefault();
                navigate(results[curIdx]);
            }
        });

        input.addEventListener('blur', function () {
            setTimeout(hide, 200);
        });

        input.addEventListener('focus', function () {
            if (input.value.trim()) {
                loadProducts(function () { render(input.value); });
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        injectStyles();

        // ── Desktop header search ──────────────────────────────
        var desktopInput = document.querySelector('.search__input');
        if (desktopInput) {
            var wrapper = desktopInput.closest('.search');
            if (wrapper) {
                var dd = document.createElement('div');
                dd.className = 'ac-dropdown';
                wrapper.style.position = 'relative';
                wrapper.appendChild(dd);
                initAutocomplete(desktopInput, dd);
            }
        }

        // ── Mobile header search ───────────────────────────────
        var mobileInput = document.querySelector('.mobile-header__search-input');
        if (mobileInput) {
            var mobileForm = mobileInput.closest('form');
            var mobileBody = mobileForm && mobileForm.querySelector('.mobile-header__search-body');
            if (mobileBody) {
                var mdd = document.createElement('div');
                mdd.className = 'ac-dropdown-inline';
                mobileBody.appendChild(mdd);
                initAutocomplete(mobileInput, mdd);
            }
        }

        // ── Drop-search (index-2.html style overlay search) ────
        var dropInput = document.querySelector('.drop-search__input');
        if (dropInput) {
            var dropSearch = dropInput.closest('.drop-search');
            if (dropSearch) {
                var ddd = document.createElement('div');
                ddd.className = 'ac-dropdown-inline';
                dropSearch.appendChild(ddd);
                initAutocomplete(dropInput, ddd);
            }
        }

        // ── Search results page search bar ─────────────────────
        var pageInput = document.getElementById('search-page-input');
        if (pageInput) {
            var pageWrapper = pageInput.closest('.input-group');
            if (pageWrapper) {
                var rel = document.createElement('div');
                rel.style.cssText = 'position:relative;flex:1;';
                pageWrapper.insertBefore(rel, pageInput);
                rel.appendChild(pageInput);

                var pdd = document.createElement('div');
                pdd.className = 'ac-dropdown';
                rel.appendChild(pdd);
                initAutocomplete(pageInput, pdd);
            }
        }
    });
})();
