/* ==========================================================================
   EDITOR.JS — DVEL Code Editor Page
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initEditorPage();
});

/* --------------------------------------------------------------------------
   COURSE CONFIGURATION
   -------------------------------------------------------------------------- */
const COURSE_CONFIG = {
    'python':     { language: 'python',     name: 'Python Fundamentals', icon: 'code',        hasPreview: false },
    'html-css':   { language: 'html',       name: 'HTML & CSS',          icon: 'web',         hasPreview: true  },
    'javascript': { language: 'javascript', name: 'JavaScript',          icon: 'bolt',        hasPreview: true  },
    'numpy':      { language: 'python',     name: 'NumPy',               icon: 'functions',   hasPreview: false },
    'pandas':     { language: 'python',     name: 'Pandas',              icon: 'query_stats', hasPreview: false },
    'fastapi':    { language: 'python',     name: 'FastAPI',             icon: 'cloud',       hasPreview: false },
};


const FILE_NAMES = {
    python:     'main.py',
    html:       'index.html',
    javascript: 'script.js',
};

const FILE_ICONS = {
    python:     'description',
    html:       'html',
    javascript: 'javascript',
};

/* --------------------------------------------------------------------------
   STATE
   -------------------------------------------------------------------------- */
let currentCourse   = null;
let monacoEditor    = null;
let liveServerOn    = false;
let previewDebounce = null;
let terminalMinimized = false;

/* --------------------------------------------------------------------------
   MAIN INIT
   -------------------------------------------------------------------------- */
function initEditorPage() {
    // Parse URL params
    const params  = new URLSearchParams(window.location.search);
    const courseId = params.get('course') || 'python';
    currentCourse = COURSE_CONFIG[courseId] || COURSE_CONFIG['python'];

    // Set toolbar info
    document.getElementById('toolbar-course-icon').textContent = currentCourse.icon;
    document.getElementById('toolbar-course-name').textContent = currentCourse.name;
    document.title = `${currentCourse.name} | DVEL Editor`;

    // Set editor tab
    const lang = currentCourse.language;
    document.getElementById('editor-tab-name').textContent = FILE_NAMES[lang] || 'file';
    document.getElementById('editor-tab-icon').textContent = FILE_ICONS[lang] || 'description';

    // Show/hide Live Server button
    const liveBtn = document.getElementById('btn-live-server');
    if (currentCourse.hasPreview) {
        liveBtn.style.display = 'flex';
    }

    // Initialize Monaco
    initMonaco(lang);

    // Wire up buttons
    document.getElementById('btn-run').addEventListener('click', handleRun);
    liveBtn.addEventListener('click', toggleLiveServer);
    document.getElementById('btn-clear-terminal-float').addEventListener('click', () => clearTerminal('float'));
    document.getElementById('btn-clear-terminal-split').addEventListener('click', () => clearTerminal('split'));
    document.getElementById('btn-toggle-terminal').addEventListener('click', toggleTerminalMinimize);
    document.getElementById('btn-refresh-preview').addEventListener('click', updatePreview);

    // Resize handle
    initResizeHandle();

    // Terminal welcome
    printWelcome();

    // Hologram background
    initHologram();
}

/* --------------------------------------------------------------------------
   MONACO EDITOR INITIALIZATION
   -------------------------------------------------------------------------- */
