(function () {

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE DEFINITIONS
    // ─────────────────────────────────────────────────────────────────────────

    const STAGES = {
        intro:       "intro",
        high_school: "high_school",
        college:     "college",
        career:      "career",
        marriage:    "marriage",
        family:      "family",
        retirement:  "retirement",
        breakdown:   "breakdown"
    };

    const stageConfig = {

        [STAGES.intro]: {
            progress: 0,
            label: "",
            prompt: "What is your name?",
            options: [],
            tasks: []
        },

        [STAGES.high_school]: {
            progress: 1,
            label: "STAGE 1 — HIGH SCHOOL",
            prompt: "You are 17. Everyone is asking the same question.\n\n\"What will your major be?\"\n\nYou don't know yet. But you have to pick something.",
            subtext: "pick wisely. there are no second chances.",
            options: [
                { label: "Computer Science",   type: "advance", next: STAGES.college },
                { label: "Art",                type: "warn",    message: "That won't pay the bills." },
                { label: "I don't know yet",   type: "warn",    message: "That's not an option." },
                { label: "Philosophy",         type: "warn",    message: "What are you going to do with that?" },
                { label: "Take a gap year",     type: "warn",    message: "That's a mistake, you won't go back." },
            ],
            tasks: [
                { name: "Apply to college",  seconds: 90 },
                { name: "Resume",           seconds: 72 },
            ]
        },

        [STAGES.college]: {
            progress: 2,
            label: "STAGE 2 — COLLEGE",
            prompt: "You are 20. It's 3am. You are in the library.\n\nYou cannot remember why you chose this.\n\nBut you are too far in to stop now.",
            options: [
                { label: "Keep going",       type: "advance", next: STAGES.career },
                { label: "Take a gap year",  type: "warn",    message: "Do not waste what you've invested." },
                { label: "Switch majors",    type: "warn",    message: "You're almost done. Don't be irrational." },
            ],
            tasks: [
                { name: "Apply to 40+ internships",     seconds: 99 },
            ]
        },

        [STAGES.career]: {
            progress: 3,
            label: "STAGE 3 — CAREER",
            prompt: "You got the job.\n\nYou sit in the same chair for 8 hours.",
            subtext: "you are making progress. this is what progress looks like.",
            options: [
                { label: "Work harder",     type: "loop" },
                { label: "Be grateful",     type: "loop" },
            ],
            tasks: [
                { name: "Do your code work",            seconds: 45 },
                { name: "Clear your inbox",             seconds: 38 },
                { name: "Complete performance review",  seconds: 35 },
            ]
        },

        [STAGES.marriage]: {
            progress: 4,
            label: "STAGE 4 — MARRIAGE",
            prompt: "You are 26.\n\nPeople keep asking when you're getting married.\n\nYou have been with someone for three years. They are fine. You are fine.\n\nEveryone says this is the next step.",
            subtext: "the timeline requires this of you.",
            options: [
                { label: "Propose",                   type: "advance", next: STAGES.family },
                { label: "We're not ready",           type: "warn",    message: "The clock is ticking." },
                { label: "I want to be alone",        type: "warn",    message: "That's selfish. What about everyone else?" },
            ],
            tasks: [
                { name: "Book the venue (non-refundable)",  seconds: 65 },
                { name: "Invite 200 people you barely know", seconds: 55 },
                { name: "Smile for the photos",              seconds: 48 },
            ]
        },

        [STAGES.family]: {
            progress: 5,
            label: "STAGE 5 — FAMILY",
            prompt: "You have a child.\n\nYou love them. You are also exhausted.\n\nSomewhere in the last decade, you stopped asking what YOU wanted.\n\nYou can't remember when.",
            subtext: "this is what you worked for. isn't it?",
            options: [
                { label: "Keep providing",    type: "loop" },
                { label: "Stay the course",   type: "loop" },
            ],
            tasks: [
                { name: "Pay the mortgage",              seconds: 40 },
                { name: "Make it to the recital",        seconds: 33 },
                { name: "Call your parents back",        seconds: 30 },
                { name: "Remember who you used to be",   seconds: 25 },
            ]
        },

        [STAGES.retirement]: {
            progress: 6,
            label: "STAGE 6 — RETIREMENT",
            prompt: "You are 65.\n\nThey give you a cake. Everyone claps.\n\nOn Monday, there is nowhere you have to be.\n\nYou sit with the quiet.\n\nYou think: was this the only way?",
            subtext: "you made it. this is the destination.",
            options: [
                { label: "It was worth it",                 type: "loop" },
                { label: "I don't know",                    type: "breakdown_trigger" },
                { label: "There had to be another way",     type: "breakdown_trigger" },
            ],
            tasks: [
                { name: "Figure out what you enjoy",   seconds: 55 },
                { name: "Remember your old dreams",    seconds: 50 },
            ]
        },
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────────────────────

    const state = {
        currentStage:          STAGES.intro,
        progressStep:          0,
        loopClicks:            0,
        timerSpeedMultiplier:  1,
        tasks:                 [],
        completedTasks:        new Set(),
        activeTimer:           null,
        glitchStarted:         false,
        revealShown:           false,
        lastPointer:           { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        playerName:            "",
        decisions:             [],
        seenReadings:          new Set(),
        mentalStrain:          0,
        strainDecayTimer:      null
    };

    const readingAssignments = [
        {
            id: "hanson",
            stage: STAGES.college,
            title: "Reading Assignment 1: Temporal Replay",
            quote: "\"Almost all games and the pleasures associated with their play are reliant on the mechanic of repetition and replay.\"",
            cite: "Hanson, Matt. Game Time: Understanding Temporality in Video Games. Routledge, 2018.",
            tieIn: "If replay is central to play, then one timeline is a myth. Every loop in this game is proof that another life was always possible."
        },
        {
            id: "zagal_mateas",
            stage: STAGES.career,
            title: "Reading Assignment 2: Temporal Frames",
            quote: "\"A temporal frame is a set of events, along with the temporality induced by the relationships between those events.\"",
            cite: "Zagal, Jose P., and Michael Mateas. \"Time in Video Games: A Survey and Analysis.\" Simulation & Gaming 41.6 (2010): 844-868.",
            tieIn: "Pressure is engineered. Deadlines, checklists, and pace are not neutral clocks; they are systems that teach you to fear being behind."
        },
        {
            id: "pelletier",
            stage: STAGES.retirement,
            title: "Reading Assignment 3: Productivity Time",
            quote: "\"Much attention has been given, justifiably, to 'crunch'.\"",
            cite: "Pelletier, Caroline. \"How Time Flows Making Games.\" European Journal of Cultural Studies 27.2 (2024): 233-248.",
            tieIn: "When output becomes identity, exhaustion feels like failure. This game mirrors that logic so the player can feel how violent it is."
        }
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // DOM REFS
    // ─────────────────────────────────────────────────────────────────────────

    const app           = document.getElementById("app");
    const progressEl    = document.getElementById("progress");
    const stageLabelEl  = document.getElementById("stageLabel");
    const promptEl      = document.getElementById("prompt");
    const subtextEl     = document.getElementById("subtext");
    const optionsEl     = document.getElementById("options");
    const tasksEl       = document.getElementById("tasks");
    const taskListEl    = document.getElementById("taskList");
    const warningLayer  = document.getElementById("warningLayer");
    const taskModal     = document.getElementById("taskModal");
    const modalTitle    = document.getElementById("modalTitle");
    const modalBody     = document.getElementById("modalBody");
    const closeModalBtn = document.getElementById("closeModal");
    const strainWordsEl = document.getElementById("strainWords");
    const treeReveal    = document.getElementById("treeReveal");
    const treeCanvas    = document.getElementById("treeCanvas");
    const staticOverlay = document.getElementById("staticOverlay");

    // ─────────────────────────────────────────────────────────────────────────
    // PROGRESS BAR
    // ─────────────────────────────────────────────────────────────────────────

    const TOTAL_STEPS = 6;
    const TASK_MODAL_AUTOCLOSE_MS = 1800;
    // Testing toggle:
    // Set to true to require all objectives (including reading) before moving on.
    const REQUIRE_TASKS_TO_ADVANCE = false;

    function createProgressBar(step) {
        progressEl.innerHTML = "";
        for (let i = 0; i < TOTAL_STEPS; i++) {
            const dash = document.createElement("span");
            dash.className = "dash";
            dash.textContent = "--";
            progressEl.appendChild(dash);

            const node = document.createElement("span");
            node.className = "node" + (i < step ? " filled" : "");
            node.setAttribute("aria-hidden", "true");
            progressEl.appendChild(node);
        }
        const last = document.createElement("span");
        last.className = "dash";
        last.textContent = "--";
        progressEl.appendChild(last);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TASKS
    // ─────────────────────────────────────────────────────────────────────────

    function cloneTasks(stageTasks) {
        return (stageTasks || []).map(t => ({
            name: t.name,
            remaining: t.seconds,
            completed: false,
            noTimer: !!t.noTimer
        }));
    }

    function formatSeconds(total) {
        const s = Math.max(0, Math.floor(total));
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
    }

    function getReadingByStage(stage) {
        return readingAssignments.find(item => item.stage === stage) || null;
    }

    function renderTasks() {
        tasksEl.innerHTML = "";
        state.tasks.forEach(task => {
            const row = document.createElement("li");
            row.className = "task" + (task.completed ? " task-completed" : "");

            const check = document.createElement("span");
            check.className = "task-check";
            check.textContent = task.completed ? "✓" : "";

            const name = document.createElement("button");
            name.type = "button";
            name.className = "task-label";
            name.textContent = task.name;
            if (task.completed) {
                name.disabled = true;
            } else {
                name.addEventListener("click", () => openTaskSimulation(task.name));
            }

            row.appendChild(check);
            row.appendChild(name);

            if (!task.completed && !task.noTimer) {
                const timer = document.createElement("span");
                timer.className = "task-time";
                timer.textContent = formatSeconds(task.remaining);
                row.appendChild(timer);
            }
            tasksEl.appendChild(row);
        });
    }

    function completeTask(taskName) {
        state.tasks = state.tasks.map(t => t.name === taskName ? { ...t, completed: true } : t);
        state.completedTasks.add(taskName);
        renderTasks();
    }

    function allStageTasksCompleted() {
        if (!state.tasks.length) return true;
        return state.tasks.every(task => task.completed);
    }

    function pulseTaskListBlocked() {
        if (!taskListEl) return;
        taskListEl.classList.remove("tasklist-blocked");
        // Restart animation cleanly on repeated failed attempts.
        void taskListEl.offsetWidth;
        taskListEl.classList.add("tasklist-blocked");
        setTimeout(() => taskListEl.classList.remove("tasklist-blocked"), 700);
    }

    function tickTasks() {
        if (state.activeTimer) clearInterval(state.activeTimer);
        state.activeTimer = setInterval(() => {
            if (state.currentStage === STAGES.breakdown) return;
            state.tasks = state.tasks.map(t => ({
                ...t,
                remaining: t.completed ? t.remaining : Math.max(0, t.remaining - state.timerSpeedMultiplier)
            }));
            renderTasks();
        }, 1000);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRESS VISUAL
    // ─────────────────────────────────────────────────────────────────────────

    function setStressClass() {
        app.classList.remove("stress-1", "stress-2", "stress-3", "strain-1", "strain-2", "strain-3", "corner-words-on");
        const loopStages = [STAGES.career, STAGES.family, STAGES.retirement];
        if (loopStages.includes(state.currentStage)) {
            const level = Math.min(3, state.loopClicks);
            if (level > 0) app.classList.add(`stress-${level}`);
        }

        const strainLevel = Math.min(3, Math.floor(state.mentalStrain / 3));
        if (strainLevel > 0) {
            app.classList.add(`strain-${strainLevel}`);
            app.classList.add("corner-words-on");
        }
    }

    function scheduleStrainDecay() {
        if (state.strainDecayTimer) clearTimeout(state.strainDecayTimer);
        state.strainDecayTimer = setTimeout(() => {
            state.mentalStrain = Math.max(0, state.mentalStrain - 1);
            setStressClass();
            if (state.mentalStrain > 0) scheduleStrainDecay();
        }, 1800);
    }

    function spawnStrainWord(text) {
        if (!strainWordsEl || !text) return;
        const word = document.createElement("div");
        word.className = "strain-word";
        word.textContent = text;

        const x = Math.floor(8 + Math.random() * 78);
        const y = Math.floor(8 + Math.random() * 78);
        const rotation = Math.floor(-42 + Math.random() * 84);
        const scale = (0.8 + Math.random() * 1.9).toFixed(2);

        word.style.left = `${x}%`;
        word.style.top = `${y}%`;
        word.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
        strainWordsEl.appendChild(word);
        setTimeout(() => word.remove(), 1600);
    }

    function addMentalStrain(x, y, phrase) {
        state.mentalStrain = Math.min(12, state.mentalStrain + 1);
        setStressClass();
        scheduleStrainDecay();

        app.classList.add("micro-glitch");
        setTimeout(() => app.classList.remove("micro-glitch"), 220);
        spawnStrainWord(phrase);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // WARNINGS
    // ─────────────────────────────────────────────────────────────────────────

    function showWarning(message, x, y) {
        const w = document.createElement("div");
        w.className = "warning";
        w.textContent = message;
        w.style.left = `${Math.min(window.innerWidth - 20, Math.max(20, x + 10))}px`;
        w.style.top  = `${Math.min(window.innerHeight - 20, Math.max(20, y - 14))}px`;
        warningLayer.appendChild(w);
        setTimeout(() => w.remove(), 1600);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TYPEWRITER EFFECT
    // ─────────────────────────────────────────────────────────────────────────

    let typewriterTimer = null;

    function typewriterSet(el, text, speed = 28) {
        if (typewriterTimer) clearInterval(typewriterTimer);
        el.textContent = "";
        let i = 0;
        typewriterTimer = setInterval(() => {
            el.textContent = text.slice(0, i + 1);
            i++;
            if (i >= text.length) clearInterval(typewriterTimer);
        }, speed);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER STAGE
    // ─────────────────────────────────────────────────────────────────────────

    function renderStage() {
        const cfg = stageConfig[state.currentStage];
        if (!cfg) return;

        state.progressStep = cfg.progress;
        createProgressBar(state.progressStep);

        stageLabelEl.textContent = cfg.label || "";
        subtextEl.textContent    = cfg.subtext || "";

        // Typewriter on prompt
        typewriterSet(promptEl, cfg.prompt, 22);

        optionsEl.innerHTML = "";

        if (state.currentStage === STAGES.intro) {
            renderIntroInput();
            tasksEl.innerHTML = "";
            if (state.activeTimer) { clearInterval(state.activeTimer); state.activeTimer = null; }
            app.classList.remove("stress-1", "stress-2", "stress-3");
            return;
        }

        // Delay options appearing until typewriter is ~done
        const delay = Math.min(cfg.prompt.length * 22 + 400, 2800);
        setTimeout(() => {
            cfg.options.forEach(option => optionsEl.appendChild(createButton(option)));
        }, delay);

        state.tasks         = cloneTasks(cfg.tasks);
        state.completedTasks = new Set();
        const unlockedReading = getReadingByStage(state.currentStage);
        if (unlockedReading) {
            state.tasks.push({
                name: "Read assigned reading",
                remaining: 0,
                completed: false,
                noTimer: true
            });
        }
        renderTasks();
        tickTasks();
        setStressClass();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BUTTONS
    // ─────────────────────────────────────────────────────────────────────────

    function createButton(option) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        if (option.type === "advance") btn.classList.add("forced");

        btn.textContent = option.label;

        btn.addEventListener("click", event => {
            const x = event.clientX || state.lastPointer.x;
            const y = event.clientY || state.lastPointer.y;
            state.lastPointer = { x, y };

            if (option.type === "warn") {
                addMentalStrain(x, y, option.message || option.label);
                showWarning(option.message, x, y);
                return;
            }

            if (REQUIRE_TASKS_TO_ADVANCE && !allStageTasksCompleted()) {
                pulseTaskListBlocked();
                return;
            }

            if (option.type === "advance") {
                state.decisions.push(option.label);
                state.currentStage = option.next;
                state.progressStep = stageConfig[state.currentStage].progress;
                state.loopClicks = 0;
                state.timerSpeedMultiplier = 1;
                renderStage();
                return;
            }

            if (option.type === "loop") {
                state.decisions.push(option.label);
                state.loopClicks++;
                state.timerSpeedMultiplier = 1 + state.loopClicks * 0.5;
                setStressClass();

                // After enough loops, force player forward
                if (state.loopClicks >= 3) {
                    const loopExits = {
                        [STAGES.career]:     STAGES.marriage,
                        [STAGES.family]:     STAGES.retirement,
                        [STAGES.retirement]: null, // breakdown
                    };
                    const next = loopExits[state.currentStage];
                    if (next) {
                        // Flash a message then advance
                        showWarning("Time passes whether you choose or not.", x, y);
                        setTimeout(() => {
                            state.currentStage = next;
                            state.progressStep = stageConfig[next].progress;
                            state.loopClicks = 0;
                            state.timerSpeedMultiplier = 1;
                            renderStage();
                        }, 1200);
                    } else {
                        startGlitchSequence();
                    }
                } else {
                    // Subtly change the prompt text to feel more oppressive
                    const loopVariants = {
                        [STAGES.career]: [
                            "The quarterly review went well.\n\nYou sit in the same chair.",
                            "You got a raise.\n\nYou sit in the same chair.\n\nNothing has changed."
                        ],
                        [STAGES.family]: [
                            "Another year.\n\nYou provide. They grow.\n\nYou are glad. You think.",
                            "You have a routine now.\n\nYou cannot remember your life before the routine.\n\nYou are not sure you want to."
                        ],
                        [STAGES.retirement]: [
                            "You buy a boat.\n\nYou don't really like the boat.\n\nBut you're supposed to enjoy this.",
                        ]
                    };
                    const variants = loopVariants[state.currentStage];
                    if (variants && state.loopClicks <= variants.length) {
                        typewriterSet(promptEl, variants[state.loopClicks - 1], 20);
                    }
                    renderTasks();
                }
                return;
            }

            if (option.type === "breakdown_trigger") {
                state.decisions.push(option.label);
                startGlitchSequence();
            }
        });

        return btn;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTRO INPUT
    // ─────────────────────────────────────────────────────────────────────────

    function renderIntroInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "intro-form";
        wrapper.innerHTML = `
            <input id="playerNameInput" class="intro-input" type="text" maxlength="40" placeholder="your name here" autocomplete="off" />
            <button id="startLifeBtn" type="button" class="choice forced">[ BEGIN ]</button>
        `;
        optionsEl.appendChild(wrapper);

        const nameInput = document.getElementById("playerNameInput");
        const startBtn  = document.getElementById("startLifeBtn");

        nameInput.focus();

        nameInput.addEventListener("keydown", e => {
            if (e.key === "Enter") startBtn.click();
        });

        startBtn.addEventListener("click", () => {
            const name = nameInput.value.trim();
            if (!name) {
                showWarning("An identity is required to proceed.", state.lastPointer.x, state.lastPointer.y);
                return;
            }
            state.playerName   = name;
            state.currentStage = STAGES.high_school;
            state.progressStep = stageConfig[STAGES.high_school].progress;
            state.mentalStrain = 0;
            renderStage();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TASK SIMULATION MODALS
    // ─────────────────────────────────────────────────────────────────────────

    function createSimInput(label, value, fullWidth) {
        const wrap = document.createElement("div");
        wrap.className = "sim-field" + (fullWidth ? " full" : "");
        const lab = document.createElement("label");
        lab.className = "sim-label";
        lab.textContent = label;
        const input = document.createElement("input");
        input.className = "sim-input";
        input.value = value;
        wrap.appendChild(lab);
        wrap.appendChild(input);
        return wrap;
    }

    function createSimulationCard(title, fields, buttonText, successText, subtitle, onSubmit) {
        const card = document.createElement("section");
        card.className = "sim-box paper";

        if (subtitle) {
            const docHeader = document.createElement("div");
            docHeader.className = "doc-header";
            docHeader.innerHTML = `<strong>${subtitle}</strong><span class="doc-subtle">Confidential</span>`;
            card.appendChild(docHeader);
        }

        const heading = document.createElement("h4");
        heading.textContent = title;
        card.appendChild(heading);

        const divider = document.createElement("div");
        divider.className = "paper-line";
        card.appendChild(divider);

        const grid = document.createElement("div");
        grid.className = "sim-grid";
        fields.forEach(f => grid.appendChild(createSimInput(f.label, f.value, f.full)));
        card.appendChild(grid);

        const actions = document.createElement("div");
        actions.className = "sim-actions";
        const submit = document.createElement("button");
        submit.type = "button";
        submit.className = "sim-btn";
        submit.textContent = buttonText;
        actions.appendChild(submit);
        card.appendChild(actions);

        const note = document.createElement("p");
        note.className = "sim-note";
        card.appendChild(note);

        submit.addEventListener("click", () => {
            note.textContent = successText;
            if (typeof onSubmit === "function") onSubmit();
            setTimeout(() => closeTaskModal(), TASK_MODAL_AUTOCLOSE_MS);
        });

        return card;
    }

    function openTaskSimulation(taskName) {
        if (state.currentStage === STAGES.breakdown) return;

        modalTitle.textContent = `// ${taskName}`;
        modalBody.innerHTML = "";

        const displayName = state.playerName || "You";

        if (taskName === "Read assigned reading") {
            const entry = getReadingByStage(state.currentStage);
            if (!entry) {
                modalBody.appendChild(createSimulationCard(
                    "Reading Assignment",
                    [{ label: "Status", value: "No reading assigned", full: true }],
                    "Close",
                    "No action required.",
                    "Course Reader",
                    () => completeTask(taskName)
                ));
            } else {
                const readingCard = document.createElement("section");
                readingCard.className = "sim-box paper";
                readingCard.innerHTML = `
                    <div class="doc-header"><strong>${entry.title}</strong><span class="doc-subtle">Required</span></div>
                    <p class="citation-quote">${entry.quote}</p>
                    <p class="citation-title">${entry.cite}</p>
                    <p class="citation-body"><strong>Why this matters in this game:</strong> ${entry.tieIn}</p>
                    <div class="sim-actions">
                        <button id="completeReadingBtn" type="button" class="sim-btn">Mark As Read</button>
                    </div>
                    <p id="readingNote" class="sim-note"></p>
                `;
                modalBody.appendChild(readingCard);
                const completeBtn = document.getElementById("completeReadingBtn");
                const note = document.getElementById("readingNote");
                if (completeBtn) {
                    completeBtn.addEventListener("click", () => {
                        if (note) note.textContent = "Reading completed.";
                        completeTask(taskName);
                        setTimeout(() => closeTaskModal(), TASK_MODAL_AUTOCLOSE_MS);
                    });
                }
            }
        } else if (taskName === "Finish college applications" || taskName === "Apply to college") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:12px;">
                        <strong style="font-size:0.84rem;">Common Application - School List</strong>
                        <span style="font-size:0.75rem; color:#666;">Applicant: ${displayName}</span>
                    </div>

                    <p style="margin:0 0 10px; font-size:0.82rem;">List 3 colleges and star the one you committed to:</p>

                    <div style="display:grid; gap:8px; margin-bottom:10px;">
                        <div style="display:grid; grid-template-columns:28px 1fr; gap:8px; align-items:center;">
                            <label style="font-size:1rem;">
                                <input type="radio" name="commitSchool" value="1" />
                            </label>
                            <input id="collegeInput1" type="text" placeholder="College #1" style="width:100%; padding:7px 8px; border:1px solid #aaa; font-size:0.84rem;">
                        </div>
                        <div style="display:grid; grid-template-columns:28px 1fr; gap:8px; align-items:center;">
                            <label style="font-size:1rem;">
                                <input type="radio" name="commitSchool" value="2" />
                            </label>
                            <input id="collegeInput2" type="text" placeholder="College #2" style="width:100%; padding:7px 8px; border:1px solid #aaa; font-size:0.84rem;">
                        </div>
                        <div style="display:grid; grid-template-columns:28px 1fr; gap:8px; align-items:center;">
                            <label style="font-size:1rem;">
                                <input type="radio" name="commitSchool" value="3" />
                            </label>
                            <input id="collegeInput3" type="text" placeholder="College #3" style="width:100%; padding:7px 8px; border:1px solid #aaa; font-size:0.84rem;">
                        </div>
                    </div>
                    <p style="margin:0; font-size:0.78rem; color:#555;">Select one radio button to mark your committed school.</p>
                </div>
            `;
            modalBody.appendChild(card);

            const submitCard = document.createElement("section");
            submitCard.className = "sim-box paper";
            submitCard.innerHTML = `
                <div class="doc-header"><strong>Application Submission</strong><span class="doc-subtle">Common App Portal</span></div>
                <div class="sim-actions">
                    <button id="submitCollegeAppBtn" type="button" class="sim-btn">Submit Application</button>
                </div>
                <p id="collegeSubmitNote" class="sim-note"></p>
            `;
            modalBody.appendChild(submitCard);

            const submitBtn = document.getElementById("submitCollegeAppBtn");
            const note = document.getElementById("collegeSubmitNote");
            if (submitBtn) {
                submitBtn.addEventListener("click", () => {
                    const school1 = (document.getElementById("collegeInput1")?.value || "").trim();
                    const school2 = (document.getElementById("collegeInput2")?.value || "").trim();
                    const school3 = (document.getElementById("collegeInput3")?.value || "").trim();
                    const committed = modalBody.querySelector('input[name="commitSchool"]:checked');

                    if (!school1 || !school2 || !school3 || !committed) {
                        showWarning("Required: list 3 colleges and mark one committed school.", window.innerWidth / 2, window.innerHeight / 2);
                        if (note) note.textContent = "Required fields missing.";
                        return;
                    }

                    if (note) note.textContent = "Application submitted. Status: Pending. You will hear back in 4-6 weeks.";
                    completeTask(taskName);
                    setTimeout(() => closeTaskModal(), TASK_MODAL_AUTOCLOSE_MS);
                });
            }
        } else if (taskName === "Study for the SATs") {
            modalBody.appendChild(createSimulationCard(
                "SAT Prep Dashboard",
                [
                    { label: "Student", value: displayName },
                    { label: "Target Score", value: "1500+" },
                    { label: "Practice Tests Completed", value: "7 of 10" },
                    { label: "Estimated Score", value: "1380 — Keep going." },
                ],
                "Complete Practice Test",
                "Test completed. Score logged. Try again tomorrow.",
                "College Board Prep",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Resume") {
            const resume = document.createElement("section");
            resume.className = "sim-box paper";
            resume.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="background:#f3f3f3; border:1px solid #cfcfcf; padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                            <h2 style="margin:0; font-size:1.5rem; letter-spacing:0.2px;">${displayName}</h2>
                            <div style="font-size:0.72rem; color:#1453b6; line-height:1.5; text-align:right;">
                                <div style="filter:blur(1px);">(###) ###-####</div>
                                <div style="text-decoration:underline;">██████@████.edu</div>
                                <div style="text-decoration:underline;">linkedin.com/in/██████</div>
                                <div style="text-decoration:underline;">github.com/██████</div>
                            </div>
                        </div>

                        <div style="margin-top:6px; border-top:2px solid #888; padding-top:6px;">
                            <div style="color:#1f66b4; font-size:0.9rem; font-weight:800; letter-spacing:0.6px;">EDUCATION</div>
                            <p style="margin:4px 0; font-size:0.8rem;"><strong>University of California: San Diego</strong> - B.S. in Computer Science</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• GPA: 3.48 | Relevant Coursework: Data Structures, Systems, OOP</p>
                        </div>

                        <div style="margin-top:8px; border-top:2px solid #888; padding-top:6px;">
                            <div style="color:#1f66b4; font-size:0.9rem; font-weight:800; letter-spacing:0.6px;">EXPERIENCE</div>
                            <p style="margin:4px 0; font-size:0.8rem;"><strong>Software Engineering Intern</strong> - Remote</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Built production-facing features for location-based web app</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Integrated external APIs and improved search discoverability</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Collaborated in Agile team to deliver user-facing improvements</p>
                        </div>
                    </div>
                    <p style="margin:8px 0 0; font-size:0.74rem; color:#666;">Personal identifiers intentionally redacted/blurred.</p>
                </div>
            `;
            modalBody.appendChild(resume);
            modalBody.appendChild(createSimulationCard(
                "Resume Upload",
                [{ label: "File", value: "resume.pdf", full: true }],
                "Upload Resume",
                "Resume uploaded successfully.",
                "Applicant Profile",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Pick a \"practical\" major") {
            modalBody.appendChild(createSimulationCard(
                "Major Declaration Form",
                [
                    { label: "Student Name", value: displayName },
                    { label: "First Choice", value: "Computer Science" },
                    { label: "Backup", value: "Business Administration" },
                    { label: "What you actually wanted", value: "", full: true },
                ],
                "Declare Major",
                "Major declared. This is now on your permanent record.",
                "Registrar's Office",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Apply to 40+ internships") {
            const form = document.createElement("section");
            form.className = "sim-box paper";
            form.innerHTML = `
                <div style="font-family:Arial,sans-serif; font-size:0.88rem; color:#111;">
                    <div style="border-bottom:1px solid #ddd; margin-bottom:12px; padding-bottom:8px; font-weight:bold; font-size:0.8rem; color:#444; text-transform:uppercase; letter-spacing:0.5px;">Internship Application #27 of 40</div>
                    <label style="display:block; margin-bottom:3px; font-size:0.75rem; font-weight:bold; color:#333;">Full Name</label>
                    <input type="text" value="${displayName}" style="width:100%; padding:6px 8px; border:1px solid #aaa; margin-bottom:8px; font-size:0.85rem;">
                    <label style="display:block; margin-bottom:3px; font-size:0.75rem; font-weight:bold; color:#333;">Position</label>
                    <select style="width:100%; padding:6px 8px; border:1px solid #aaa; margin-bottom:8px; font-size:0.85rem; background:#fff;">
                        <option>Software Engineering Intern</option>
                        <option>Data Science Intern</option>
                        <option>Product Management Intern</option>
                    </select>
                    <label style="display:block; margin-bottom:3px; font-size:0.75rem; font-weight:bold; color:#333;">Cover Letter</label>
                    <textarea style="width:100%; height:80px; padding:6px 8px; border:1px solid #aaa; font-family:'Times New Roman',serif; font-size:0.82rem; resize:none;">Dear Hiring Manager, I am a highly motivated student with a passion for...</textarea>
                </div>
            `;
            modalBody.appendChild(form);

            const resume = document.createElement("section");
            resume.className = "sim-box paper";
            resume.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="background:#f3f3f3; border:1px solid #cfcfcf; padding:12px;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                            <h2 style="margin:0; font-size:1.5rem; letter-spacing:0.2px;">${displayName}</h2>
                            <div style="font-size:0.72rem; color:#1453b6; line-height:1.5; text-align:right;">
                                <div style="filter:blur(1px);">(###) ###-####</div>
                                <div style="text-decoration:underline;">██████@████.edu</div>
                                <div style="text-decoration:underline;">linkedin.com/in/██████</div>
                                <div style="text-decoration:underline;">github.com/██████</div>
                            </div>
                        </div>

                        <div style="margin-top:6px; border-top:2px solid #888; padding-top:6px;">
                            <div style="color:#1f66b4; font-size:0.9rem; font-weight:800; letter-spacing:0.6px;">EDUCATION</div>
                            <p style="margin:4px 0; font-size:0.8rem;"><strong>University of California: San Diego</strong> - B.S. in Computer Science</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• GPA: 3.48 | Relevant Coursework: Data Structures, Systems, OOP</p>
                        </div>

                        <div style="margin-top:8px; border-top:2px solid #888; padding-top:6px;">
                            <div style="color:#1f66b4; font-size:0.9rem; font-weight:800; letter-spacing:0.6px;">EXPERIENCE</div>
                            <p style="margin:4px 0; font-size:0.8rem;"><strong>Software Engineering Intern</strong> - Remote</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Built production-facing features for location-based web app</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Integrated external APIs and improved search discoverability</p>
                            <p style="margin:2px 0; font-size:0.78rem; color:#444;">• Collaborated in Agile team to deliver user-facing improvements</p>
                        </div>
                    </div>
                    <p style="margin:8px 0 0; font-size:0.74rem; color:#666;">Personal identifiers intentionally redacted/blurred.</p>
                </div>
            `;
            modalBody.appendChild(resume);

            const terminal = document.createElement("section");
            terminal.className = "sim-box paper";
            terminal.innerHTML = `
                <div style="background:#0b0b0b; color:#d8f9d8; border:1px solid #2d2d2d; padding:10px; font-family:Menlo,Consolas,monospace;">
                    <div style="font-size:0.74rem; color:#86ff86; margin-bottom:7px;">Online Assessment Terminal</div>
                    <div style="font-size:0.82rem; margin-bottom:6px;">$ python3</div>
                    <div style="font-size:0.82rem; margin-bottom:6px;">>>> print("Hello World")</div>
                    <div style="font-size:0.82rem; color:#ffffff; margin-bottom:4px;">Hello World</div>
                    <div style="font-size:0.74rem; color:#a7a7a7;">Result: Test case 1/1 passed.</div>
                </div>
            `;
            modalBody.appendChild(terminal);

            modalBody.appendChild(createSimulationCard(
                "Submission Confirmation",
                [{ label: "Application ID", value: "INT-2024-0027", full: true }],
                "Submit Application",
                "Application submitted. You will likely not hear back.",
                "Hiring Portal",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Do your code work") {
            const codeDays = [
                {
                    label: "Day 1",
                    expected: 'print("Hello World!")',
                    output: "Hello World!"
                },
                {
                    label: "Day 2",
                    expected: `print("Hello ${displayName}")`,
                    output: `Hello ${displayName}`
                },
                {
                    label: "Day 3",
                    expected: `print("Goodbye ${displayName}")`,
                    output: `Goodbye ${displayName}`
                }
            ];
            let dayIndex = 0;

            const terminal = document.createElement("section");
            terminal.className = "sim-box paper";
            terminal.innerHTML = `
                <div style="background:#0b0b0b; color:#d8f9d8; border:1px solid #2d2d2d; padding:10px; font-family:Menlo,Consolas,monospace;">
                    <div style="font-size:0.74rem; color:#86ff86; margin-bottom:7px;">Engineering Terminal - Daily Deliverable</div>
                    <div style="font-size:0.82rem; color:#bdbdbd; margin-bottom:6px;" id="codeDayLabel">${codeDays[0].label} task: type exactly <code style="color:#fff;">${codeDays[0].expected}</code></div>
                    <div style="font-size:0.82rem; margin-bottom:6px;">$ python3</div>
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                        <span style="font-size:0.82rem;">>>></span>
                        <input id="codeInputLine" type="text" placeholder='print("Hello World!")' style="flex:1; background:#111; color:#fff; border:1px solid #444; padding:6px 8px; font-family:Menlo,Consolas,monospace; font-size:0.82rem;">
                    </div>
                    <button id="runCodeBtn" type="button" class="sim-btn">Run</button>
                    <p id="codeResultNote" style="margin:8px 0 0; font-size:0.8rem; color:#d8f9d8; min-height:1.2em;"></p>
                </div>
            `;
            modalBody.appendChild(terminal);

            const input = document.getElementById("codeInputLine");
            const runBtn = document.getElementById("runCodeBtn");
            const note = document.getElementById("codeResultNote");
            const dayLabel = document.getElementById("codeDayLabel");

            function runCheck() {
                const typed = (input?.value || "").trim();
                const currentDay = codeDays[dayIndex];
                if (typed !== currentDay.expected) {
                    if (note) note.textContent = `Syntax check failed. Expected: ${currentDay.expected}`;
                    return;
                }

                if (note) note.textContent = `${currentDay.output}  [pass]`;

                dayIndex++;
                if (dayIndex < codeDays.length) {
                    const nextDay = codeDays[dayIndex];
                    if (dayLabel) {
                        dayLabel.innerHTML = `${nextDay.label} task: type exactly <code style="color:#fff;">${nextDay.expected}</code>`;
                    }
                    if (input) {
                        input.value = "";
                        input.placeholder = nextDay.expected;
                        input.focus();
                    }
                    return;
                }

                completeTask(taskName);
                setTimeout(() => closeTaskModal(), TASK_MODAL_AUTOCLOSE_MS);
            }

            if (runBtn) runBtn.addEventListener("click", runCheck);
            if (input) {
                input.addEventListener("keydown", e => {
                    if (e.key === "Enter") runCheck();
                });
            }
        } else if (taskName === "Build resume" || taskName === "Finish the capstone project") {
            modalBody.appendChild(createSimulationCard(
                "Capstone Project Submission",
                [
                    { label: "Project Title", value: "Automated Workflow Optimization System" },
                    { label: "Student", value: displayName },
                    { label: "Grade Required to Pass", value: "C or above" },
                    { label: "Hours Spent", value: "200+", full: true },
                ],
                "Submit Project",
                "Submitted. You passed. You feel nothing.",
                "Academic Portal",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Network (pretend to be fine)") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Career Networking Event</div>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">Elevator pitch</label>
                    <textarea style="width:100%; height:60px; border:1px solid #aaa; padding:6px 8px; margin-bottom:8px; font-size:0.82rem;">Hi, I'm ${displayName}. I'm passionate about solving meaningful problems with technology...</textarea>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">People to follow up with</label>
                    <div style="border:1px solid #ddd; background:#fff; padding:8px; font-size:0.82rem;">
                        <p style="margin:0 0 4px;">- Senior Engineer, Product Team</p>
                        <p style="margin:0 0 4px;">- Recruiter, Summer Program</p>
                        <p style="margin:0;">- Alumni Mentor, Startup Founder</p>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Follow-Up Tracker",
                [{ label: "LinkedIn Requests Sent", value: "3", full: true }],
                "Log Contacts",
                "Connections saved. Keep the momentum going.",
                "Career Services Portal",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Hit quarterly targets") {
            modalBody.appendChild(createSimulationCard(
                "Q3 Performance Dashboard",
                [
                    { label: "Employee",  value: displayName },
                    { label: "Target",    value: "115% of quota" },
                    { label: "Actual",    value: "112% of quota" },
                    { label: "Manager's Comment", value: "Almost there. Push harder next quarter.", full: true },
                ],
                "Acknowledge & Submit",
                "Review submitted. Keep up the good work.",
                "Performance Management System",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Clear your inbox") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:10px;">
                        <strong style="font-size:0.85rem;">Inbox</strong>
                        <span style="font-size:0.75rem; color:#666;">43 unread</span>
                    </div>
                    <div style="font-size:0.8rem; border:1px solid #ddd; background:#fff;">
                        <div style="display:grid; grid-template-columns:150px 1fr 90px; padding:7px 8px; border-bottom:1px solid #eee;">
                            <strong>From</strong><strong>Subject</strong><strong>Time</strong>
                        </div>
                        <div style="display:grid; grid-template-columns:150px 1fr 90px; padding:7px 8px; border-bottom:1px solid #f1f1f1;"><span>Manager</span><span>Quick update before EOD</span><span>9:07 AM</span></div>
                        <div style="display:grid; grid-template-columns:150px 1fr 90px; padding:7px 8px; border-bottom:1px solid #f1f1f1;"><span>HR</span><span>Mandatory compliance reminder</span><span>8:41 AM</span></div>
                        <div style="display:grid; grid-template-columns:150px 1fr 90px; padding:7px 8px; border-bottom:1px solid #f1f1f1;"><span>Recruiter</span><span>Catching up</span><span>Yesterday</span></div>
                        <div style="display:grid; grid-template-columns:150px 1fr 90px; padding:7px 8px;"><span>Calendar Bot</span><span>Updated meeting location</span><span>Yesterday</span></div>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Mailbox Actions",
                [{ label: "Bulk Action", value: "Archive all unread", full: true }],
                "Mark All As Read",
                "Inbox zero achieved. New messages arriving...",
                "Mail Client",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Complete performance review") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Annual Self-Assessment</div>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">What were your biggest accomplishments?</label>
                    <textarea style="width:100%; height:62px; border:1px solid #aaa; padding:6px 8px; margin-bottom:8px; font-size:0.82rem;">Exceeded sprint velocity goals and supported cross-team launches.</textarea>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">Areas for growth</label>
                    <textarea style="width:100%; height:52px; border:1px solid #aaa; padding:6px 8px; margin-bottom:8px; font-size:0.82rem;">Improve stakeholder communication and strategic ownership.</textarea>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">Rate your overall performance</label>
                    <select style="width:100%; border:1px solid #aaa; padding:6px 8px; font-size:0.82rem;">
                        <option>Exceeds Expectations</option>
                        <option selected>Meets Expectations</option>
                        <option>Needs Improvement</option>
                    </select>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Submission",
                [{ label: "Status", value: "Pending manager calibration", full: true }],
                "Submit Review",
                "Review submitted. Awaiting ranking cycle.",
                "People Ops System",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Book the venue (non-refundable)") {
            modalBody.appendChild(createSimulationCard(
                "Venue Reservation",
                [
                    { label: "Venue Name", value: "The Grand Ballroom" },
                    { label: "Date", value: "A Saturday, next June" },
                    { label: "Guest Count", value: "200" },
                    { label: "Deposit (Non-Refundable)", value: "$4,500", full: true },
                ],
                "Confirm Booking",
                "Booking confirmed. There is no going back.",
                "Events Booking System",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Invite 200 people you barely know") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:10px;">
                        <strong style="font-size:0.85rem;">Guest List Manager</strong>
                        <span style="font-size:0.75rem; color:#666;">198 / 200 invited</span>
                    </div>
                    <div style="font-size:0.8rem; border:1px solid #ddd; background:#fff; padding:8px;">
                        <p style="margin:0 0 6px;">Family Friends (52)</p>
                        <p style="margin:0 0 6px;">Coworkers (38)</p>
                        <p style="margin:0 0 6px;">Parents' Colleagues (44)</p>
                        <p style="margin:0 0 6px;">People You Met Once (64)</p>
                        <p style="margin:8px 0 0; color:#555;">Auto-suggestion: Add 2 more to avoid seating gaps.</p>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Invitation Batch",
                [{ label: "Delivery Method", value: "Email + Printed Cards", full: true }],
                "Send Invitations",
                "Invitations sent. RSVP tracking enabled.",
                "Wedding Planner Suite",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Smile for the photos") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Photography Session Checklist</div>
                    <div style="display:grid; gap:6px; font-size:0.82rem;">
                        <label><input type="checkbox" checked> Couple portraits complete</label>
                        <label><input type="checkbox" checked> Family portraits complete</label>
                        <label><input type="checkbox"> Candid laughter shots</label>
                        <label><input type="checkbox"> First dance close-up</label>
                    </div>
                    <p style="margin-top:10px; font-size:0.8rem; color:#444;">Photographer note: \"Relax your jaw and keep smiling naturally.\"</p>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Session Wrap",
                [{ label: "Album Package", value: "Premium (450 edited photos)", full: true }],
                "Finish Session",
                "Session complete. Preview gallery in 4-6 weeks.",
                "Studio Portal",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Pay the mortgage") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Online Banking</div>
                    <div style="border:1px solid #ddd; background:#fff; padding:10px; font-size:0.82rem;">
                        <p style="margin:0 0 6px;"><strong>Current Balance:</strong> $3,842.17</p>
                        <p style="margin:0 0 6px;"><strong>Mortgage Due:</strong> $2,416.00</p>
                        <p style="margin:0 0 6px;"><strong>Due Date:</strong> Today</p>
                        <p style="margin:0;"><strong>Remaining After Payment:</strong> $1,426.17</p>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Payment Authorization",
                [{ label: "Transfer", value: "Checking -> Home Loan", full: true }],
                "Pay Now",
                "Payment submitted. Confirmation #: MTG-94031.",
                "Bank Secure Portal",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Make it to the recital") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Calendar Coordination</div>
                    <div style="border:1px solid #ddd; background:#fff; padding:10px; font-size:0.82rem;">
                        <p style="margin:0 0 6px;"><strong>3:30 PM</strong> Sprint demo (work)</p>
                        <p style="margin:0 0 6px;"><strong>5:00 PM</strong> Commute across town</p>
                        <p style="margin:0 0 6px;"><strong>6:00 PM</strong> Piano recital</p>
                        <p style="margin:0;"><strong>Conflict:</strong> Traffic delay warning (+22 min)</p>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Decision",
                [{ label: "Action", value: "Leave meeting early", full: true }],
                "Commit",
                "Calendar updated. You might make it on time.",
                "Family Calendar App",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Call your parents back") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Phone</div>
                    <div style="border:1px solid #ddd; background:#fff; padding:10px; font-size:0.82rem;">
                        <p style="margin:0 0 6px;"><strong>Missed Calls:</strong> Mom (2), Dad (1)</p>
                        <p style="margin:0 0 6px;"><strong>Last voicemail:</strong> \"No rush, just wanted to hear your voice.\"</p>
                        <p style="margin:0;"><strong>Unread texts:</strong> 4</p>
                    </div>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Call Back",
                [{ label: "Contact", value: "Family", full: true }],
                "Dial",
                "Connected. They ask if you're eating enough.",
                "Phone App",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Figure out what you enjoy") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:Arial,sans-serif; color:#111;">
                    <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:1px; color:#666; margin-bottom:10px;">Retirement Planning Worksheet</div>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">Activities you are curious about</label>
                    <textarea style="width:100%; height:70px; border:1px solid #aaa; padding:6px 8px; margin-bottom:8px; font-size:0.82rem;">Painting, hiking, language classes, volunteering...</textarea>
                    <label style="display:block; font-size:0.75rem; font-weight:bold; margin-bottom:4px;">What did you enjoy before work took over?</label>
                    <textarea style="width:100%; height:58px; border:1px solid #aaa; padding:6px 8px; font-size:0.82rem;"></textarea>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "New Routine Setup",
                [{ label: "Weekly Plan", value: "Drafted", full: true }],
                "Save",
                "Saved. This is a beginning, not a conclusion.",
                "Life Planner",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Remember who you used to be") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:'Times New Roman',serif; color:#111; font-size:0.9rem; line-height:1.7;">
                    <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:#888; margin-bottom:10px; font-family:Arial,sans-serif;">[ MEMORY LOG — CORRUPTED ]</div>
                    <p style="filter:blur(2px); margin-bottom:8px;">When you were 12, you wanted to be ████████████. You would spend hours ████████████ and you never thought about money or timelines or what anyone else thought.</p>
                    <p style="margin-bottom:8px;">You were good at it. You were <em>genuinely good at it.</em></p>
                    <p style="filter:blur(1.5px);">Somewhere around 17, someone told you that wasn't ████████████. You believed them.</p>
                    <p style="margin-top:12px; color:#555; font-size:0.8rem; font-style:italic;">This memory cannot be fully recovered.</p>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Memory Archive",
                [{ label: "Status", value: "Partially Corrupted", full: true }],
                "Close & Continue",
                "Memory filed. Routine resumed.",
                "Internal System",
                () => completeTask(taskName)
            ));
        } else if (taskName === "Remember your old dreams") {
            const card = document.createElement("section");
            card.className = "sim-box paper";
            card.innerHTML = `
                <div style="font-family:'Times New Roman',serif; color:#111; font-size:0.9rem; line-height:1.8;">
                    <div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; color:#888; margin-bottom:12px; font-family:Arial,sans-serif;">[ RETIREMENT REFLECTION FORM ]</div>
                    <p style="margin-bottom:10px;">You sit at the kitchen table with a cup of coffee.</p>
                    <p style="margin-bottom:10px;">You think about the 17-year-old who chose this path. They didn't really choose it. They just picked the option that wasn't punished.</p>
                    <p style="margin-bottom:10px; font-weight:bold;">Was this the life you wanted?</p>
                    <p style="margin-bottom:10px; filter:blur(1px);">You cannot fully answer that question. The person who would have known the answer is not someone you ever got to be.</p>
                    <p style="color:#888; font-size:0.82rem; font-style:italic;">But it's not too late to ask the question.</p>
                </div>
            `;
            modalBody.appendChild(card);
            modalBody.appendChild(createSimulationCard(
                "Reflection Checkpoint",
                [{ label: "Age", value: "65" }, { label: "Status", value: "Retired" }],
                "I've read this",
                "Noted.",
                "Life Review System",
                () => completeTask(taskName)
            ));
        } else {
            // Generic fallback
            modalBody.appendChild(createSimulationCard(
                "Task Checkpoint",
                [
                    { label: "Task",      value: taskName, full: true },
                    { label: "Status",    value: "In Progress" },
                    { label: "Priority",  value: "High" },
                    { label: "Due",       value: "Yesterday", full: true },
                ],
                "Mark Complete",
                "Completed. Moving on.",
                "Daily Planner",
                () => completeTask(taskName)
            ));
        }

        taskModal.classList.add("open");
        taskModal.setAttribute("aria-hidden", "false");
    }

    function closeTaskModal() {
        taskModal.classList.remove("open");
        taskModal.setAttribute("aria-hidden", "true");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GLITCH & TREE REVEAL
    // ─────────────────────────────────────────────────────────────────────────

    function startGlitchSequence() {
        if (state.glitchStarted) return;
        state.glitchStarted = true;
        state.currentStage  = STAGES.breakdown;
        state.progressStep  = TOTAL_STEPS;
        createProgressBar(state.progressStep);

        if (state.activeTimer) { clearInterval(state.activeTimer); state.activeTimer = null; }
        closeTaskModal();

        // Show one last message before breaking
        typewriterSet(promptEl, "...", 80);
        setTimeout(() => typewriterSet(promptEl, ". . .", 150), 600);

        staticOverlay.style.opacity = "0.3";

        app.classList.add("glitching");
        setTimeout(() => app.classList.add("flashing"), 600);
        setTimeout(() => app.classList.add("shatter"), 1300);
        setTimeout(() => {
            app.classList.remove("glitching", "flashing");
            app.classList.add("hidden-ui");
            staticOverlay.style.opacity = "0";
            showTreeReveal();
        }, 2400);
    }

    function showTreeReveal() {
        if (state.revealShown) return;
        state.revealShown = true;
        buildTreeSvg();
        treeReveal.classList.add("visible");
        treeReveal.setAttribute("aria-hidden", "false");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TREE SVG — recursive, organic, off-screen bleeding
    // ─────────────────────────────────────────────────────────────────────────

    function buildTreeSvg() {
        treeCanvas.innerHTML = "";
        const ns = "http://www.w3.org/2000/svg";

        function mkLine(x1, y1, x2, y2, width, opacity) {
            const el = document.createElementNS(ns, "line");
            el.setAttribute("x1", x1);   el.setAttribute("y1", y1);
            el.setAttribute("x2", x2);   el.setAttribute("y2", y2);
            el.setAttribute("stroke", "#94a3b8");
            el.setAttribute("stroke-width", width);
            el.setAttribute("stroke-linecap", "round");
            el.setAttribute("opacity", opacity);
            el.setAttribute("fill", "none");
            return el;
        }

        function mkCircle(cx, cy, r, color) {
            const el = document.createElementNS(ns, "circle");
            el.setAttribute("cx", cx); el.setAttribute("cy", cy); el.setAttribute("r", r);
            el.setAttribute("fill", color || "#3b82f6");
            return el;
        }

        // Seeded PRNG — same tree every time
        let _seed = 0xdeadbeef;
        function rand() {
            _seed ^= _seed << 13;
            _seed ^= _seed >> 17;
            _seed ^= _seed << 5;
            return (_seed >>> 0) / 0xffffffff;
        }
        function jitter(amount) { return (rand() - 0.5) * 2 * amount; }

        // Recursive branch
        function branch(g, x, y, angle, length, width, opacity, depth) {
            if (depth <= 0 || opacity < 0.07 || width < 0.15) return;

            const endX = x + Math.cos(angle) * length;
            const endY = y + Math.sin(angle) * length;
            g.appendChild(mkLine(x, y, endX, endY, width.toFixed(2), opacity.toFixed(3)));

            const childCount = rand() < 0.22 ? 3 : 2;
            const spreadBase = 0.38 + rand() * 0.42; // wide variation

            for (let i = 0; i < childCount; i++) {
                let side;
                if (childCount === 2) side = i === 0 ? -1 : 1;
                else side = i - 1;

                const angleOffset  = side * spreadBase + jitter(0.22);
                const childLength  = length  * (0.58 + rand() * 0.26);
                const childWidth   = width   * (0.65 + rand() * 0.18);
                const childOpacity = opacity * (0.75 + rand() * 0.16);

                branch(g, endX, endY, angle + angleOffset, childLength, childWidth, childOpacity, depth - 1);
            }
        }

        // SVG root
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("viewBox", "0 0 1000 700");
        svg.setAttribute("preserveAspectRatio", "xMidYMid slice");

        const defs = document.createElementNS(ns, "defs");
        defs.innerHTML = `<clipPath id="tc"><rect x="0" y="0" width="1000" height="700"/></clipPath>`;
        svg.appendChild(defs);

        const g = document.createElementNS(ns, "g");
        g.setAttribute("clip-path", "url(#tc)");
        svg.appendChild(g);

        // Trunk across the full width, bleeding off both sides
        const trunkSegs = [
            [-80, 95,  4.2, 0.55],
            [95,  310, 3.6, 0.50],
            [310, 520, 3.1, 0.46],
            [520, 750, 2.6, 0.42],
            [750, 940, 2.1, 0.38],
            [940, 1100,1.6, 0.28],
        ];
        trunkSegs.forEach(([x1, x2, w, op]) => g.appendChild(mkLine(x1, 350, x2, 350, w, op)));

        // Node positions — where branches explode outward
        const nodeXs = [95, 310, 520, 750, 940];

        nodeXs.forEach((nx, idx) => {
            // Each node: upward + downward tree, plus two irregular diagonals
            const baseLen = 82 + rand() * 28;  // vary per node
            const baseW   = 1.9 + rand() * 0.3;
            const depth   = idx === 0 || idx === 4 ? 5 : 6;

            branch(g, nx, 350, -Math.PI/2 + jitter(0.18), baseLen,        baseW,        0.55, depth);
            branch(g, nx, 350,  Math.PI/2 + jitter(0.18), baseLen,        baseW,        0.55, depth);
            branch(g, nx, 350, -Math.PI/2 - 0.55 + jitter(0.25), baseLen * 0.72, baseW * 0.72, 0.44, depth - 1);
            branch(g, nx, 350,  Math.PI/2 + 0.55 + jitter(0.25), baseLen * 0.72, baseW * 0.72, 0.44, depth - 1);
        });

        // Blue road — drawn last so it sits on top of everything
        const halo = document.createElementNS(ns, "line");
        halo.setAttribute("x1", "-80"); halo.setAttribute("y1", "350");
        halo.setAttribute("x2", "1100"); halo.setAttribute("y2", "350");
        halo.setAttribute("stroke", "#93c5fd");
        halo.setAttribute("stroke-width", "12");
        halo.setAttribute("stroke-linecap", "round");
        halo.setAttribute("opacity", "0.15");
        halo.setAttribute("fill", "none");
        g.appendChild(halo);

        const road = document.createElementNS(ns, "line");
        road.setAttribute("x1", "-80"); road.setAttribute("y1", "350");
        road.setAttribute("x2", "1100"); road.setAttribute("y2", "350");
        road.setAttribute("stroke", "#3b82f6");
        road.setAttribute("stroke-width", "2.4");
        road.setAttribute("stroke-linecap", "round");
        road.setAttribute("opacity", "0.95");
        road.setAttribute("fill", "none");
        g.appendChild(road);

        // Blue dots at node positions
        nodeXs.forEach((nx, idx) => {
            const r = (idx === 0 || idx === nodeXs.length - 1) ? 5.5 : 4.2;
            g.appendChild(mkCircle(nx, 350, r, "#3b82f6"));
        });

        treeCanvas.appendChild(svg);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT LISTENERS
    // ─────────────────────────────────────────────────────────────────────────

    window.addEventListener("pointermove", e => {
        state.lastPointer = { x: e.clientX, y: e.clientY };
    });

    closeModalBtn.addEventListener("click", closeTaskModal);
    taskModal.addEventListener("click", e => { if (e.target === taskModal) closeTaskModal(); });
    window.addEventListener("keydown", e => {
        if (e.key === "Escape") closeTaskModal();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // BOOT
    // ─────────────────────────────────────────────────────────────────────────

    renderStage();

})();
