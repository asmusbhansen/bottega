(() => {
    const enabled = location.hostname === 'asmusbhansen.github.io'
        && location.pathname.startsWith('/bottega/');
    let lastEndpointPath;

    window.bottegaAnalytics = {
        trackEndpoint(path) {
            const pathname = new URL(path || './', document.baseURI).pathname.replace(/\/$/, '');
            if (pathname === lastEndpointPath) return;
            const endpoint = {
                '/bottega': 'game',
                '/bottega/game': 'game',
                '/bottega/rules': 'rules',
                '/bottega/pnp': 'pnp',
                '/bottega/video': 'video',
                '/bottega/sellsheet': 'sellsheet'
            }[pathname];
            if (!endpoint) return;
            lastEndpointPath = pathname;
            this.track('Endpoint Viewed', { endpoint });
        },
        track(name, props = {}) {
            if (!enabled) return;
            try {
                window.plausible(name, { props });
            } catch {
            }
        }
    };

    if (!enabled) return;

    window.plausible = window.plausible || function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    window.plausible.init = window.plausible.init || function (options) {
        window.plausible.o = options || {};
    };
    window.plausible.init();

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://plausible.io/js/pa-krvgLcArft5GkFxamqD89.js';
    document.head.appendChild(script);

    document.addEventListener('click', event => {
        const link = event.target.closest?.('a[download]');
        if (!link) return;
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname.endsWith('/rulebook.pdf')) {
            window.bottegaAnalytics.track('Rulebook Downloaded');
        } else if (link.dataset.downloadKind === 'print-and-play') {
            window.bottegaAnalytics.track('Print and Play Downloaded', {
                paper_size: link.dataset.paperSize,
                shrink: link.dataset.shrink
            });
        }
    });
})();