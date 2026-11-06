const handlers = new WeakMap();

export function attach(game) {
    detach(game);
    let frame = 0;
    const fitBoard = () => {
        frame = 0;
        const board = game.querySelector('.equipment-market-lab__board');
        const slots = game.querySelector('.equipment-market-lab__slots');
        const controls = game.querySelector('.equipment-market-lab__controls');
        if (!board || !slots || !slots.offsetWidth || !slots.offsetHeight) return;
        const widthScale = board.clientWidth / slots.offsetWidth;
        const naturalHeight = slots.offsetHeight + (controls?.offsetHeight ?? 0);
        const heightScale = game.clientHeight / naturalHeight;
        const scale = Math.min(widthScale, heightScale);
        if (scale <= 0) return;
        game.style.setProperty('--board-natural-width', `${slots.offsetWidth}px`);
        game.style.setProperty('--board-scale', String(scale));
        game.style.setProperty('--board-width', `${slots.offsetWidth * scale}px`);
    };
    const scheduleFit = () => {
        if (!frame) frame = requestAnimationFrame(fitBoard);
    };
    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(game);
    const observeLayout = () => {
        for (const element of game.querySelectorAll('.equipment-market-lab__board, .equipment-market-lab__slots')) {
            resizeObserver.observe(element);
        }
        scheduleFit();
    };
    const mutationObserver = new MutationObserver(observeLayout);
    mutationObserver.observe(game, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', scheduleFit);
    window.visualViewport?.addEventListener('resize', scheduleFit);
    observeLayout();
    const handleKey = event => {
        if (game.querySelector('.downloads-popup')) return;
        if (event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;
        if (!game.contains(event.target) && event.target !== document.body) return;

        const tutorial = game.querySelector('.tutorial-popup-overlay');
        if (tutorial && event.key === "Enter" && tutorial.dataset.actionReady === "true"
            && !event.target.closest('.tutorial-popup button')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (!event.repeat)
            game.querySelector('.equipment-market-lab__play:not(:disabled), .equipment-market-choice__apply:not(:disabled)')?.click();
            return;
        }
        if (tutorial && event.target.closest('.asset-selection__asset.is-selectable')) return;
        if (tutorial && event.key === "Enter" && event.target.closest('.tutorial-popup button')) return;

        const dialog = game.querySelector('.equipment-market-lab__confirmation') ?? game.querySelector('[role="dialog"]');
        if (dialog) {
            const buttons = Array.from(dialog.querySelectorAll('button:not(:disabled)'));
            if (event.key === "Tab" && buttons.length > 0) {
                const index = buttons.indexOf(document.activeElement);
                const next = event.shiftKey
                    ? (index <= 0 ? buttons.length - 1 : index - 1)
                    : (index + 1) % buttons.length;
                event.preventDefault();
                event.stopImmediatePropagation();
                buttons[next].focus({ preventScroll: true });
            } else if (event.key === "Enter" || event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (event.repeat) return;
                const cancel = dialog.querySelector('.equipment-market-lab__confirmation-cancel');
                const focused = buttons.find(button => button === document.activeElement);
                const action = event.key === "Escape" ? cancel : focused ?? cancel ?? buttons[0];
                action?.click();
            }
            return;
        }

        if (event.key !== "Enter" || event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.repeat) return;
        game.querySelector('.equipment-market-lab__play:not(:disabled), .equipment-market-choice__apply:not(:disabled)')?.click();
    };
    document.addEventListener("keydown", handleKey, true);
    handlers.set(game, () => {
        document.removeEventListener('keydown', handleKey, true);
        window.removeEventListener('resize', scheduleFit);
        window.visualViewport?.removeEventListener('resize', scheduleFit);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        cancelAnimationFrame(frame);
    });
}

export function detach(game) {
    handlers.get(game)?.();
    handlers.delete(game);
}