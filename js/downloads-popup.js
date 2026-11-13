const handlers = new WeakMap();

export function attach(modal) {
    const opener = document.activeElement;
    const handleKey = event => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            modal.querySelector('[data-modal-close]').click();
        } else if (event.key === 'Tab') {
            const controls = [...modal.querySelectorAll('button, a[href], select, input, video[controls]')];
            const current = controls.indexOf(document.activeElement);
            const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
            event.preventDefault();
            controls[next].focus();
        }
    };
    modal.addEventListener('keydown', handleKey);
    modal.querySelector('[data-modal-focus], select, [data-modal-close]')?.focus({ preventScroll: true });
    handlers.set(modal, () => {
        modal.removeEventListener('keydown', handleKey);
        if (opener?.isConnected) opener.focus({ preventScroll: true });
    });
}

export function detach(modal) {
    modal.querySelectorAll('video').forEach(video => video.pause());
    handlers.get(modal)?.();
    handlers.delete(modal);
}