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
            prompt: "You are 18. Everyone is asking the same question.\n\n\"What will your major be?\"\n\nYou don't know yet. But you have to pick something.",
            subtext: "pick wisely. there are no second chances.",
            options: [
                { label: "Computer Science",   type: "advance", next: STAGES.college },
                { label: "Art",                type: "warn",    message: "That won't pay the bills." },
                { label: "I don't know yet",   type: "warn",    message: "That's not an option." },
                { label: "Philosophy",         type: "warn",    message: "What are you going to do with that?" },
            ],
            tasks: [
                { name: "Finish college applications",  seconds: 90 },
                { name: "Study for the SATs",           seconds: 72 },
                { name: "Pick a \"practical\" major",   seconds: 60 },
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
                { name: "Finish the capstone project",  seconds: 85 },
                { name: "Network (pretend to be fine)",  seconds: 70 },
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
                { name: "Hit quarterly targets",        seconds: 45 },
                { name: "Clear your inbox",             seconds: 38 },
                { name: "Attend the mandatory fun",     seconds: 42 },
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
        decisions:             []
    };

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
    const warningLayer  = document.getElementById("warningLayer");
    const taskModal     = document.getElementById("taskModal");
    const modalTitle    = document.getElementById("modalTitle");
    const modalBody     = document.getElementById("modalBody");
    const closeModalBtn = document.getElementById("closeModal");
    const treeReveal    = document.getElementById("treeReveal");
    const treeCanvas    = document.getElementById("treeCanvas");
    const staticOverlay = document.getElementById("staticOverlay");

    // ─────────────────────────────────────────────────────────────────────────
    // PROGRESS BAR
    // ─────────────────────────────────────────────────────────────────────────

    const TOTAL_STEPS = 6;

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
        return (stageTasks || []).map(t => ({ name: t.name, remaining: t.seconds, completed: false }));
    }

    function formatSeconds(total) {
        const s = Math.max(0, Math.floor(total));
        const m = Math.floor(s / 60);
        return `${String(m).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
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

            if (!task.completed) {
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
        app.classList.remove("stress-1", "stress-2", "stress-3");
        const loopStages = [STAGES.career, STAGES.family, STAGES.retirement];
        if (!loopStages.includes(state.currentStage)) return;
        const level = Math.min(3, state.loopClicks);
        if (level > 0) app.classList.add(`stress-${level}`);
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
                showWarning(option.message, x, y);
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
        });

        return card;
    }

    function openTaskSimulation(taskName) {
        if (state.currentStage === STAGES.breakdown) return;

        modalTitle.textContent = `// ${taskName}`;
        modalBody.innerHTML = "";

        const displayName = state.playerName || "You";

        if (taskName === "Finish college applications") {
            modalBody.appendChild(createSimulationCard(
                "College Application Portal",
                [
                    { label: "Applicant Name", value: displayName, full: true },
                    { label: "Intended Major", value: "Computer Science (because it's practical)" },
                    { label: "Essay Prompt",   value: "Describe a challenge you overcame." },
                    { label: "Word Count",     value: "650 / 650", full: true },
                ],
                "Submit Application",
                "Application submitted. Status: Pending. You will hear back in 4–6 weeks.",
                "Common App Portal",
                () => completeTask(taskName)
            ));
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
            modalBody.appendChild(createSimulationCard(
                "Submission Confirmation",
                [{ label: "Application ID", value: "INT-2024-0027", full: true }],
                "Submit Application",
                "Application submitted. You will likely not hear back.",
                "Hiring Portal",
                () => completeTask(taskName)
            ));
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
    window.addEventListener("keydown", e => { if (e.key === "Escape") closeTaskModal(); });

    // ─────────────────────────────────────────────────────────────────────────
    // BOOT
    // ─────────────────────────────────────────────────────────────────────────

    renderStage();

})();