function initMonaco(language) {
    const container = document.getElementById('monaco-container');

    // Show loading state
    container.innerHTML = `
        <div class="monaco-loading">
            <span class="material-symbols-outlined">hourglass_top</span>
            Loading editor...
        </div>
    `;

    require.config({
        paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
    });

    require(['vs/editor/editor.main'], async function () {
        let starterCode = '// Start coding here\n';
        if (language === 'html') {
            starterCode = '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>';
        } else if (language === 'python') {
            starterCode = '# Write your Python code here\nprint("Hello World")\n';
        } else if (language === 'javascript') {
            starterCode = '// Write your JavaScript here\nconsole.log("Hello World");\n';
        }

        // Inject mock instructions
        const previewContent = document.querySelector('.preview-content');
        if (previewContent) {
            let instDiv = document.getElementById('course-instructions');
            if (!instDiv) {
                instDiv = document.createElement('div');
                instDiv.id = 'course-instructions';
                instDiv.style.padding = '20px';
                instDiv.style.color = '#fff';
                instDiv.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                previewContent.prepend(instDiv);
            }
            instDiv.innerHTML = `<h3>${currentCourse.name}</h3><p>Welcome to the interactive sandbox. Write your code in the editor and click Run to see the output.</p>`;
        }

        // Clear loading
        container.innerHTML = '';

        // Define custom theme
        monaco.editor.defineTheme('nebula-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment',    foreground: '5c6370', fontStyle: 'italic' },
                { token: 'keyword',    foreground: 'c678dd' },
                { token: 'string',     foreground: '98c379' },
                { token: 'number',     foreground: 'd19a66' },
                { token: 'type',       foreground: '61afef' },
                { token: 'function',   foreground: '61afef' },
                { token: 'variable',   foreground: 'e06c75' },
                { token: 'tag',        foreground: 'e06c75' },
                { token: 'attribute.name',  foreground: 'd19a66' },
                { token: 'attribute.value', foreground: '98c379' },
                { token: 'delimiter',  foreground: 'abb2bf' },
            ],
            colors: {
                'editor.background':                '#0d1017',
                'editor.foreground':                '#abb2bf',
                'editor.lineHighlightBackground':   '#1a1f2e',
                'editor.selectionBackground':       '#264f78',
                'editor.inactiveSelectionBackground':'#1d3b5a',
                'editorCursor.foreground':          '#00dcff',
                'editorLineNumber.foreground':      '#3b4048',
                'editorLineNumber.activeForeground':'#6b7280',
                'editor.selectionHighlightBackground':'#264f7833',
                'editorIndentGuide.background':     '#1e2230',
                'editorIndentGuide.activeBackground':'#3b4048',
                'editorWidget.background':          '#111621',
                'editorSuggestWidget.background':   '#111621',
                'editorSuggestWidget.border':       '#1e2230',
                'editorSuggestWidget.selectedBackground': '#1a2540',
                'list.hoverBackground':             '#1a2540',
                'scrollbarSlider.background':       'rgba(255,255,255,0.08)',
                'scrollbarSlider.hoverBackground':  'rgba(0,220,255,0.2)',
                'scrollbarSlider.activeBackground': 'rgba(0,220,255,0.3)',
                'minimap.background':               '#0d1017',
            }
        });

        // starterCode is now fetched from the backend (or defaults to '// Start coding here\\n')

        monacoEditor = monaco.editor.create(container, {
            value: starterCode,
            language: language,
            theme: 'nebula-dark',
            fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
            fontSize: 14,
            fontLigatures: true,
            lineHeight: 22,
            minimap: { enabled: true, maxColumn: 80, renderCharacters: false },
            automaticLayout: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true,
            },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            suggest: {
                showIcons: true,
                preview: true,
            },
            quickSuggestions: true,
            parameterHints: { enabled: true },
            formatOnPaste: true,
            renderLineHighlight: 'all',
            overviewRulerLanes: 0,
        });

        // Keyboard shortcut: Ctrl+Enter = Run
        monacoEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleRun);

        // Auto-update preview on code change (debounced)
        monacoEditor.onDidChangeModelContent(() => {
            if (liveServerOn && currentCourse.hasPreview) {
                clearTimeout(previewDebounce);
                previewDebounce = setTimeout(updatePreview, 500);
            }
        });
    });
}

/* --------------------------------------------------------------------------
   RUN BUTTON HANDLER
   -------------------------------------------------------------------------- */
