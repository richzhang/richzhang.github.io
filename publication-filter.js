(function () {
    const filter = document.getElementById('publication-filter');
    const buttons = filter.querySelector('.publication-topics');
    const count = document.getElementById('publication-count');
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
            count.textContent = `Showing ${matching.size} of ${papers.length} papers`;

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
        const modalities = ['image', 'video-generation', 'geometry-3d', 'audio'];
        const modelTypes = ['generative-models', 'understanding-models'];
        const highlights = topicsById.get('highlights');
        const primaryIds = new Set(['highlights', ...modalities, ...modelTypes]);
        const groups = [
            [{ id: 'all', label: 'All' }, ...(highlights ? [highlights] : [])],
            modalities.map(id => topicsById.get(id)).filter(Boolean),
            modelTypes.map(id => topicsById.get(id)).filter(Boolean),
            data.topics.filter(topic => !primaryIds.has(topic.id))
        ];
        const labels = { 'geometry-3d': '3D/Geometry', 'video-generation': 'Video' };
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
                button.textContent = label;
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
