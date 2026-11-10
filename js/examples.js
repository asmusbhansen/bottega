export function connect(scope) {
    const update = () => {
        const sections = new Map();
        for (const heading of scope.querySelectorAll('[data-section-name]')) {
            const name = heading.dataset.sectionName;
            if (sections.has(name)) throw new Error(`Duplicate section name: ${name}`);
            const number = sections.size + 1;
            const title = heading.dataset.sectionTitle;
            const label = `${number}. ${title}`;
            if (heading.textContent !== label) heading.textContent = label;
            sections.set(name, { number, title });
        }
        for (const reference of scope.querySelectorAll('[data-section-reference]')) {
            const section = sections.get(reference.dataset.sectionReference);
            const label = section ? `Section ${section.number}: ${section.title}` : 'Section ?';
            if (reference.textContent !== label) reference.textContent = label;
        }
        const counts = new Map();
        const examples = new Map();
        for (const figure of scope.querySelectorAll('[data-example-name]')) {
            const heading = figure.closest('section')?.querySelector('[data-section-name]');
            const section = sections.get(heading?.dataset.sectionName)?.number ?? Number(figure.dataset.exampleSection);
            const number = (counts.get(section) ?? 0) + 1;
            counts.set(section, number);
            const label = `Example ${section}.${number}`;
            const name = figure.dataset.exampleName;
            const id = `${scope.id}-${encodeURIComponent(name)}`;
            figure.id = id;
            const target = figure.querySelector('[data-example-label]');
            if (target.textContent !== label) target.textContent = label;
            if (examples.has(name)) throw new Error(`Duplicate example name: ${name}`);
            examples.set(name, { id, label });
        }
        for (const reference of scope.querySelectorAll('[data-example-reference]')) {
            const example = examples.get(reference.dataset.exampleReference);
            const label = example?.label ?? 'Example ?';
            if (reference.textContent !== label) reference.textContent = label;
        }
    };
    const observer = new MutationObserver(update);
    observer.observe(scope, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-example-name', 'data-example-section', 'data-example-reference',
            'data-section-name', 'data-section-title', 'data-section-reference']
    });
    update();
    return { dispose: () => observer.disconnect() };
}