function handleRun() {
    const code = monacoEditor ? monacoEditor.getValue() : '';
    const lang = currentCourse.language;

    if (lang === 'javascript') {
        runJavaScript(code);
    } else if (lang === 'html') {
        updatePreview();
        printToTerminal('Preview updated.', 'success');
    } else if (lang === 'python') {
        runPython(code);
    }
}

/* --------------------------------------------------------------------------
   JAVASCRIPT RUNNER
   Intercepts console.log, console.error, console.warn
   -------------------------------------------------------------------------- */
function runJavaScript(code) {
    printToTerminal('Running JavaScript...', 'system');

    // Capture console output
    const outputs = [];

    const fakeConsole = {
        log:   (...args) => outputs.push({ type: 'log',   msg: args.map(formatArg).join(' ') }),
        error: (...args) => outputs.push({ type: 'error', msg: args.map(formatArg).join(' ') }),
        warn:  (...args) => outputs.push({ type: 'warn',  msg: args.map(formatArg).join(' ') }),
        info:  (...args) => outputs.push({ type: 'info',  msg: args.map(formatArg).join(' ') }),
        clear: ()        => {},
    };

    try {
        const wrappedCode = `
            (function(console) {
                ${code}
            })
        `;
        const fn = new Function('console', `
            ${code}
        `);
        fn(fakeConsole);

        if (outputs.length === 0) {
            printToTerminal('Code executed successfully (no output).', 'system');
        } else {
            outputs.forEach(o => {
                const cls = o.type === 'error' ? 'error' : o.type === 'warn' ? 'warn' : o.type === 'info' ? 'info' : '';
                printToTerminal(o.msg, cls);
            });
        }
    } catch (err) {
        printToTerminal(`Error: ${err.message}`, 'error');
    }
}

function formatArg(arg) {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
        try { return JSON.stringify(arg, null, 2); } catch { return String(arg); }
    }
    return String(arg);
}

/* --------------------------------------------------------------------------
   PYTHON RUNNER (Placeholder)
   -------------------------------------------------------------------------- */
