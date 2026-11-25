(() => {
    const revision = document.querySelector('meta[name="model-revision"]')?.content;
    if (!revision) return;

    let checking = false;
    async function checkVersion() {
        if (checking || document.hidden) return;
        checking = true;
        try {
            const manifest = new URL('./revision.json', location.href);
            manifest.searchParams.set('check', Date.now());
            const response = await fetch(manifest, { cache: 'no-store' });
            if (!response.ok) return;
            const latest = (await response.json()).revision;
            if (!/^[a-f0-9]{16}$/.test(latest) || latest === revision) return;
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
})();
