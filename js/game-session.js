const key = 'bottega.session.v1';

export function read() {
    try {
        return { available: true, value: sessionStorage.getItem(key) };
    } catch {
        return { available: false, value: null };
    }
}

export function write(value) {
    try {
        sessionStorage.setItem(key, value);
        return true;
    } catch {
        clear();
        return false;
    }
}

export function clear() {
    try {
        sessionStorage.removeItem(key);
    } catch {
    }
}