
document.addEventListener('DOMContentLoaded', () => {
    // State
    let sessions = [];
    let currentSessionId = null;
    let isSidebarOpen = window.innerWidth >= 768;
    let isGenerating = false;
    let attachments = []; // {name, type, data}
    let isImageMode = false;

    // Advanced features state
    let personas = [];
    let selectedPersonaId = null;
    let temperature = 0.7;
    let maxTokens = 2048;
    let topP = 0.9;
    let topK = 40;
    let repeatPenalty = 1.1;
    let isVoiceListening = false;
    let recognition = null;
    let activeSpeechUtterance = null;
    let activeTtsBtn = null;

    // Core Elements
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const newChatBtn = document.getElementById('newChatBtn');
    const sessionList = document.getElementById('sessionList');
    const modelSelect = document.getElementById('modelSelect');

    const chatContainer = document.getElementById('chatContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const messagesList = document.getElementById('messagesList');
    const bottomAnchor = document.getElementById('bottomAnchor');

    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const imageModeBtn = document.getElementById('imageModeBtn');
    const imageModeText = document.getElementById('imageModeText');
    const attachmentsPreview = document.getElementById('attachmentsPreview');
    const inputWrapper = document.getElementById('inputWrapper');

    // Advanced UI Elements
    const personaSelectorBtn = document.getElementById('personaSelectorBtn');
    const personaDropdown = document.getElementById('personaDropdown');
    const personasContainer = document.getElementById('personasContainer');
    const activePersonaIcon = document.getElementById('activePersonaIcon');
    const activePersonaName = document.getElementById('activePersonaName');

    const ragWorkspaceBtn = document.getElementById('ragWorkspaceBtn');
    const ragWorkspacePanel = document.getElementById('ragWorkspacePanel');
    const ragDropArea = document.getElementById('ragDropArea');
    const ragFileInput = document.getElementById('ragFileInput');
    const ragFilesList = document.getElementById('ragFilesList');
    const ragFilesCount = document.getElementById('ragFilesCount');

    const slidersToggleBtn = document.getElementById('slidersToggleBtn');
    const slidersDrawer = document.getElementById('slidersDrawer');
    const closeSlidersBtn = document.getElementById('closeSlidersBtn');
    const resetSlidersBtn = document.getElementById('resetSlidersBtn');

    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');
    const tokensSlider = document.getElementById('tokensSlider');
    const tokensValue = document.getElementById('tokensValue');
    const topPSlider = document.getElementById('topPSlider');
    const topPValue = document.getElementById('topPValue');
    const topKSlider = document.getElementById('topKSlider');
    const topKValue = document.getElementById('topKValue');
    const penaltySlider = document.getElementById('penaltySlider');
    const penaltyValue = document.getElementById('penaltyValue');

    const createPersonaBtn = document.getElementById('createPersonaBtn');
    const personaModal = document.getElementById('personaModal');
    const closePersonaModalBtn = document.getElementById('closePersonaModalBtn');
    const cancelPersonaBtn = document.getElementById('cancelPersonaBtn');
    const savePersonaBtn = document.getElementById('savePersonaBtn');
    const personaNameInput = document.getElementById('personaNameInput');
    const personaPromptInput = document.getElementById('personaPromptInput');
    const personaIconGrid = document.getElementById('personaIconGrid');

    const voiceBtn = document.getElementById('voiceBtn');
    const voicePulse = document.getElementById('voicePulse');

    // Export elements
    const exportBtn = document.getElementById('exportBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');
    const exportPdfBtn = document.getElementById('exportPdfBtn');

    // New Overhaul UI elements
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleIcon = document.getElementById('themeToggleIcon');
    const suggestionGrid = document.getElementById('suggestionGrid');

    // --- Toast Notification System ---
    function showToast(message, type = 'info', duration = 3000) {
        // Remove existing toasts
        document.querySelectorAll('.toast-notification').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        let iconName = 'info';
        if (type === 'success') iconName = 'check-circle';
        else if (type === 'error') iconName = 'alert-circle';
        
        toast.innerHTML = `<i data-lucide="${iconName}" width="16"></i><span>${message}</span>`;
        document.body.appendChild(toast);
        lucide.createIcons();
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
        });
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    // --- Marked.js Configuration ---
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // --- Premium Theme Controller ---
    let currentTheme = localStorage.getItem('theme') || 'system';

    function applyTheme(theme) {
        currentTheme = theme;
        localStorage.setItem('theme', theme);

        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

        if (shouldBeDark) {
            document.body.classList.add('dark');
            if (themeToggleIcon) {
                themeToggleIcon.setAttribute('data-lucide', 'sun');
                themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
            }
        } else {
            document.body.classList.remove('dark');
            if (themeToggleIcon) {
                themeToggleIcon.setAttribute('data-lucide', 'moon');
                themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
            }
        }
        lucide.createIcons();
    }

    applyTheme(currentTheme);

    themeToggleBtn?.addEventListener('click', () => {
        const nextTheme = currentTheme === 'light' ? 'dark' : (currentTheme === 'dark' ? 'system' : 'light');
        applyTheme(nextTheme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentTheme === 'system') applyTheme('system');
    });

    // --- Sidebar Logic ---
    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
        if (isSidebarOpen) {
            sidebar?.classList.remove('-translate-x-full');
            mobileOverlay?.classList.remove('hidden');
        } else {
            sidebar?.classList.add('-translate-x-full');
            mobileOverlay?.classList.add('hidden');
        }
    }

    if (window.innerWidth >= 768) {
        sidebar?.classList.remove('-translate-x-full');
        mobileOverlay?.classList.add('hidden');
    } else {
        sidebar?.classList.add('-translate-x-full');
    }

    mobileMenuBtn?.addEventListener('click', toggleSidebar);
    mobileOverlay?.addEventListener('click', () => {
        if (window.innerWidth < 768) toggleSidebar();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768) {
            isSidebarOpen = true;
            sidebar?.classList.remove('-translate-x-full');
            mobileOverlay?.classList.add('hidden');
        }
    });

    // --- Popover and Modal Toggles ---
    document.addEventListener('click', (e) => {
        if (personaDropdown && !personaDropdown.classList.contains('hidden') && 
            !personaSelectorBtn.contains(e.target) && !personaDropdown.contains(e.target)) {
            personaDropdown.classList.add('hidden');
        }
        if (ragWorkspacePanel && !ragWorkspacePanel.classList.contains('hidden') && 
            !ragWorkspaceBtn.contains(e.target) && !ragWorkspacePanel.contains(e.target)) {
            ragWorkspacePanel.classList.add('hidden');
        }
        if (exportDropdown && !exportDropdown.classList.contains('hidden') && 
            !exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
            exportDropdown.classList.add('hidden');
        }
    });

    // --- Export Dropdown Toggle ---
    exportBtn?.addEventListener('click', () => {
        exportDropdown?.classList.toggle('hidden');
    });

    // --- Export Handlers ---
    function updateExportButtons() {
        const hasSession = !!currentSessionId;
        if (exportMarkdownBtn) exportMarkdownBtn.disabled = !hasSession;
        if (exportPdfBtn) exportPdfBtn.disabled = !hasSession;
    }

    exportMarkdownBtn?.addEventListener('click', async () => {
        if (!currentSessionId) return;
        exportDropdown?.classList.add('hidden');
        showToast('Generating Markdown export...', 'info', 2000);
        try {
            const res = await fetch(`/api/sessions/${currentSessionId}/export/markdown`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || 'chat.md';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('Markdown exported successfully!', 'success');
        } catch (err) {
            showToast('Failed to export Markdown', 'error');
            console.error(err);
        }
    });

    exportPdfBtn?.addEventListener('click', async () => {
        if (!currentSessionId) return;
        exportDropdown?.classList.add('hidden');
        showToast('Generating PDF export...', 'info', 2000);
        try {
            const res = await fetch(`/api/sessions/${currentSessionId}/export/pdf`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || 'chat.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('PDF exported successfully!', 'success');
        } catch (err) {
            showToast('Failed to export PDF', 'error');
            console.error(err);
        }
    });

    personaSelectorBtn?.addEventListener('click', () => {
        personaDropdown?.classList.toggle('hidden');
    });

    ragWorkspaceBtn?.addEventListener('click', () => {
        ragWorkspacePanel?.classList.toggle('hidden');
        if (currentSessionId) fetchRAGDocuments();
    });

    slidersToggleBtn?.addEventListener('click', () => {
        slidersDrawer?.classList.toggle('translate-x-full');
    });

    closeSlidersBtn?.addEventListener('click', () => {
        slidersDrawer?.classList.add('translate-x-full');
    });

    // --- Sliders Logic ---
    tempSlider?.addEventListener('input', function() {
        temperature = parseFloat(this.value);
        if (tempValue) tempValue.textContent = temperature.toFixed(1);
    });

    tokensSlider?.addEventListener('input', function() {
        maxTokens = parseInt(this.value);
        if (tokensValue) tokensValue.textContent = maxTokens;
    });

    topPSlider?.addEventListener('input', function() {
        topP = parseFloat(this.value);
        if (topPValue) topPValue.textContent = topP.toFixed(2);
    });

    topKSlider?.addEventListener('input', function() {
        topK = parseInt(this.value);
        if (topKValue) topKValue.textContent = topK;
    });

    penaltySlider?.addEventListener('input', function() {
        repeatPenalty = parseFloat(this.value);
        if (penaltyValue) penaltyValue.textContent = repeatPenalty.toFixed(1);
    });

    resetSlidersBtn?.addEventListener('click', () => {
        temperature = 0.7;
        maxTokens = 2048;
        topP = 0.9;
        topK = 40;
        repeatPenalty = 1.1;

        if (tempSlider) tempSlider.value = temperature;
        if (tempValue) tempValue.textContent = '0.7';
        if (tokensSlider) tokensSlider.value = maxTokens;
        if (tokensValue) tokensValue.textContent = '2048';
        if (topPSlider) topPSlider.value = topP;
        if (topPValue) topPValue.textContent = '0.90';
        if (topKSlider) topKSlider.value = topK;
        if (topKValue) topKValue.textContent = '40';
        if (penaltySlider) penaltySlider.value = repeatPenalty;
        if (penaltyValue) penaltyValue.textContent = '1.1';
    });

    // --- Custom Personas Modal ---
    createPersonaBtn?.addEventListener('click', () => {
        personaDropdown?.classList.add('hidden');
        personaModal?.classList.remove('hidden');
        if (personaNameInput) personaNameInput.value = '';
        if (personaPromptInput) personaPromptInput.value = '';
    });

    closePersonaModalBtn?.addEventListener('click', () => {
        personaModal?.classList.add('hidden');
    });

    cancelPersonaBtn?.addEventListener('click', () => {
        personaModal?.classList.add('hidden');
    });

    let selectedIcon = 'sparkles';
    const iconButtons = personaIconGrid?.querySelectorAll('.icon-option');
    iconButtons?.forEach(btn => {
        btn.addEventListener('click', () => {
            iconButtons.forEach(b => {
                b.classList.remove('active');
                b.classList.remove('border-blue-500');
                b.classList.add('border-transparent');
            });
            btn.classList.add('active');
            btn.classList.add('border-blue-500');
            btn.classList.remove('border-transparent');
            selectedIcon = btn.getAttribute('data-icon') || 'sparkles';
        });
    });

    savePersonaBtn?.addEventListener('click', async () => {
        const name = personaNameInput?.value.trim();
        const prompt = personaPromptInput?.value.trim();
        if (!name || !prompt) {
            alert("Name and system instructions are required!");
            return;
        }

        try {
            const res = await fetch('/api/personas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    system_prompt: prompt,
                    icon: selectedIcon
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create persona");
            }

            personaModal?.classList.add('hidden');
            fetchPersonas(); 
        } catch (err) {
            alert(err.message);
        }
    });

    // --- Custom Suggestion Cards Grid Maps ---
    const suggestionPresets = {
        "General Assistant": [
            { title: "Explain Quantum Physics", desc: "Break it down in simple everyday terms.", text: "Explain Quantum Physics in simple terms." },
            { title: "Weekend Hacks", desc: "5 productivity tips for a perfect weekend.", text: "Give me 5 weekend productivity hacks." }
        ],
        "Expert Software Engineer": [
            { title: "Glassmorphic Cards", desc: "Write pure-CSS designs with blurred layers.", text: "Write a pure-CSS glassmorphic card style with soft backing." },
            { title: "Backup Script", desc: "Create a Python tool to automate folders archiving.", text: "Write a complete Python script to automatically archive a folder." }
        ],
        "Scientific Researcher": [
            { title: "Method Section Outline", desc: "Draft standard structural sections for research.", text: "Outline the method section of a scientific research paper." },
            { title: "Double-Slit Experiment", desc: "Explain the wave-particle duality significance.", text: "Explain the historical significance of the double-slit experiment." }
        ],
        "Copywriter / Editor": [
            { title: "App Launch Copy", desc: "Create an engaging launch newsletter draft.", text: "Draft an engaging launch email for a new local tech app." },
            { title: "Refine Phrasing Tone", desc: "Elevate sentences to sound premium and sleek.", text: "Rewrite this sentence to make it sound premium: 'We make good AI tools that run on computers.'" }
        ],
        "Concise Summarizer": [
            { title: "Summarize RAG Systems", desc: "List core retrieval concepts in bullet lines.", text: "Explain how retrieval-augmented generation systems work in bullet points." },
            { title: "Meeting Agenda Extract", desc: "Pull action takeaways from mock log transcripts.", text: "Extract key action items and outcomes from this meeting log: '10 AM - Discussed servers speed, decided to scale RAM next Tuesday. 11 AM - Aligned marketing specs.'" }
        ]
    };

    function updateSuggestionCards() {
        if (!suggestionGrid) return;
        suggestionGrid.innerHTML = '';

        let activeName = "General Assistant";
        if (selectedPersonaId && personas.length > 0) {
            const activePersona = personas.find(p => p.id === selectedPersonaId);
            if (activePersona) activeName = activePersona.name;
        }

        const cards = suggestionPresets[activeName] || suggestionPresets["General Assistant"];

        cards.forEach(card => {
            const cardBtn = document.createElement('button');
            cardBtn.className = 'suggestion-card p-4 rounded-xl border text-left flex flex-col gap-1 hover:border-indigo-400 focus:outline-none transition-all active:scale-98 animate-slide-up duration-200';
            
            let iconName = 'sparkles';
            if (activeName === 'Expert Software Engineer') iconName = 'code';
            else if (activeName === 'Scientific Researcher') iconName = 'microscope';
            else if (activeName === 'Copywriter / Editor') iconName = 'pen-tool';
            else if (activeName === 'Concise Summarizer') iconName = 'align-left';

            cardBtn.innerHTML = `
                <div class="flex items-center gap-2 mb-0.5">
                    <i data-lucide="${iconName}" width="14" class="text-indigo-500"></i>
                    <span class="text-xs font-bold text-[var(--text-main)]">${card.title}</span>
                </div>
                <span class="text-[10px] text-[var(--text-muted)] leading-relaxed">${card.desc}</span>
            `;

            cardBtn.addEventListener('click', () => {
                if (promptInput) {
                    promptInput.value = card.text;
                    promptInput.style.height = 'auto';
                    promptInput.style.height = (promptInput.scrollHeight) + 'px';
                    promptInput.focus();
                }
                sendMessage();
            });

            suggestionGrid.appendChild(cardBtn);
        });

        // Hide suggestions if chat screen is loaded
        if (messagesList.classList.contains('hidden')) {
            suggestionGrid.classList.remove('hidden');
        } else {
            suggestionGrid.classList.add('hidden');
        }

        lucide.createIcons();
    }

    // --- Code Blocks Header Decoration & Copy Clicks ---
    function decorateCodeBlocks(container) {
        if (!container) return;
        container.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentNode;
            if (pre.parentNode.classList.contains('code-block-wrapper')) return; 

            // Highlight the code block
            hljs.highlightElement(block);

            // Create wrapper container
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper animate-slide-up';
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            // Fetch programming lang
            let lang = 'code';
            block.classList.forEach(cls => {
                if (cls.startsWith('language-')) {
                    lang = cls.replace('language-', '');
                } else if (cls.startsWith('hljs')) {
                    // skip
                }
            });

            // Pretty display names for common languages
            const langDisplayMap = {
                'js': 'JavaScript', 'javascript': 'JavaScript', 'ts': 'TypeScript', 'typescript': 'TypeScript',
                'py': 'Python', 'python': 'Python', 'rb': 'Ruby', 'ruby': 'Ruby',
                'java': 'Java', 'cpp': 'C++', 'c': 'C', 'cs': 'C#', 'csharp': 'C#',
                'go': 'Go', 'rs': 'Rust', 'rust': 'Rust', 'php': 'PHP',
                'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'sql': 'SQL',
                'json': 'JSON', 'yaml': 'YAML', 'yml': 'YAML', 'xml': 'XML',
                'sh': 'Shell', 'bash': 'Bash', 'zsh': 'Zsh', 'powershell': 'PowerShell',
                'md': 'Markdown', 'markdown': 'Markdown', 'dockerfile': 'Dockerfile',
                'swift': 'Swift', 'kotlin': 'Kotlin', 'dart': 'Dart', 'lua': 'Lua',
                'r': 'R', 'scala': 'Scala', 'perl': 'Perl', 'jsx': 'JSX', 'tsx': 'TSX',
                'vue': 'Vue', 'svelte': 'Svelte', 'graphql': 'GraphQL'
            };
            const displayLang = langDisplayMap[lang.toLowerCase()] || lang.toUpperCase();

            // Decorator bar
            const headerBar = document.createElement('div');
            headerBar.className = 'code-block-header';
            headerBar.innerHTML = `
                <span>${displayLang}</span>
                <button class="code-copy-btn" title="Copy Code">
                    <i data-lucide="copy" width="12"></i>
                    <span>Copy</span>
                </button>
            `;

            // Clipboard bind
            const copyBtn = headerBar.querySelector('.code-copy-btn');
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(block.textContent);
                    copyBtn.innerHTML = `
                        <i data-lucide="check" width="12" class="text-green-500"></i>
                        <span class="text-green-500 font-bold">Copied!</span>
                    `;
                    lucide.createIcons();
                    setTimeout(() => {
                        copyBtn.innerHTML = `
                            <i data-lucide="copy" width="12"></i>
                            <span>Copy</span>
                        `;
                        lucide.createIcons();
                    }, 1500);
                } catch (err) {
                    console.error("Copy failed:", err);
                }
            };

            wrapper.insertBefore(headerBar, pre);
        });

        // Wrap standalone tables (not already wrapped by marked renderer)
        container.querySelectorAll('table').forEach((table) => {
            if (table.parentNode.classList.contains('table-wrapper')) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper animate-slide-up';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        lucide.createIcons();
    }

    // --- Persona Data Binding ---
    async function fetchPersonas() {
        try {
            const res = await fetch('/api/personas');
            if (res.ok) {
                const data = await res.json();
                personas = data.personas || [];
                renderPersonas();
                updateSuggestionCards(); // Render suggestion prompts
            }
        } catch (err) {
            console.error("Error fetching personas:", err);
        }
    }

    function renderPersonas() {
        if (!personasContainer) return;
        personasContainer.innerHTML = '';

        if (personas.length === 0) {
            personasContainer.innerHTML = '<div class="px-3 py-2 text-xs text-gray-500 italic">No personas seeded</div>';
            return;
        }

        personas.forEach(p => {
            const btn = document.createElement('button');
            const isActive = selectedPersonaId === p.id || (!selectedPersonaId && p.name === 'General Assistant');
            btn.className = `persona-item-btn ${isActive ? 'active' : ''}`;
            
            let iconColor = 'text-purple-600';
            if (p.icon === 'code') iconColor = 'text-blue-500';
            else if (p.icon === 'pen-tool') iconColor = 'text-orange-500';
            else if (p.icon === 'microscope') iconColor = 'text-green-500';
            else if (p.icon === 'book-open') iconColor = 'text-red-500';

            let deleteBtnHtml = '';
            if (!p.is_system) {
                deleteBtnHtml = `
                    <span class="delete-p-btn p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" data-id="${p.id}">
                        <i data-lucide="trash-2" width="12"></i>
                    </span>
                `;
            }

            btn.innerHTML = `
                <div class="flex items-center gap-2 truncate">
                    <i data-lucide="${p.icon}" width="14" class="${iconColor} shrink-0"></i>
                    <span class="truncate">${p.name}</span>
                </div>
                ${deleteBtnHtml}
            `;

            btn.addEventListener('click', (e) => {
                if (e.target.closest('.delete-p-btn')) return;
                selectedPersonaId = p.id;
                if (activePersonaName) activePersonaName.textContent = p.name;
                if (activePersonaIcon) {
                    activePersonaIcon.setAttribute('data-lucide', p.icon);
                    activePersonaIcon.className = `shrink-0 ${iconColor}`;
                }
                personaDropdown?.classList.add('hidden');
                renderPersonas(); 
                updateSuggestionCards(); // Re-render suggest grid dynamically
                lucide.createIcons();
            });

            const delBtn = btn.querySelector('.delete-p-btn');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;
                    try {
                        const dRes = await fetch(`/api/personas/${p.id}`, { method: 'DELETE' });
                        if (dRes.ok) {
                            if (selectedPersonaId === p.id) {
                                selectedPersonaId = null;
                                if (activePersonaName) activePersonaName.textContent = 'General Assistant';
                                if (activePersonaIcon) {
                                    activePersonaIcon.setAttribute('data-lucide', 'sparkles');
                                    activePersonaIcon.className = 'text-purple-600 shrink-0';
                                }
                            }
                            fetchPersonas();
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            }

            personasContainer.appendChild(btn);
        });

        lucide.createIcons();
    }

    // --- Document RAG Workspace Logic ---
    if (ragDropArea) {
        ragDropArea.onclick = () => ragFileInput?.click();

        ['dragenter', 'dragover'].forEach(eventName => {
            ragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                ragDropArea.classList.add('border-blue-400', 'bg-blue-50/20');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            ragDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                ragDropArea.classList.remove('border-blue-400', 'bg-blue-50/20');
            }, false);
        });

        ragDropArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) handleRAGUpload(files[0]);
        });
    }

    ragFileInput?.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            handleRAGUpload(this.files[0]);
            this.value = '';
        }
    });

    async function handleRAGUpload(file) {
        if (!currentSessionId) {
            alert("Please send a chat message or open a session first to upload documents!");
            return;
        }

        const validExtensions = ['.pdf', '.docx', '.doc', '.csv', '.txt'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!validExtensions.includes(ext)) {
            alert("Invalid document format! Supports PDF, DOCX, CSV or TXT files only.");
            return;
        }

        const loadingItem = document.createElement('div');
        loadingItem.id = 'rag-loading-spinner';
        loadingItem.className = 'flex items-center justify-between p-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl upload-pulse';
        loadingItem.innerHTML = `
            <div class="flex items-center gap-2 truncate">
                <i data-lucide="loader-2" width="14" class="text-[var(--accent-color)] animate-spin shrink-0"></i>
                <span class="text-xs text-[var(--text-main)] truncate font-semibold">${file.name}</span>
            </div>
            <span class="text-[10px] text-[var(--accent-color)] font-bold">Vectorizing...</span>
        `;
        ragFilesList?.prepend(loadingItem);
        lucide.createIcons();

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: currentSessionId,
                        filename: file.name,
                        data: e.target.result,
                        model: modelSelect.value
                    })
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to embed document");
                }

                fetchRAGDocuments(); 
            } catch (err) {
                alert(`Upload failed: ${err.message}`);
                loadingItem.remove();
            }
        };
        reader.readAsDataURL(file);
    }

    async function fetchRAGDocuments() {
        if (!currentSessionId) return;
        try {
            const res = await fetch(`/api/sessions/${currentSessionId}/documents`);
            if (res.ok) {
                const data = await res.json();
                ragFiles = data.documents || [];
                renderRAGDocuments();
            }
        } catch (err) {
            console.error("Error loading RAG documents:", err);
        }
    }

    function renderRAGDocuments() {
        if (!ragFilesList) return;
        ragFilesList.innerHTML = '';

        if (ragFilesCount) {
            if (ragFiles.length > 0) {
                ragFilesCount.textContent = ragFiles.length;
                ragFilesCount.classList.remove('hidden');
            } else {
                ragFilesCount.classList.add('hidden');
            }
        }

        if (ragFiles.length === 0) {
            ragFilesList.innerHTML = '<div class="text-[10px] text-[var(--text-muted)] text-center py-4">No active workspace documents.</div>';
            return;
        }

        ragFiles.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'rag-doc-item';
            
            let iconName = 'file-text';
            if (doc.file_type === '.pdf') iconName = 'file';
            else if (doc.file_type === '.csv') iconName = 'table-properties';

            item.innerHTML = `
                <div class="flex items-center gap-2 truncate">
                    <i data-lucide="${iconName}" width="14" class="text-[var(--accent-color)] shrink-0"></i>
                    <span class="text-xs font-semibold text-[var(--text-main)] truncate" title="${doc.filename}">${doc.filename}</span>
                </div>
                <button class="delete-doc-btn p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors" data-id="${doc.id}">
                    <i data-lucide="trash-2" width="12"></i>
                </button>
            `;

            item.querySelector('.delete-doc-btn').addEventListener('click', async function() {
                const docId = this.getAttribute('data-id');
                try {
                    const dRes = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
                    if (dRes.ok) fetchRAGDocuments();
                } catch (err) {
                    console.error("Failed to delete document:", err);
                }
            });

            ragFilesList.appendChild(item);
        });

        lucide.createIcons();
    }

    // --- Voice Dictation (STT) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isVoiceListening = true;
            voiceBtn?.classList.add('voice-recording');
            voicePulse?.classList.remove('hidden');
        };

        recognition.onend = () => {
            isVoiceListening = false;
            voiceBtn?.classList.remove('voice-recording');
            voicePulse?.classList.add('hidden');
        };

        recognition.onresult = (e) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript;
                }
            }
            if (finalTranscript && promptInput) {
                promptInput.value = (promptInput.value + ' ' + finalTranscript).trim();
                promptInput.dispatchEvent(new Event('input'));
            }
        };

        recognition.onerror = (e) => {
            console.error("STT Error:", e.error);
            recognition.stop();
        };

        voiceBtn?.addEventListener('click', () => {
            if (isVoiceListening) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        if (voiceBtn) {
            voiceBtn.style.display = 'none'; 
        }
    }

    // --- Speech Synthesis (TTS) Reader ---
    function toggleTTS(text, btnElement) {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            
            if (activeTtsBtn === btnElement) {
                updateTtsButtonState(activeTtsBtn, false);
                activeTtsBtn = null;
                activeSpeechUtterance = null;
                return;
            }
            
            if (activeTtsBtn) {
                updateTtsButtonState(activeTtsBtn, false);
            }
        }

        const cleanText = text.replace(/[*_`#\-]/g, '').trim();

        activeSpeechUtterance = new SpeechSynthesisUtterance(cleanText);
        activeTtsBtn = btnElement;
        
        activeSpeechUtterance.onstart = () => {
            updateTtsButtonState(btnElement, true);
        };

        activeSpeechUtterance.onend = () => {
            updateTtsButtonState(btnElement, false);
            activeTtsBtn = null;
            activeSpeechUtterance = null;
        };

        activeSpeechUtterance.onerror = () => {
            updateTtsButtonState(btnElement, false);
            activeTtsBtn = null;
            activeSpeechUtterance = null;
        };

        window.speechSynthesis.speak(activeSpeechUtterance);
    }

    function updateTtsButtonState(btn, isSpeaking) {
        if (!btn) return;
        if (isSpeaking) {
            btn.innerHTML = `<i data-lucide="volume-x" width="13" class="text-red-500"></i>`;
            btn.setAttribute('title', 'Stop Audio');
        } else {
            btn.innerHTML = `<i data-lucide="volume-2" width="13"></i>`;
            btn.setAttribute('title', 'Read Aloud');
        }
        lucide.createIcons();
    }

    window.addEventListener('beforeunload', () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    });

    // --- Chat & Session Logic ---
    async function fetchHistory() {
        try {
            const res = await fetch('/history');
            if (res.status === 401) {
                sessions = [];
            } else {
                const data = await res.json();
                sessions = data.sessions || [];
            }
            renderSessionList();
        } catch (err) {
            console.error(err);
            sessions = [];
            renderSessionList();
        }
    }

    function renderSessionList() {
        if (!sessionList) return;
        sessionList.innerHTML = '';
        const label = document.createElement('div');
        label.className = 'px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider';
        label.textContent = 'Recent';
        sessionList.appendChild(label);

        if (sessions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'px-3 py-2 text-sm text-gray-500 italic';
            empty.textContent = 'No recent history';
            sessionList.appendChild(empty);
            return;
        }

        sessions.forEach(session => {
            const btn = document.createElement('button');
            const isActive = currentSessionId === session.id;
            btn.className = `sidebar-session-btn ${isActive ? 'active' : ''}`;
            btn.innerHTML = `
                <i data-lucide="message-square" width="16" class="flex-shrink-0 ${isActive ? 'text-[var(--accent-color)]' : 'text-[var(--text-sidebar)] opacity-60 group-hover:opacity-100'}"></i>
                <span class="truncate">${session.title}</span>
            `;
            btn.onclick = () => loadSession(session.id);
            sessionList.appendChild(btn);
        });
        lucide.createIcons();
    }

    async function loadSession(id) {
        try {
            currentSessionId = id;
            welcomeScreen.classList.add('hidden');
            if (suggestionGrid) suggestionGrid.classList.add('hidden');
            messagesList.classList.remove('hidden');
            messagesList.innerHTML = ''; 

            const res = await fetch(`/history/${id}`);
            if (!res.ok) throw new Error("Could not load session");
            const data = await res.json();

            if (data.messages) {
                data.messages.forEach(msg => {
                    appendMessage(msg.role, msg.content, msg.prompt_tokens, msg.eval_tokens);
                });
            }
            
            fetchRAGDocuments();
            renderSessionList();
            updateExportButtons();
            if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar();
            scrollToBottom();
        } catch (err) {
            console.error(err);
        }
    }

    function createNewChat() {
        currentSessionId = null;
        welcomeScreen.classList.remove('hidden');
        messagesList.classList.add('hidden');
        messagesList.innerHTML = '';
        promptInput.value = '';
        promptInput.style.height = 'auto';
        attachments = [];
        renderAttachments();
        isImageMode = false;
        updateImageModeUI();
        renderSessionList(); 
        updateExportButtons();
        
        ragFiles = [];
        renderRAGDocuments();
        updateSuggestionCards();

        if (window.innerWidth < 768 && isSidebarOpen) toggleSidebar();
        promptInput.focus();
    }

    newChatBtn?.addEventListener('click', createNewChat);

    // --- Messaging ---
    function scrollToBottom() {
        bottomAnchor?.scrollIntoView({ behavior: 'smooth' });
    }

    function appendMessage(role, content, promptTokens = null, evalTokens = null) {
        const div = document.createElement('div');
        div.className = `flex w-full group py-2 animate-slide-up ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        const isUser = role === 'user';
        const parsedContent = isUser ? content : marked.parse(content);

        div.innerHTML = `
            <div class="flex max-w-[75%] md:max-w-[70%] gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} w-full">
                <div class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'} text-xs font-semibold mt-1 shadow">
                    ${isUser ? 'U' : 'AI'}
                </div>
                <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0 w-full">
                     <div class="px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed break-words max-w-full
                        ${isUser
                            ? 'bubble-user-style'
                            : 'bubble-ai-style prose prose-sm prose-p:my-1 prose-p:leading-relaxed prose-headings:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0'
                        }">
                        ${isUser ? content : parsedContent}
                     </div>
                     ${!isUser ? `
                     <div class="flex items-center justify-between w-full mt-1.5 select-none">
                         <div class="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                             <button class="tts-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-200/50 rounded transition-colors" title="Read Aloud">
                                 <i data-lucide="volume-2" width="13"></i>
                             </button>
                             <button class="copy-resp-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-200/50 rounded transition-colors" title="Copy Response">
                                 <i data-lucide="copy" width="13"></i>
                             </button>
                             <button class="download-resp-btn p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-200/50 rounded transition-colors" title="Download Response (.md)">
                                 <i data-lucide="download" width="13"></i>
                             </button>
                         </div>
                         <div class="token-usage-badge hidden flex items-center text-[10px] text-[var(--text-muted)] font-medium px-2.5 py-0.5 bg-[var(--border-color)]/30 rounded-full border border-[var(--border-color)]/25 select-none transition-all duration-300">
                             <!-- CPU stats will be injected dynamically -->
                         </div>
                     </div>
                     ` : ''}
                </div>
            </div>
        `;

        messagesList.appendChild(div);
        lucide.createIcons();

        // Decorate blocks with Language Badge and Copy buttons
        if (!isUser) {
            decorateCodeBlocks(div);

            const ttsBtn = div.querySelector('.tts-btn');
            if (ttsBtn) {
                ttsBtn.onclick = () => toggleTTS(content, ttsBtn);
            }

            const copyBtn = div.querySelector('.copy-resp-btn');
            if (copyBtn) {
                copyBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(content);
                        copyBtn.innerHTML = `<i data-lucide="check" width="13" class="text-emerald-500"></i>`;
                        lucide.createIcons();
                        showToast('Response copied to clipboard!', 'success');
                        setTimeout(() => {
                            copyBtn.innerHTML = `<i data-lucide="copy" width="13"></i>`;
                            lucide.createIcons();
                        }, 2000);
                    } catch (err) {
                        console.error('Copy failed:', err);
                        showToast('Failed to copy response', 'error');
                    }
                };
            }

            const downloadBtn = div.querySelector('.download-resp-btn');
            if (downloadBtn) {
                downloadBtn.onclick = () => {
                    try {
                        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                        a.download = `response-${timestamp}.md`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        showToast('Response downloaded as Markdown!', 'success');
                    } catch (err) {
                        console.error('Download failed:', err);
                        showToast('Failed to download response', 'error');
                    }
                };
            }

            // Render token usage if passed (e.g. from history load)
            if (promptTokens !== null && evalTokens !== null && (promptTokens > 0 || evalTokens > 0)) {
                const badge = div.querySelector('.token-usage-badge');
                if (badge) {
                    badge.innerHTML = `<i data-lucide="cpu" width="10" class="mr-1 inline-block text-[var(--accent-color)]"></i> ${promptTokens} p | ${evalTokens} g`;
                    badge.classList.remove('hidden');
                    lucide.createIcons();
                }
            }
        }

        scrollToBottom();
        return div; 
    }

    async function sendMessage() {
        const text = promptInput.value.trim();
        if ((!text && attachments.length === 0) || isGenerating) return;

        if (isVoiceListening && recognition) recognition.stop();

        isGenerating = true;
        updateSendBtn();

        welcomeScreen.classList.add('hidden');
        if (suggestionGrid) suggestionGrid.classList.add('hidden'); // Clear cards visualizer
        messagesList.classList.remove('hidden');

        promptInput.value = '';
        promptInput.style.height = 'auto';

        let userContent = text;
        if (attachments.length > 0) {
            userContent += `\n\n*[Attached ${attachments.length} file(s)]*`;
        }
        if (isImageMode) {
            userContent = `**[Generating Image]** ${userContent}`;
        }

        const currentAttachments = [...attachments]; 
        attachments = [];
        const currentImageMode = isImageMode;
        isImageMode = false; 

        renderAttachments();
        updateImageModeUI();

        // 1. Add User Message
        appendMessage('user', userContent);

        // 2. Prepare Assistant Message Placeholder
        const aiMsgDiv = appendMessage('assistant', '<span class="typing-cursor"></span>');
        const aiContentContainer = aiMsgDiv.querySelector('.prose'); 
        let aiFullText = "";

        // Add glow visual feedback ring
        inputWrapper?.classList.add('generating-active');

        try {
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: text,
                    model: modelSelect.value,
                    session_id: currentSessionId,
                    attachments: currentAttachments, 
                    isImageGeneration: currentImageMode,
                    persona_id: selectedPersonaId,
                    temperature: temperature,
                    top_p: topP,
                    top_k: topK,
                    repeat_penalty: repeatPenalty,
                    num_predict: maxTokens
                })
            });

            if (!res.ok) throw new Error("Network error");

            const newId = res.headers.get('X-Session-ID');
            if (newId && newId !== currentSessionId) {
                currentSessionId = newId;
                fetchHistory();
                updateExportButtons();
            }

            // If we sent RAG-eligible attachments, show toast and refresh docs
            const ragExts = ['.pdf', '.docx', '.doc', '.csv', '.txt'];
            const hadRagFiles = currentAttachments.some(a => {
                const ext = '.' + (a.name || '').split('.').pop().toLowerCase();
                return ragExts.includes(ext);
            });
            if (hadRagFiles) {
                showToast('Document embedded for RAG context', 'success', 3000);
                // Refresh RAG docs after a short delay to let backend finish
                setTimeout(() => fetchRAGDocuments(), 1500);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let pTokens = null;
            let gTokens = null;

            while (true) {
                // Check scroll position BEFORE updating content
                const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 120;

                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiFullText += chunk;

                if (aiContentContainer) {
                    // Check if the stream contains the token usage signature
                    const tokenMatch = aiFullText.match(/\[TOKEN_USAGE:prompt_tokens=(\d+),eval_tokens=(\d+)\]/);
                    let textToRender = aiFullText;
                    if (tokenMatch) {
                        pTokens = parseInt(tokenMatch[1]);
                        gTokens = parseInt(tokenMatch[2]);
                        textToRender = aiFullText.replace(/\[TOKEN_USAGE:prompt_tokens=\d+,eval_tokens=\d+\]/, '').trim();
                    }

                    // Update content dynamically injecting vertical pulsing line cursor indicator at the end
                    aiContentContainer.innerHTML = marked.parse(textToRender) + (tokenMatch ? '' : '<span class="typing-cursor"></span>');
                }

                // Smart auto-scroll only if user is at the bottom
                if (isAtBottom) {
                    scrollToBottom();
                }
            }

            // Remove cursor line, extract token info if present, and decorate code blocks
            let cleanResponseText = aiFullText;
            const finalTokenMatch = aiFullText.match(/\[TOKEN_USAGE:prompt_tokens=(\d+),eval_tokens=(\d+)\]/);
            if (finalTokenMatch) {
                pTokens = parseInt(finalTokenMatch[1]);
                gTokens = parseInt(finalTokenMatch[2]);
                cleanResponseText = aiFullText.replace(/\[TOKEN_USAGE:prompt_tokens=\d+,eval_tokens=\d+\]/, '').trim();
            }

            if (aiContentContainer) {
                aiContentContainer.innerHTML = marked.parse(cleanResponseText);
                decorateCodeBlocks(aiMsgDiv);
            }

            // Render token usage badge if counts are parsed
            if (pTokens !== null && gTokens !== null) {
                const badge = aiMsgDiv.querySelector('.token-usage-badge');
                if (badge) {
                    badge.innerHTML = `<i data-lucide="cpu" width="10" class="mr-1 inline-block text-[var(--accent-color)]"></i> ${pTokens} p | ${gTokens} g`;
                    badge.classList.remove('hidden');
                    lucide.createIcons();
                }
            }

            // Bind click handlers with complete text once generation completes
            const freshTtsBtn = aiMsgDiv.querySelector('.tts-btn');
            if (freshTtsBtn) {
                freshTtsBtn.onclick = () => toggleTTS(cleanResponseText, freshTtsBtn);
            }

            const freshCopyBtn = aiMsgDiv.querySelector('.copy-resp-btn');
            if (freshCopyBtn) {
                freshCopyBtn.onclick = async () => {
                    try {
                        await navigator.clipboard.writeText(cleanResponseText);
                        freshCopyBtn.innerHTML = `<i data-lucide="check" width="13" class="text-emerald-500"></i>`;
                        lucide.createIcons();
                        showToast('Response copied to clipboard!', 'success');
                        setTimeout(() => {
                            freshCopyBtn.innerHTML = `<i data-lucide="copy" width="13"></i>`;
                            lucide.createIcons();
                        }, 2000);
                    } catch (err) {
                        console.error('Copy failed:', err);
                        showToast('Failed to copy response', 'error');
                    }
                };
            }

            const freshDownloadBtn = aiMsgDiv.querySelector('.download-resp-btn');
            if (freshDownloadBtn) {
                freshDownloadBtn.onclick = () => {
                    try {
                        const blob = new Blob([cleanResponseText], { type: 'text/markdown;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                        a.download = `response-${timestamp}.md`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        showToast('Response downloaded as Markdown!', 'success');
                    } catch (err) {
                        console.error('Download failed:', err);
                        showToast('Failed to download response', 'error');
                    }
                };
            }

        } catch (err) {
            if (aiContentContainer) aiContentContainer.innerHTML = `**Error:** ${err.message}`;
        } finally {
            isGenerating = false;
            inputWrapper?.classList.remove('generating-active'); // Stop border glow ring
            updateSendBtn();
        }
    }

    function updateSendBtn() {
        if ((promptInput.value.trim() || attachments.length > 0) && !isGenerating) {
            sendBtn.disabled = false;
            sendBtn.classList.remove('bg-gray-200', 'text-gray-400', 'cursor-not-allowed');
            if (isImageMode) {
                sendBtn.classList.add('bg-purple-600', 'text-white', 'hover:bg-purple-700');
                sendBtn.classList.remove('bg-black', 'hover:bg-neutral-800');
            } else {
                sendBtn.classList.add('bg-black', 'text-white', 'hover:bg-neutral-800');
                sendBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
            }
        } else {
            sendBtn.disabled = true;
            sendBtn.className = 'p-2 rounded-full transition-all duration-200 bg-gray-200 text-gray-400 cursor-not-allowed';
        }
    }

    // --- Attachments & Image Mode ---
    if (attachBtn) attachBtn.onclick = () => fileInput.click();

    if (fileInput) fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                attachments.push({
                    name: file.name,
                    type: file.type,
                    data: ev.target.result
                });
                renderAttachments();
                updateSendBtn();
            };
            reader.readAsDataURL(file);
        });
        fileInput.value = '';
    };

    function renderAttachments() {
        if (attachments.length === 0) {
            attachmentsPreview.classList.add('hidden');
        } else {
            attachmentsPreview.classList.remove('hidden');
        }

        attachmentsPreview.innerHTML = '';
        attachments.forEach((file, idx) => {
            const div = document.createElement('div');
            div.className = 'relative group flex-shrink-0';

            const textExtensions = ['.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml',
                '.yaml', '.yml', '.csv', '.log', '.sql', '.conf', '.ini', '.env',
                '.java', '.cpp', '.c', '.h', '.rb', '.go', '.rs', '.php', '.sh',
                '.bat', '.ps1', '.jsx', '.tsx', '.ts', '.vue', '.svelte'];
            const filename = file.name.toLowerCase();
            const isTextFile = textExtensions.some(ext => filename.endsWith(ext));

            let previewContent = '';
            if (file.type.startsWith('image/')) {
                previewContent = `<img src="${file.data}" alt="preview" class="w-full h-full object-cover">`;
            } else if (isTextFile) {
                previewContent = `<i data-lucide="file-text" width="24" class="text-blue-500"></i>`;
            } else {
                previewContent = `<i data-lucide="file" width="24" class="text-gray-400"></i>`;
            }

            div.innerHTML = `
                <div class="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    ${previewContent}
                </div>
                <button class="absolute -top-1 -right-1 p-0.5 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" data-idx="${idx}">
                    <i data-lucide="x" width="12"></i>
                </button>
                <div class="absolute -bottom-5 left-0 right-0 text-center text-[10px] text-gray-500 truncate px-1">${file.name}</div>
            `;

            div.querySelector('button').onclick = () => {
                attachments = attachments.filter((_, i) => i !== idx);
                renderAttachments();
                updateSendBtn();
            };

            attachmentsPreview.appendChild(div);
        });
        lucide.createIcons();
    }

    if (imageModeBtn) imageModeBtn.onclick = () => {
        isImageMode = !isImageMode;
        updateImageModeUI();
        updateSendBtn();
    };

    function updateImageModeUI() {
        if (isImageMode) {
            imageModeBtn.classList.add('text-purple-600', 'bg-purple-50', 'hover:bg-purple-100');
            imageModeBtn.classList.remove('text-gray-400', 'hover:text-gray-600', 'hover:bg-gray-200/50');
            imageModeText.classList.remove('hidden');

            inputWrapper.classList.add('border-purple-400', 'ring-1', 'ring-purple-100');
            inputWrapper.classList.remove('border-transparent');

            promptInput.placeholder = "Describe the image you want to create...";
        } else {
            imageModeBtn.classList.remove('text-purple-600', 'bg-purple-50', 'hover:bg-purple-100');
            imageModeBtn.classList.add('text-gray-400', 'hover:text-gray-600', 'hover:bg-gray-200/50');
            imageModeText.classList.add('hidden');

            inputWrapper.classList.remove('border-purple-400', 'ring-1', 'ring-purple-100');
            inputWrapper.classList.add('border-transparent');

            promptInput.placeholder = "Message Privacy LLM...";
        }
    }

    // --- Inputs Handling ---
    if (promptInput) {
        promptInput.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            updateSendBtn();
        });

        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    // Initial Load Calls
    fetchHistory();
    fetchPersonas();
});
