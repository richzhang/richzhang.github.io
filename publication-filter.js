(function () {
    const filter = document.getElementById('publication-filter');
    const buttons = filter.querySelector('.publication-topics');
    const table = document.getElementById('publications');
    const normalize = text => text.replace(/\s+/g, ' ').trim();

    try {
        const data = window.publicationTopics;
        if (!data) {
            throw new Error('Topic data is unavailable');
        }
        const tagsByTitle = new Map(data.papers.map(paper => [normalize(paper.title), paper.tags]));
        const yearGroups = Array.from(table.tBodies);
        for (const group of yearGroups) {
            group.querySelector('.publication-year').style.viewTransitionName = `publication-year-${group.dataset.year}`;
        }
        const papers = Array.from(table.rows).filter(row => !row.classList.contains('publication-year')).map((row, index) => {
            row.style.viewTransitionName = `publication-${index}`;
            return {
                row,
                year: row.parentElement.dataset.year,
                tags: tagsByTitle.get(normalize(row.querySelector('b').textContent)) || []
            };
        });
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let selectedTopic = null;
        let selection = 0;
        let transition = null;
        const totals = new Map([['all', papers.length]]);
        for (const paper of papers) {
            for (const tag of paper.tags) {
                totals.set(tag, (totals.get(tag) || 0) + 1);
            }
        }

        function selectTopic(topic, animate = true) {
            if (topic === selectedTopic) {
                return;
            }
            selectedTopic = topic;
            const request = ++selection;
            if (transition) {
                transition.skipTransition();
                transition = null;
            }
            const matching = new Set(papers.filter(paper => topic === 'all' || paper.tags.includes(topic)));
            const update = () => {
                if (request !== selection) {
                    return;
                }
                for (const paper of papers) {
                    paper.row.hidden = !matching.has(paper);
                }
                const visibleYears = new Set(Array.from(matching, paper => paper.year));
                for (const group of yearGroups) {
                    group.hidden = !visibleYears.has(group.dataset.year);
                }
            };
            for (const button of buttons.querySelectorAll('button')) {
                button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
            }

            if (animate && !reducedMotion.matches && typeof document.startViewTransition === 'function') {
                const current = document.startViewTransition(update);
                transition = current;
                current.ready.catch(() => {});
                const clear = () => {
                    if (transition === current) {
                        transition = null;
                    }
                };
                current.finished.then(clear, clear);
            } else {
                update();
            }
        }

        const topicsById = new Map(data.topics.map(topic => [topic.id, topic]));
        const modalities = ['image', 'video-generation', 'geometry-3d', 'audio', 'language'];
        const modelTypes = ['generative-models', 'understanding-models'];
        const collections = ['highlights', 'new'];
        const primaryIds = new Set([...collections, ...modalities, ...modelTypes]);
        const groups = [
            [{ id: 'all', label: 'All' }, ...collections.map(id => topicsById.get(id)).filter(Boolean)],
            modalities.map(id => topicsById.get(id)).filter(Boolean),
            modelTypes.map(id => topicsById.get(id)).filter(Boolean),
            data.topics.filter(topic => !primaryIds.has(topic.id))
        ];
        const labels = { 'geometry-3d': '3D/Geometry', 'video-generation': 'Video', language: 'Text' };
        const icons = {
            all: ['M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z'],
            highlights: ['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z'],
            new: ['m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z'],
            image: ['M3 3h18v18H3Z', 'm3 17 5-6 4 4 3-3 6 6', 'M16 7h.01'],
            'video-generation': ['M3 3h18v18H3Z', 'm10 8 6 4-6 4Z'],
            'geometry-3d': ['m12 2 9 5v10l-9 5-9-5V7Z', 'm3 7 9 5 9-5', 'M12 12v10'],
            audio: ['M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4'],
            language: ['M12 5C9 3 6 2 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-4-1-7 0-10 2Z', 'M12 5v16'],
            'generative-models': ['m3 17 12-12 4 4L7 21Z', 'm12 8 4 4', 'M5 2v6M2 5h6m12-4v6m-3-3h6'],
            'understanding-models': ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
            'perceptual-metrics': ['M12 5C12 1 6 1 6 5C2 5 1 10 4 12C1 15 3 19 6 19C6 23 12 23 12 19Zm0 0C12 1 18 1 18 5C22 5 23 10 20 12C23 15 21 19 18 19C18 23 12 23 12 19Z', 'M6 5c0 2 1 3 3 3m-5 4c2-1 4 0 4 2m-2 5c0-2 1-3 3-3', 'M18 5c0 2-1 3-3 3m5 4c-2-1-4 0-4 2m2 5c0-2-1-3-3-3'],
            'autoregressive-models': ['M2 9h6v6H2Zm14 0h6v6h-6Z', 'M8 12h8m-3-3 3 3-3 3'],
            'personalization-customization-few-shot-generation': ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a8 6 0 0 1 16 0v2'],
            'data-attribution': ['M5 10V8a7 7 0 0 1 14 0v5c0 3-1 6-3 9', 'M5 14c0 3 0 5-1 7', 'M8 12V8a4 4 0 0 1 8 0v5c0 3-1 6-2 8', 'M8 16c0 2-1 4-2 5', 'M10 22c2-3 2-7 2-13'],
            'diffusion-flow-matching': ['M2 6c5-7 5 7 10 0s5 7 10 0M2 12c5-7 5 7 10 0s5 7 10 0M2 18c5-7 5 7 10 0s5 7 10 0'],
            'distillation-efficiency': ['m13 2-9 12h7l-1 8 10-12h-8Z'],
            'image-forensics': ['M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'm15 15 6 6'],
            gans: ['M2 3h7v7H2Zm13 11h7v7h-7Z', 'M12 5h7v6m-3-3 3 3 3-3M12 19H5v-6m-3 3 3-3 3 3'],
            'image-editing': ['M12 3H3v18h18v-9', 'm10 11 9-9 3 3-9 9-5 2Z', 'm17 4 3 3'],
            interaction: ['m5 2 14 12-7 1-3 7Z'],
            'neural-fields': ['m2 16 5-9 5 5 5-9 5 13-10 6Z', 'm2 16 10-4 10 4M7 7l5 15 5-19'],
            'representation-learning': ['m12 2 10 5-10 5L2 7Z', 'm2 12 10 5 10-5M2 17l10 5 10-5'],
            'responsible-genai': ['m12 2 9 4v6c0 5-4 8-9 10-5-2-9-5-9-10V6Z', 'm8 12 3 3 5-6'],
            'signal-processing': ['M2 12h3c3-16 5-16 7 0s5 16 7 0h3']
        };
        const primary = document.createElement('div');
        primary.className = 'publication-topics-primary';
        buttons.appendChild(primary);
        for (const [index, group] of groups.entries()) {
            let container = primary;
            if (index === groups.length - 1) {
                container = document.createElement('div');
                container.className = 'publication-topics-secondary';
                buttons.appendChild(container);
            } else if (index > 0) {
                const separator = document.createElement('span');
                separator.className = 'publication-topic-separator';
                separator.textContent = '\u00b7';
                separator.setAttribute('aria-hidden', 'true');
                primary.appendChild(separator);
            }
            for (const topic of group) {
                const label = labels[topic.id] || topic.label;
                const button = document.createElement('button');
                button.type = 'button';
                const labelText = document.createElement('span');
                labelText.className = 'publication-topic-label';
                labelText.textContent = label;
                button.appendChild(labelText);
                if (icons[topic.id]) {
                    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    icon.setAttribute('class', 'publication-topic-icon');
                    icon.setAttribute('viewBox', '0 0 24 24');
                    icon.setAttribute('fill', 'none');
                    icon.setAttribute('stroke', 'currentColor');
                    icon.setAttribute('stroke-width', '2');
                    icon.setAttribute('stroke-linecap', 'round');
                    icon.setAttribute('stroke-linejoin', 'round');
                    icon.setAttribute('aria-hidden', 'true');
                    icon.setAttribute('focusable', 'false');
                    for (const shape of icons[topic.id]) {
                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', shape);
                        icon.appendChild(path);
                    }
                    button.prepend(icon);
                }
                button.setAttribute('aria-label', label);
                if (topic.id !== 'all') {
                    const total = totals.get(topic.id) || 0;
                    const badge = document.createElement('small');
                    badge.className = 'publication-topic-count';
                    badge.textContent = `(${total})`;
                    button.append(' ', badge);
                    button.setAttribute('aria-label', `${label}, ${total} papers`);
                }
                button.dataset.topic = topic.id;
                button.setAttribute('aria-controls', 'publications');
                button.addEventListener('click', () => selectTopic(topic.id));
                container.appendChild(button);
            }
        }

        selectTopic('all', false);
        filter.hidden = false;
    } catch (error) {
        console.warn('Publication topic filters are unavailable.', error);
    }
})();
