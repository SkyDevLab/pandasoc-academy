const LESSON_COUNT = 6;
const lessonKey = "pandasoc-lessons-v2";
const readSaved = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } };
const lessonDone = new Set(readSaved(lessonKey, []));
function updateProgress() {
  const text = document.getElementById("progressText");
  if (text) text.textContent = `${lessonDone.size} / ${LESSON_COUNT} completed`;
  const bar = document.getElementById("progressBar");
  if (bar) bar.style.width = `${lessonDone.size / LESSON_COUNT * 100}%`;
  document.querySelectorAll(".lesson-card").forEach((card, i) => {
    card.classList.toggle("completed", lessonDone.has(i));
    const detail = card.querySelector(".lesson-detail");
    const button = card.querySelector(".lesson-btn");
    if (button) button.textContent = detail && !detail.classList.contains("hidden") ? "Close module −" : "Open module ↗";
  });
}
document.querySelectorAll("[data-open]").forEach(button => button.addEventListener("click", () => {
  const index = Number(button.dataset.open);
  const card = document.querySelector(`[data-lesson="${index}"]`);
  const detail = card.querySelector(".lesson-detail");
  const opening = detail.classList.contains("hidden");
  document.querySelectorAll(".lesson-detail").forEach(item => item.classList.add("hidden"));
  document.querySelectorAll(".lesson-btn").forEach(item => item.textContent = "Open module ↗");
  if (opening) { detail.classList.remove("hidden"); button.textContent = "Close module −"; }
}));
document.querySelectorAll("[data-done]").forEach(button => button.addEventListener("click", () => {
  lessonDone.add(Number(button.dataset.done));
  localStorage.setItem(lessonKey, JSON.stringify([...lessonDone]));
  updateProgress();
}));
document.querySelectorAll(".mini-check").forEach(check => {
  const feedback = check.parentElement.querySelector(".check-feedback");
  check.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
    check.querySelectorAll("button").forEach(item => { item.disabled = true; item.classList.remove("correct", "incorrect"); });
    const correct = button.dataset.correct === "true";
    button.classList.add(correct ? "correct" : "incorrect");
    if (!correct) check.querySelector('[data-correct="true"]').classList.add("correct");
    feedback.textContent = correct ? "Correct. Panda approves this evidence-first reasoning." : "Not quite. Review the explanation above, then continue with the key distinction in mind.";
    feedback.className = `check-feedback ${correct ? "good" : "bad"}`;
  }));
});
updateProgress();

const indicators = {
  hash: {icon:"#",type:"OBSERVABLE ARTEFACT",title:"File hash",description:"A cryptographic digest can help identify a specific file. It does not by itself prove the file executed, caused harm, or is malicious in every context.",questions:["Where was the file found and collected?","Was it executed, and by which process or user?","Do endpoint controls or analysis results add context?"]},
  ip: {icon:"↗",type:"NETWORK INDICATOR",title:"IP address",description:"An IP may point to a connection endpoint, but addresses can be shared, reassigned or used by legitimate services. Reputation is one clue, not a verdict.",questions:["Was the connection inbound or outbound, and at what time?","Which process, host and identity were involved?","Do DNS, proxy, firewall or service logs corroborate the activity?"]},
  account: {icon:"♙",type:"IDENTITY EVIDENCE",title:"Identity activity",description:"Unusual sign-ins, permission changes or new credentials can signal risk. A valid authentication can still be unauthorized, so examine context and downstream activity.",questions:["Was MFA satisfied and was the device or location expected?","Did permissions, tokens, sessions or recovery details change?","What did the identity access after authenticating?"]},
  behavior: {icon:"⌁",type:"BEHAVIOURAL PATTERN",title:"Behaviour sequence",description:"A sequence of actions can reveal intent more clearly than one isolated artifact. Behaviour detections still need environment context and tuning.",questions:["What process or identity initiated the action?","What occurred just before and after it?","Does the pattern match approved administration or normal workloads?"]}
};
document.querySelectorAll("[data-indicator]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-indicator]").forEach(item => item.classList.toggle("active", item === button));
  const data = indicators[button.dataset.indicator];
  document.getElementById("indicatorIcon").textContent = data.icon;
  document.getElementById("indicatorType").textContent = data.type;
  document.getElementById("indicatorTitle").textContent = data.title;
  document.getElementById("indicatorDescription").textContent = data.description;
  const list = document.getElementById("indicatorQuestions");
  list.replaceChildren(...data.questions.map(question => { const li = document.createElement("li"); li.textContent = question; return li; }));
}));

