// Agent assurance flow: test -> catalogue -> remedy -> deployment ladder, across six manufacturing floors (no libraries).
(function () {
  const FLOORS = [
    { lab: "64 battery-tab welds in the question", task: "Question: which of these 64 welds can ship? The agent checks each weld through validated quality models.",
      mode: "Skips evidence on large batches",
      o: 7, s: 8, d: 4, after: 2,
      remedy: "<b>Control:</b> one batch table instead of per-weld calls, and a code check that every weld received a decision.",
      limit: "<b>Never handed over:</b> safety-critical joints and final release of a battery pack." },
    { lab: "64 candidate laser settings", task: "Question: which laser power and speed give a dense, low-spatter part in a new alloy? The agent queries process models.",
      mode: "Overconfident outside the model's valid range",
      o: 6, s: 9, d: 5, after: 2,
      remedy: "<b>Control:</b> calibrated uncertainty on every prediction; the agent must abstain and ask for test builds outside the data.",
      limit: "<b>Never handed over:</b> qualification of a flight part." },
    { lab: "64 sensor traces and metrology records", task: "Question: why did this lot trip the fault-detection alarm? The agent gathers metrology, tool and lot history.",
      mode: "Ungrounded number in an excursion report",
      o: 5, s: 7, d: 5, after: 1,
      remedy: "<b>Control:</b> any number not found in a tool log is rejected; a local model keeps recipes on site.",
      limit: "<b>Never handed over:</b> recipe edits and the run-to-run control loop." },
    { lab: "64 alarms in the flood", task: "Question: alarms are flooding during an upset. Which procedure step applies now?",
      mode: "Invented procedure step",
      o: 4, s: 10, d: 6, after: 2,
      remedy: "<b>Control:</b> procedures are quoted verbatim from the procedure tool; setpoint changes go through management of change.",
      limit: "<b>Never handed over:</b> the safety instrumented system and any process-safety layer." },
    { lab: "64 batch-record entries", task: "Question: does this batch record meet the specification? The agent reviews each entry against the master record.",
      mode: "Different answer on a rerun",
      o: 5, s: 8, d: 7, after: 2,
      remedy: "<b>Control:</b> each entry is checked by a fixed rule in code; the agent only drafts the deviation note, with a full audit trail.",
      limit: "<b>Never handed over:</b> batch release, which stays with the qualified person." },
    { lab: "64 solder joints on a server board", task: "Question: which joints on this AI server board need rework? The agent reads the inspection models' results.",
      mode: "Misreads board geometry",
      o: 6, s: 6, d: 5, after: 2,
      remedy: "<b>Control:</b> joint locations and pass limits come from the inspection model and board data, never from the agent's reading of an image.",
      limit: "<b>Never handed over:</b> final test sign-off; the same catalogue extends to data-center power and cooling equipment." }
  ];
  const N = 64;
  const root = document.getElementById("aa");
  const $ = id => document.getElementById(id);
  const items = $("items");
  for (let i = 0; i < N; i++) { const d = document.createElement("div"); d.className = "it"; items.appendChild(d); }
  const cells = [...items.children];
  const rungs = [...$("ladder").children];
  const steps = [...root.querySelectorAll(".aa-step")];
  const chips = [...root.querySelectorAll(".aa-chip")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let floor = 0, timers = [], playing = !reduce;
  const missSet = new Set([9, 17, 23, 30, 38, 41, 47, 52, 55, 58, 60, 61, 62, 63]);

  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function setStep(k) { steps.forEach((s, i) => { s.classList.toggle("on", i === k); s.classList.toggle("done", i < k); }); }
  function setRung(k) { rungs.forEach((r, i) => { r.classList.toggle("here", i === k); r.classList.toggle("passed", i < k); }); }

  function reset() {
    cells.forEach(c => c.className = "it");
    ["flagBad", "flagGood", "card", "remedy", "update"].forEach(id => $(id).classList.remove("show"));
    ["bo", "bs", "bd"].forEach(id => $(id).style.width = "0");
    ["vo", "vs", "vd", "rpn2"].forEach(id => $(id).textContent = "");
    $("rpn").textContent = "–"; $("agent").classList.remove("busy");
    setStep(-1); setRung(-1);
  }

  function fill(f) {
    $("task").textContent = f.task; $("fmode").textContent = f.mode; $("itemsLab").textContent = f.lab;
    $("remedy").innerHTML = f.remedy; $("limit").innerHTML = f.limit;
  }

  function finalState(f) {
    // static end state for reduced motion or pause-at-load
    setStep(3); cells.forEach(c => c.className = "it fix");
    $("flagGood").classList.add("show"); $("card").classList.add("show"); $("remedy").classList.add("show");
    $("bo").style.width = f.o * 10 + "%"; $("bs").style.width = f.s * 10 + "%"; $("bd").style.width = f.d * 10 + "%";
    $("vo").textContent = f.o; $("vs").textContent = f.s; $("vd").textContent = f.d;
    $("rpn").textContent = f.o * f.s * f.d; $("rpn2").textContent = "→ " + f.after * f.s * f.d;
    setRung(3);
  }

  function run() {
    clearTimers(); reset();
    const f = FLOORS[floor]; fill(f);
    if (!playing) { finalState(f); return; }
    let t = 300;
    // 1 Test
    at(t, () => { setStep(0); $("agent").classList.add("busy"); });
    cells.forEach((c, i) => at(t + 200 + i * 38, () => { c.className = "it " + (missSet.has(i) ? "miss" : "ok"); }));
    t += 200 + N * 38 + 300;
    at(t, () => { $("agent").classList.remove("busy"); $("flagBad").classList.add("show"); });
    // 2 Catalogue
    t += 900;
    at(t, () => { setStep(1); $("card").classList.add("show"); });
    at(t + 400, () => { $("bo").style.width = f.o * 10 + "%"; $("vo").textContent = f.o; });
    at(t + 800, () => { $("bs").style.width = f.s * 10 + "%"; $("vs").textContent = f.s; });
    at(t + 1200, () => { $("bd").style.width = f.d * 10 + "%"; $("vd").textContent = f.d; });
    at(t + 1700, () => { $("rpn").textContent = f.o * f.s * f.d; });
    // 3 Remedy and re-test
    t += 2700;
    at(t, () => { setStep(2); $("remedy").classList.add("show"); $("flagBad").classList.remove("show"); });
    at(t + 700, () => { $("agent").classList.add("busy"); });
    cells.forEach((c, i) => at(t + 800 + i * 18, () => { c.className = "it fix"; }));
    at(t + 800 + N * 18 + 200, () => {
      $("agent").classList.remove("busy"); $("flagGood").classList.add("show");
      $("bo").style.width = f.after * 10 + "%"; $("vo").textContent = f.after;
      $("rpn2").textContent = "→ " + f.after * f.s * f.d;
    });
    // 4 Deploy ladder
    t += 800 + N * 18 + 1400;
    at(t, () => setStep(3));
    [0, 1, 2, 3].forEach((k, j) => at(t + 300 + j * 1100, () => setRung(k)));
    t += 300 + 4 * 1100 + 400;
    // model update: back to re-qualification
    at(t, () => $("update").classList.add("show"));
    at(t + 1300, () => setRung(0));
    at(t + 2300, () => setRung(1));
    at(t + 3000, () => setRung(2));
    at(t + 3700, () => setRung(3));
    t += 5600;
    at(t, () => { floor = (floor + 1) % FLOORS.length; syncChips(); run(); });
  }

  function syncChips() { chips.forEach((c, i) => c.setAttribute("aria-pressed", String(i === floor))); }
  chips.forEach(c => c.addEventListener("click", () => { floor = +c.dataset.f; syncChips(); run(); }));
  $("aa-play").addEventListener("click", () => {
    playing = !playing; $("aa-play").textContent = playing ? "Pause" : "Play";
    $("aa-play").setAttribute("aria-label", playing ? "Pause animation" : "Play animation"); run();
  });
  $("aa-restart").addEventListener("click", () => { playing = true; $("aa-play").textContent = "Pause"; run(); });
  if (reduce) $("aa-play").textContent = "Play";
  // start when visible
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: .25 });
  io.observe(root);
})();