function runPython(code) {
    printToTerminal('Loading Python runtime...', 'system');

    // Simulate a basic print() parser for demo purposes
    setTimeout(() => {
        const lines = code.split('\n');
        let hasOutput = false;

        lines.forEach(line => {
            const trimmed = line.trim();
            // Skip comments and empty lines
            if (trimmed.startsWith('#') || trimmed === '') return;

            // Match print("...") or print('...')
            const printMatch = trimmed.match(/^print\s*\(\s*(?:"([^"]*?)"|'([^']*?)'|f"([^"]*?)"|f'([^']*?)')\s*\)$/);
            if (printMatch) {
                const output = printMatch[1] || printMatch[2] || printMatch[3] || printMatch[4] || '';
                printToTerminal(output, '');
                hasOutput = true;
                return;
            }

            // Match print(expression) — basic number/variable
            const printExprMatch = trimmed.match(/^print\s*\(\s*(.+?)\s*\)$/);
            if (printExprMatch) {
                try {
                    // Try to evaluate simple expressions
                    const result = Function('"use strict"; return (' + printExprMatch[1] + ')')();
                    printToTerminal(String(result), '');
                    hasOutput = true;
                } catch {
                    printToTerminal(printExprMatch[1], '');
                    hasOutput = true;
                }
                return;
            }
        });

        if (!hasOutput) {
            printToTerminal('Code executed. Note: Full Python runtime is not yet available in-browser. Only print() statements are evaluated in this demo.', 'system');
        }
    }, 600);
}

/* --------------------------------------------------------------------------
   LIVE SERVER TOGGLE
   -------------------------------------------------------------------------- */
function toggleLiveServer() {
    liveServerOn = !liveServerOn;
    const layout = document.getElementById('editor-layout');
    const btn    = document.getElementById('btn-live-server');

    if (liveServerOn) {
        layout.classList.add('split-mode');
        btn.classList.add('active');
        btn.querySelector('.material-symbols-outlined').textContent = 'stop_circle';
        // Initial preview update
        setTimeout(updatePreview, 100);
        printToTerminal('Live Server started. Preview will auto-update.', 'success');
    } else {
        layout.classList.remove('split-mode');
        btn.classList.remove('active');
        btn.querySelector('.material-symbols-outlined').textContent = 'dns';
        printToTerminal('Live Server stopped.', 'system');
    }
}

/* --------------------------------------------------------------------------
   PREVIEW UPDATE
   -------------------------------------------------------------------------- */
function updatePreview() {
    if (!monacoEditor) return;
    const code = monacoEditor.getValue();
    const iframe = document.getElementById('preview-iframe');

    if (currentCourse.language === 'html') {
        // Write HTML directly into the iframe
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(code);
        doc.close();
    } else if (currentCourse.language === 'javascript') {
        // Wrap JS in a basic HTML page
        const html = `<!DOCTYPE html>
<html>
<head><style>
    body { font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
    .output { background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 8px 0; font-family: monospace; white-space: pre-wrap; }
</style></head>
<body>
    <div id="output"></div>
    <script>
        const _out = document.getElementById('output');
        const _origLog = console.log;
        console.log = function(...args) {
            const div = document.createElement('div');
            div.className = 'output';
            div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
            _out.appendChild(div);
        };
        try {
            ${code}
        } catch(e) {
            const div = document.createElement('div');
            div.className = 'output';
            div.style.color = '#e53e3e';
            div.textContent = 'Error: ' + e.message;
            _out.appendChild(div);
        }
    <\/script>
</body>
</html>`;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }
}

/* --------------------------------------------------------------------------
   TERMINAL HELPERS
   -------------------------------------------------------------------------- */
function getActiveTerminalOutput() {
    if (liveServerOn) {
        return document.getElementById('terminal-output-split');
    }
    return document.getElementById('terminal-output-float');
}

function printToTerminal(message, type) {
    // Print to both terminals so switching doesn't lose output
    const targets = [
        document.getElementById('terminal-output-float'),
        document.getElementById('terminal-output-split'),
    ];

    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    targets.forEach(el => {
        const entry = document.createElement('div');
        entry.className = `terminal-entry ${type || ''}`;
        entry.innerHTML = `
            <span class="terminal-time">${time}</span>
            <span class="terminal-msg">${escapeHtml(message)}</span>
        `;
        el.appendChild(entry);
        el.scrollTop = el.scrollHeight;
    });
}

function clearTerminal(which) {
    if (which === 'float') {
        document.getElementById('terminal-output-float').innerHTML = '';
    } else if (which === 'split') {
        document.getElementById('terminal-output-split').innerHTML = '';
    } else {
        document.getElementById('terminal-output-float').innerHTML = '';
        document.getElementById('terminal-output-split').innerHTML = '';
    }
}

function printWelcome() {
    const targets = [
        document.getElementById('terminal-output-float'),
        document.getElementById('terminal-output-split'),
    ];

    targets.forEach(el => {
        const welcome = document.createElement('div');
        welcome.className = 'terminal-welcome';
        welcome.innerHTML = `<strong>DVEL Terminal</strong> -- ${currentCourse.name} -- Press Ctrl+Enter or click Run`;
        el.appendChild(welcome);
    });
}

function toggleTerminalMinimize() {
    const float = document.getElementById('terminal-float');
    const icon  = document.querySelector('#btn-toggle-terminal .material-symbols-outlined');
    terminalMinimized = !terminalMinimized;

    if (terminalMinimized) {
        float.classList.add('minimized');
        icon.textContent = 'expand_less';
    } else {
        float.classList.remove('minimized');
        icon.textContent = 'expand_more';
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* --------------------------------------------------------------------------
   RESIZE HANDLE — drag to resize editor/preview split
   -------------------------------------------------------------------------- */
function initResizeHandle() {
    const handle = document.getElementById('resize-handle');
    const layout = document.getElementById('editor-layout');
    const editor = document.getElementById('editor-panel');
    let isDragging = false;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        handle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const rect = layout.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.min(80, Math.max(25, (x / rect.width) * 100));
        editor.style.flex = `0 0 ${pct}%`;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Trigger Monaco relayout
        if (monacoEditor) monacoEditor.layout();
    });
}

/* --------------------------------------------------------------------------
   THREE.JS HOLOGRAM (Same as other pages, but very dim — opacity 0.15)
   The canvas opacity is set in CSS. Here we build the same hologram scene.
   -------------------------------------------------------------------------- */
function initHologram() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));
    const cL = new THREE.DirectionalLight(0x00dcff, 0.8);
    cL.position.set(4, 3, 5); scene.add(cL);
    const pL = new THREE.DirectionalLight(0xb060f0, 0.8);
    pL.position.set(-4, -2, 2); scene.add(pL);

    // Hologram group — centered
    const holo = new THREE.Group();
    holo.position.set(0, 0, -2);
    holo.scale.set(0.8, 0.8, 0.8);
    scene.add(holo);

    // Inner core
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.8, 1),
        new THREE.MeshPhysicalMaterial({
            color: 0xb060f0, emissive: 0x2a0555,
            roughness: 0.2, metalness: 0.8,
            wireframe: true, transparent: true, opacity: 0.55
        })
    );
    holo.add(core);

    // Outer shell
    const outer = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.4, 2),
        new THREE.MeshPhysicalMaterial({
            color: 0x00dcff, emissive: 0x002233,
            roughness: 0.3, metalness: 0.7,
            wireframe: true, transparent: true, opacity: 0.18
        })
    );
    holo.add(outer);

    // Orbital rings
    function makeRing(r, t, c, o) {
        const m = new THREE.Mesh(
            new THREE.TorusGeometry(r, t, 16, 100),
            new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o })
        );
        holo.add(m);
        return m;
    }
    const ring1 = makeRing(1.8, 0.012, 0x00dcff, 0.28);
    const ring2 = makeRing(2.1, 0.009, 0xb060f0, 0.22);
    ring2.rotation.x = Math.PI / 2;
    const ring3 = makeRing(2.4, 0.007, 0x2ecc71, 0.15);
    ring3.rotation.y = Math.PI / 4;

    // Particle field
    const N = 120, pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i += 3) {
        const ra = 2.5 + Math.random() * 1.4;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i]   = ra * Math.sin(ph) * Math.cos(th);
        pos[i+1] = ra * Math.sin(ph) * Math.sin(th);
        pos[i+2] = ra * Math.cos(ph);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dc = document.createElement("canvas");
    dc.width = dc.height = 16;
    const dx = dc.getContext("2d");
    const grd = dx.createRadialGradient(8, 8, 0, 8, 8, 8);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.3, "rgba(0,220,255,0.55)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    dx.fillStyle = grd;
    dx.fillRect(0, 0, 16, 16);
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({
        color: 0x00dcff, size: 0.09,
        map: new THREE.CanvasTexture(dc),
        transparent: true, opacity: 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending
    }));
    holo.add(particles);

    // Render loop
    const clock = new THREE.Clock();
    (function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        core.rotation.y  =  t * 0.11;
        core.rotation.x  =  t * 0.07;
        outer.rotation.y = -t * 0.05;
        outer.rotation.z =  t * 0.03;
        ring1.rotation.z =  t * 0.22;
        ring2.rotation.y =  t * 0.18;
        ring3.rotation.x =  t * 0.14;
        particles.rotation.y = t * 0.022;
        holo.position.y = Math.sin(t * 1.1) * 0.1;
        renderer.render(scene, camera);
    })();

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
}