const cases = [
  {severity:"MEDIUM",icon:"♙",title:"Unusual report account login",meta:"Host: TKT-APP-02 · 02:47 AM",description:"A reporting service identity normally performs scheduled, read-only jobs. This event shows an interactive remote logon outside its documented pattern.",log:[["ACCOUNT","svc_ticket_report"],["EXPECTED","Scheduled, read-only reporting"],["OBSERVED","Interactive remote logon"]],question:"What should the analyst do first?",answers:["Close it — the account is a service account.","Check the account's permitted behaviour and corroborating logs.","Declare a critical incident immediately, without checking."],correct:1,why:"Compare the observed logon with the account's approved role, review authentication context and corroborating telemetry, and then determine scope and severity. Avoid both automatic dismissal and premature conclusions."},
  {severity:"HIGH",icon:"✉",title:"Reported invoice attachment",meta:"User: finance.user · 09:12 AM",description:"An employee reports opening an invoice attachment. Endpoint telemetry shows an office application spawning a scripting process, but the resulting activity is not yet understood.",log:[["SOURCE","User-reported email"],["PROCESS","Office app → script host"],["UNKNOWN","Execution outcome / network activity"]],question:"What is the strongest next step?",answers:["Tell the user to delete the email and close the ticket.","Preserve available message and endpoint evidence, then investigate process and network activity under the playbook.","Assume data theft happened and notify all customers."],correct:1,why:"The process chain is concerning but does not prove the full outcome. Preserve relevant evidence and correlate message metadata, process details, endpoint alerts and network telemetry. Escalate according to the organization's criteria."},
  {severity:"CRITICAL?",icon:"▧",title:"Files renamed at unusual speed",meta:"Host: ENG-WS-44 · 11:36 AM",description:"Endpoint monitoring reports rapid file modifications and suspicious ransom-note-like files. Several shared folders may be affected; business impact is still being assessed.",log:[["ACTIVITY","Rapid file writes / renames"],["SCOPE","One endpoint confirmed; shares unverified"],["RISK","Potential continuing disruption"]],question:"What response principle matters most?",answers:["Wait for every detail before notifying anyone.","Follow the incident plan: escalate immediately and coordinate authorized containment while preserving evidence where feasible.","Run random cleanup utilities to see whether files return."],correct:1,why:"Potential ransomware activity can spread and disrupt services. Prompt escalation and coordinated, authorized containment are important; actions must follow the organization's plan and balance business impact and evidence preservation."},
  {severity:"MEDIUM",icon:"⇧",title:"Unexpected bulk data reads",meta:"Identity: analyst.temp · 01:24 PM",description:"Audit telemetry shows an account reading far more files from a finance share than its recent baseline. No confirmed outbound transfer is available yet.",log:[["IDENTITY","analyst.temp"],["OBSERVED","Unusual volume of file reads"],["UNKNOWN","Whether data left the environment"]],question:"What is the most accurate initial conclusion?",answers:["Data has definitely been exfiltrated.","The account is reading an unusual volume of files; determine authorization, scope and whether transfer evidence exists.","Ignore it because there is no confirmed outbound transfer."],correct:1,why:"Bulk reads can be a concerning precursor but do not prove exfiltration. Check the user's role, job context, access path, affected data, related authentication events and outbound telemetry. State clearly what is and is not established."}
];
let activeCase = 0;
function renderCase() {
  const data = cases[activeCase];
  document.querySelectorAll("[data-case]").forEach(button => button.classList.toggle("active", Number(button.dataset.case) === activeCase));
  document.getElementById("caseSeverity").textContent = data.severity;
  document.getElementById("caseIcon").textContent = data.icon;
  document.getElementById("caseTitle").textContent = data.title;
  document.getElementById("caseMeta").textContent = data.meta;
  document.getElementById("caseDescription").textContent = data.description;
  document.getElementById("caseQuestion").textContent = data.question;
  const log = document.getElementById("caseLog"); log.replaceChildren();
  data.log.forEach(([label, value]) => { const a = document.createElement("span"); a.textContent = label; const b = document.createElement("code"); b.textContent = value; log.append(a,b); });
  const choices = document.getElementById("caseChoices"); choices.replaceChildren();
  data.answers.forEach((answer, i) => { const button = document.createElement("button"); button.className = "choice"; button.textContent = answer; button.dataset.answer = i === data.correct ? "right" : "wrong"; button.addEventListener("click", () => { [...choices.children].forEach(item => item.disabled = true); button.classList.add(i === data.correct ? "correct" : "incorrect"); if (i !== data.correct) choices.children[data.correct].classList.add("correct"); const fb = document.getElementById("caseFeedback"); fb.className = `feedback ${i === data.correct ? "good" : "bad"}`; fb.textContent = (i === data.correct ? "Exactly. " : "Good try. ") + data.why; }); choices.appendChild(button); });
  const fb = document.getElementById("caseFeedback"); fb.className = "feedback"; fb.textContent = "Choose an answer to see Panda's reasoning.";
}
document.querySelectorAll("[data-case]").forEach(button => button.addEventListener("click", () => { activeCase = Number(button.dataset.case); renderCase(); }));
document.getElementById("resetCase").addEventListener("click", renderCase);
renderCase();

