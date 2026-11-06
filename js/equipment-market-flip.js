const runningAnimations = new WeakMap();

export function capture(board) {
    board = resolveBoard(board);
    return Array.from(board.querySelectorAll(".equipment-market-lab__asset[data-asset-id]:not([data-asset-exit='true'])"))
        .map(element => {
            const rect = element.getBoundingClientRect();
            return {
                id: element.dataset.assetId,
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height
            };
        });
}

export async function animate(board, firstRects, options) {
    board = resolveBoard(board);
    cancel(board);

    const firstById = new Map(firstRects.map(rect => [rect.id, rect]));
    const boardRect = board.getBoundingClientRect();
    const reduceMotion = document.visibilityState === "hidden"
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 0 : options.durationMs;
    const stagger = reduceMotion ? 0 : options.staggerMs;
    const tasks = [];
    const exitingIds = [];

    for (const element of Array.from(board.querySelectorAll(".equipment-market-lab__asset[data-asset-id]"))) {
        const id = element.dataset.assetId;
        const first = firstById.get(id);
        const last = element.getBoundingClientRect();
        const isExiting = element.dataset.assetExit === "true";

        if (isExiting) {
            exitingIds.push(id);
            if (first) {
                element.style.left = `${first.left - boardRect.left}px`;
                element.style.top = `${first.top - boardRect.top}px`;
                element.style.width = `${first.width}px`;
                element.style.height = `${first.height}px`;
                element.style.visibility = "visible";
            }
            tasks.push({ element, kind: "exit", id, rect: first ?? last });
            continue;
        }

        if (!first) {
            tasks.push({ element, kind: "enter", id, rect: last });
            continue;
        }

        const deltaX = first.left - last.left;
        const deltaY = first.top - last.top;
        if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
            tasks.push({ element, kind: "move", id, rect: first, deltaX, deltaY });
        }
    }

    const groupOrder = new Map((options.order ?? []).map((group, index) => [group, index]));
    const rank = task => groupOrder.get(task.element.dataset.animationGroup) ?? groupOrder.size;
    const horizontalOrder = (left, right) => options.withinGroup === "right-to-left"
        ? right.rect.left - left.rect.left
        : left.rect.left - right.rect.left;
    tasks.sort((left, right) => rank(left) - rank(right) || horizontalOrder(left, right));

    const animations = new Set();
    runningAnimations.set(board, animations);
    const completions = tasks.map((task, index) => {
        const delay = reduceMotion ? 0 : index * stagger;
        let keyframes;
        if (task.kind === "move") {
            keyframes = [
                { transform: `translate(${task.deltaX}px, ${task.deltaY}px)` },
                { transform: "none" }
            ];
        } else if (task.kind === "enter") {
            keyframes = [
                { opacity: 0, transform: "translateY(10px) scale(.98)" },
                { opacity: 1, transform: "translateY(0) scale(1)" }
            ];
        } else {
            keyframes = [
                { opacity: 1, transform: "scale(1)" },
                { opacity: 0, transform: "scale(.96)" }
            ];
        }

        const animation = task.element.animate(keyframes, {
            duration,
            delay,
            easing: task.kind === "exit" ? "ease-in" : "cubic-bezier(.2,.75,.25,1)",
            fill: "both"
        });
        animations.add(animation);
        return animation.finished.catch(() => undefined);
    });

    await Promise.all(completions);

    if (runningAnimations.get(board) !== animations)
        return [];

    for (const animation of animations)
        animation.cancel();
    for (const task of tasks)
        if (task.kind !== "exit")
            clearAnimationStyles(task.element);

    runningAnimations.delete(board);
    return exitingIds;
}

export function cancel(board) {
    board = resolveBoard(board);
    const animations = runningAnimations.get(board);
    if (animations) {
        for (const animation of animations)
            animation.cancel();
        runningAnimations.delete(board);
    }

    for (const element of Array.from(board.querySelectorAll(".equipment-market-lab__asset[data-asset-id]"))) {
        clearAnimationStyles(element);
        element.style.removeProperty("position");
        element.style.removeProperty("left");
        element.style.removeProperty("top");
        element.style.removeProperty("width");
        element.style.removeProperty("height");
        element.style.removeProperty("visibility");
    }
}

function clearAnimationStyles(element) {
    element.style.removeProperty("transform");
    element.style.removeProperty("opacity");
}

function resolveBoard(board) {
    return board instanceof Element ? board : document.querySelector(".equipment-market-lab__slots");
}
