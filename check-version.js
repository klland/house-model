(() => {
    const revision = document.querySelector('meta[name="model-revision"]')?.content;
    if (!revision) return;

    function readLocalRevision() {
        // A local HTML page can load a classic script even when fetch(file:) is blocked.
        return new Promise(resolve => {
            const manifest = document.createElement('script');
            manifest.src = `./revision.js?check=${Date.now()}`;
            function finish(latest) {
                manifest.remove();
                delete window.houseModelRevision;
                resolve(latest);
            }
            manifest.onload = () => finish(window.houseModelRevision);
            manifest.onerror = () => finish(undefined);
            document.head.append(manifest);
        });
    }

    async function readWebRevision() {
        const manifest = new URL('./revision.json', location.href);
        manifest.searchParams.set('check', Date.now());
        const response = await fetch(manifest, { cache: 'no-store' });
        return response.ok ? (await response.json()).revision : undefined;
    }

    let checking = false;
    async function checkVersion() {
        if (checking || document.hidden) return;
        checking = true;
        try {
            const latest = await (location.protocol === 'file:' ? readLocalRevision() : readWebRevision());
            if (typeof latest !== 'string' || !/^[a-f0-9]{16}$/.test(latest) || latest === revision) return;
            if (pointer) return;

            const next = new URL(location.href);
            if (next.searchParams.get('model') === latest) return;
            next.searchParams.set('model', latest);
            location.replace(next);
        } catch {
            // A temporary connection problem leaves the current model usable.
        } finally {
            checking = false;
        }
    }
    setInterval(checkVersion, 15000);
    document.addEventListener('visibilitychange', checkVersion);
    void checkVersion();
})();