const questions = [
 {q:"What should guide which alert to investigate first?",a:["Only the severity label","Asset criticality, identity privileges, chronology and corroborating evidence","Whichever alert appeared most recently"],correct:1,why:"Triage combines severity with context and potential impact. A lower-labelled alert may matter more when a critical asset or privileged identity is involved."},
 {q:"What does validating an alert establish?",a:["Whether its underlying telemetry supports the detection claim","That the whole organisation is compromised","That all related activity has been scoped"],correct:0,why:"Validation checks the detection against the evidence. Incident determination and broader scoping are related but distinct decisions."},
 {q:"A suspicious sign-in is validated but no downstream activity is known. What is the careful conclusion?",a:["Data theft is confirmed","The sign-in is validated; wider scope and impact remain under investigation","The alert must be false positive"],correct:1,why:"Keep the conclusion proportional to evidence. Unknown impact is not proof of compromise, but it is not proof the event was benign either."},
 {q:"Which is a common example of an IOC?",a:["A suspicious file's SHA-256 hash","A documented incident severity matrix","A business recovery meeting"],correct:0,why:"A hash is an observable artefact that can help identify a file. Context is needed to interpret its significance."},
 {q:"Which is the strongest example of a behavioural pattern worth investigating?",a:["One unfamiliar IP address alone","A script process followed by credential-access indicators and remote logons","A file hash without execution context"],correct:1,why:"A sequence of related actions can provide more useful context than one isolated indicator, though the evidence still needs validation."},
 {q:"Why record timestamps and timezones in a timeline?",a:["To make the report look technical","To avoid misordering events collected from systems using different time conventions","To prove the earliest event was malicious"],correct:1,why:"Mixed UTC and local times can distort event ordering. Document sources, timezones and uncertainty."},
 {q:"What should you do when needed logs are not available?",a:["Assume the missing event did not happen","State the telemetry gap, seek other authorized sources and limit conclusions accordingly","Fill in a likely timeline from memory"],correct:1,why:"Missing telemetry is a limitation. Record it and avoid claiming that an unobserved event definitely did or did not occur."},
 {q:"A production server may be compromised. Which containment approach is best?",a:["Always power it off, no matter the context","Follow the incident plan, escalate and coordinate authorized action with system owners","Do nothing until the investigation is complete"],correct:1,why:"Containment balances ongoing harm, service impact, evidence and authority. A coordinated playbook-based decision is safer than an automatic universal action."},
 {q:"What does a successful authentication log prove on its own?",a:["The activity was authorized by the account owner","Authentication succeeded according to the recorded event","No compromise occurred"],correct:1,why:"The log records an authentication result. Legitimacy depends on account context, MFA/session signals and subsequent activity."},
 {q:"What is the key distinction between a true alert and a confirmed incident?",a:["They are always the same thing","A valid detection supports observed activity; incident status depends on incident criteria and broader context","An incident must have a confirmed financial loss"],correct:1,why:"The alert may accurately detect an event that is permitted or benign. Incident classification follows the organization's criteria and evidence."},
 {q:"Which statement best separates fact from inference?",a:["The attacker stole all files","Audit logs show bulk reads; transfer of the data has not yet been established","This was definitely a nation-state"],correct:1,why:"It names what the source shows and identifies what remains unverified. That makes the report more defensible."},
 {q:"What is the primary purpose of containment?",a:["Punish the user associated with the alert","Limit further harm or spread while managing business and evidence trade-offs","Delete every log related to the event"],correct:1,why:"Containment aims to constrain harm. Actions should be authorized, proportionate and documented."},
 {q:"Before closing a recovered service, the team should:",a:["Verify service health, security controls, logging and monitoring against criteria","Close it as soon as the host responds to ping","Remove all alerts so the dashboard is clear"],correct:0,why:"Recovery requires validation that business service and security controls are functioning and that monitoring is in place."},
 {q:"How should incident costs be reported?",a:["As a single unexplained estimate","Separate known from estimated costs, show assumptions and distinguish direct, indirect and consequential costs","Include only hypothetical fines"],correct:1,why:"A transparent report documents sources, formulas, assumptions and uncertainty rather than presenting estimates as established facts."},
 {q:"Which is a useful outcome of a post-incident review?",a:["Assign blame before reviewing evidence","Delete the case when service is restored","Identify control gaps, improve playbooks/detections and assign follow-up owners"],correct:2,why:"Lessons learned should lead to specific, owned improvements. Focus on evidence, process and control effectiveness."}
];
let qi = 0, score = 0, answered = false;
const qTitle = document.getElementById("quizQuestion"), qOptions = document.getElementById("quizOptions"), qResult = document.getElementById("quizResult"), qNext = document.getElementById("nextQuestion"), qRestart = document.getElementById("restartQuiz");
function renderQuestion() {
  answered = false; const q = questions[qi];
  document.getElementById("quizCounter").textContent = `QUESTION ${qi + 1} OF ${questions.length}`;
  document.getElementById("quizScore").textContent = `Score: ${score}`;
  document.getElementById("quizBar").style.width = `${qi / questions.length * 100}%`;
  qTitle.textContent = q.q; qOptions.replaceChildren(); qResult.textContent = ""; qResult.className = "quiz-result";
  qNext.disabled = true; qNext.classList.remove("hidden"); qRestart.classList.add("hidden");
  qNext.textContent = qi === questions.length - 1 ? "See results →" : "Next question →";
  q.a.forEach((answer, i) => { const button = document.createElement("button"); button.className = "quiz-option"; button.textContent = answer; button.addEventListener("click", () => answerQuestion(i)); qOptions.appendChild(button); });
}
function answerQuestion(index) {
  if (answered) return; answered = true; const q = questions[qi];
  [...qOptions.children].forEach((button, i) => { button.disabled = true; if (i === q.correct) button.classList.add("correct"); else if (i === index) button.classList.add("incorrect"); });
  const correct = index === q.correct; if (correct) score++;
  document.getElementById("quizScore").textContent = `Score: ${score}`;
  qResult.className = `quiz-result ${correct ? "good" : "bad"}`;
  qResult.textContent = (correct ? "Correct! " : "Good try. ") + q.why;
  qNext.disabled = false; document.getElementById("quizBar").style.width = `${(qi + 1) / questions.length * 100}%`;
}
qNext.addEventListener("click", () => {
  if (!answered) return;
  if (qi < questions.length - 1) { qi++; renderQuestion(); return; }
  const percentage = Math.round(score / questions.length * 100);
  qTitle.textContent = `You scored ${score} / ${questions.length} (${percentage}%).`;
  qOptions.replaceChildren(); qResult.className = `quiz-result ${percentage >= 80 ? "good" : "bad"}`;
  qResult.textContent = percentage === 100 ? "Perfect run! Panda approves your careful reasoning." : percentage >= 80 ? "Strong work. Review any explanations that challenged your assumptions." : "Good practice. Revisit the modules and try again; learning comes from the explanation, not just the score.";
  qNext.classList.add("hidden"); qRestart.classList.remove("hidden");
  document.getElementById("quizBar").style.width = "100%"; document.getElementById("quizCounter").textContent = "QUIZ COMPLETE";
});
qRestart.addEventListener("click", () => { qi = 0; score = 0; renderQuestion(); });
renderQuestion();

const themeToggle = document.getElementById("themeToggle");
if (localStorage.getItem("pandasoc-theme") === "dark") document.body.classList.add("dark");
themeToggle.addEventListener("click", () => { document.body.classList.toggle("dark"); localStorage.setItem("pandasoc-theme", document.body.classList.contains("dark") ? "dark" : "light"); });
