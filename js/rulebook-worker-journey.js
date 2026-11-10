const observers = new WeakMap();

export function connect(element) {
    disconnect(element);
    const update = () => {
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height) return;
        const locate = selector => {
            const rect = element.querySelector(selector).getBoundingClientRect();
            return {
                x: (rect.left + rect.width / 2 - bounds.left) * 180 / bounds.width,
                y: (rect.top + rect.height / 2 - bounds.top) * 85 / bounds.height,
                radius: rect.width * 90 / bounds.width,
                height: rect.height * 85 / bounds.height
            };
        };
        const equipment = locate('[data-journey-equipment] .bg-card-occupancy .dice');
        for (const [wrapperSelector, dieSelector] of [
            ['[data-journey-pool]', '[data-journey-pool] .dice'],
            ['[data-journey-commission]', '[data-journey-commission] .occupied-slot .dice']
        ]) {
            const wrapper = element.querySelector(wrapperSelector);
            const wrapperTop = (wrapper.getBoundingClientRect().top - bounds.top) * 85 / bounds.height;
            wrapper.style.top = `${(wrapperTop + equipment.y - locate(dieSelector).y) / 85 * 100}%`;
        }
        const points = [
            locate('[data-journey-pool] .dice'),
            equipment,
            locate('[data-journey-commission] .occupied-slot .dice')
        ];
        for (let index = 0; index < 2; index++) {
            const start = points[index];
            const end = points[index + 1];
            const startX = start.x + start.radius + 1.5;
            const endX = end.x - end.radius - 1.5;
            const centerY = equipment.y;
            const peakY = centerY - equipment.height;
            const controlY = centerY - equipment.height / .75;
            const controlOffsetX = (centerY - controlY) / Math.tan(Math.PI / 6);
            element.querySelector(`[data-journey-arrow="${index}"]`).setAttribute('d',
                `M${startX} ${centerY} C${startX + controlOffsetX} ${controlY} ${endX - controlOffsetX} ${controlY} ${endX} ${centerY}`);
            const directionX = Math.cos(Math.PI / 6);
            const directionY = Math.sin(Math.PI / 6);
            const headBaseX = endX - directionX * 2;
            const headBaseY = centerY - directionY * 2;
            element.querySelector(`[data-journey-arrowhead="${index}"]`).setAttribute('d',
                `M${headBaseX - directionY * .85} ${headBaseY + directionX * .85} L${endX} ${centerY} L${headBaseX + directionY * .85} ${headBaseY - directionX * .85}`);
            const moving = element.querySelector(`[data-journey-moving="${index}"]`);
            moving.style.left = `${(startX + endX) / 2 / 180 * 100}%`;
            moving.style.top = `${(peakY - equipment.height * .75) / 85 * 100}%`;
        }
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observers.set(element, observer);
    update();
}

export function disconnect(element) {
    observers.get(element)?.disconnect();
    observers.delete(element);
}