/**
 * AutomateIQ Agency Website - Interactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initPipelineSimulator();
  initRoiCalculator();
  initAuditModal();
  initNavigation();
});

/* ==========================================================================
   1. Interactive Pipeline Simulator
   ========================================================================== */
function initPipelineSimulator() {
  const tabs = document.querySelectorAll('.pipeline-tabs .tab-btn');
  const runBtn = document.getElementById('btn-run-simulation');
  const runBtnIcon = document.getElementById('sim-btn-icon');
  const runBtnText = document.getElementById('sim-btn-text');
  const consoleOutput = document.getElementById('console-output');
  const nodes = document.querySelectorAll('.pipe-node');
  const connectors = document.querySelectorAll('.pipe-connector');

  const step1Desc = document.getElementById('step-1-desc');
  const step2Desc = document.getElementById('step-2-desc');
  const step3Desc = document.getElementById('step-3-desc');
  const step4Desc = document.getElementById('step-4-desc');
  const step5Desc = document.getElementById('step-5-desc');

  const pipelineConfigs = {
    lead: {
      name: 'Inbound Lead Qualification',
      steps: [
        { label: 'Webhook / Typeform', desc: 'Inbound Enterprise Demo Request' },
        { label: 'Claude 5 Opus', desc: 'Domain Enrichment & Need Analysis' },
        { label: 'Pydantic Validator', desc: 'JSON Schema & Dedup Check' },
        { label: 'HubSpot CRM Sync', desc: 'Deal Created & Lead Scored' },
        { label: 'Slack Alerting', desc: 'Sales Rep Pinned with Summary' }
      ],
      logs: [
        { tag: 'info', msg: 'Webhook ingested from https://forms.acme.com/quote-req' },
        { tag: 'info', msg: 'Invoking Claude 5 Opus (Temp: 0.1, Schema: LeadEnrichmentV2)' },
        { tag: 'success', msg: 'Extracted: Company="FinScale Inc", Budget="$25K+", Urgency="Immediate"' },
        { tag: 'success', msg: 'Schema validated: 0 null fields, dedup lock verified via Redis' },
        { tag: 'info', msg: 'POST https://api.hubapi.com/crm/v3/objects/deals -> 201 Created (ID: 98124)' },
        { tag: 'success', msg: 'Slack message dispatched to #enterprise-leads -> Finished in 1.18s' }
      ]
    },
    invoice: {
      name: 'PDF Invoice & ERP Sync',
      steps: [
        { label: 'Gmail / S3 Trigger', desc: 'Incoming Vendor PDF Invoice' },
        { label: 'Multimodal Vision LLM', desc: 'Line Item & Tax Table Extraction' },
        { label: 'Math Engine Check', desc: 'Subtotal + VAT == Total Verification' },
        { label: 'Simpro ERP & QB', desc: 'Bill & Purchase Order Auto-Created' },
        { label: 'Telegram Dispatch', desc: 'Finance Lead Pinged with Audit Link' }
      ],
      logs: [
        { tag: 'info', msg: 'Email attachment detected: "INV-2026-90812.pdf" (348 KB)' },
        { tag: 'info', msg: 'Parsing document with GPT-4o Vision & OCR Table Extraction' },
        { tag: 'success', msg: 'Found 14 line items, Vendor="Apex Industrial Ltd", Total="$14,280.00"' },
        { tag: 'success', msg: 'Deterministic math check passed: ($12,000.00 + $2,280.00 VAT = $14,280.00)' },
        { tag: 'info', msg: 'Simpro API: Matching PO #6610 -> Status updated to "Ready for Payment"' },
        { tag: 'success', msg: 'Audit trail logged to Supabase -> Latency: 1.42s' }
      ]
    },
    hospitality: {
      name: 'Beds24 Multi-Channel AI Concierge',
      steps: [
        { label: 'Beds24 Webhook', desc: 'Guest Message / OTA Inquiry' },
        { label: 'Contextual AI Router', desc: 'Intent, Dates & Language Detection' },
        { label: 'Security & Availability', desc: 'Calendar Mutex & ID Policy Check' },
        { label: 'OTA & Smart Lock Sync', desc: 'Door PIN & Check-in Packet Generated' },
        { label: 'Instant Multilingual Reply', desc: 'Dispatched in < 40 seconds' }
      ],
      logs: [
        { tag: 'info', msg: 'Incoming OTA webhook received: Booking.com (Res #B24-88391)' },
        { tag: 'info', msg: 'AI Router: Language="Spanish", Intent="Early Check-In & Parking Access"' },
        { tag: 'success', msg: 'Property status check: Unit 4B cleaning completed at 11:30 AM' },
        { tag: 'info', msg: 'Generating temporary SmartLock PIN via Igloohome API' },
        { tag: 'success', msg: 'Generated personalized response in Spanish with Door PIN 7291#' },
        { tag: 'success', msg: 'Dispatched through Beds24 API -> Guest confirmed in 38s' }
      ]
    }
  };

  let currentPipelineKey = 'lead';
  let isSimulating = false;

  function setPipeline(key) {
    if (isSimulating) return;
    currentPipelineKey = key;
    const config = pipelineConfigs[key];

    tabs.forEach(t => {
      const active = t.getAttribute('data-pipeline') === key;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active);
    });

    // Update node descriptions
    step1Desc.textContent = config.steps[0].desc;
    step2Desc.textContent = config.steps[1].desc;
    step3Desc.textContent = config.steps[2].desc;
    step4Desc.textContent = config.steps[3].desc;
    step5Desc.textContent = config.steps[4].desc;

    // Reset nodes
    nodes.forEach(n => {
      n.classList.remove('active-executing', 'completed-step');
    });
    connectors.forEach(c => c.classList.remove('pulse-active'));

    consoleOutput.innerHTML = `<div class="log-line text-muted">// Switched to: <strong>${config.name}</strong>. Click "Run Live Simulation" to execute.</div>`;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-pipeline');
      setPipeline(key);
    });
  });

  runBtn.addEventListener('click', async () => {
    if (isSimulating) return;
    isSimulating = true;
    runBtn.disabled = true;
    runBtnIcon.textContent = '';
    runBtnText.textContent = 'Executing Telemetry...';

    // Clear console and reset nodes
    consoleOutput.innerHTML = '';
    nodes.forEach(n => n.classList.remove('active-executing', 'completed-step'));
    connectors.forEach(c => c.classList.remove('pulse-active'));

    const config = pipelineConfigs[currentPipelineKey];

    function appendLog(tag, msg) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
      const div = document.createElement('div');
      div.className = 'log-line';
      div.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-tag log-tag-${tag}">${tag.toUpperCase()}</span>${escapeHtml(msg)}`;
      consoleOutput.appendChild(div);
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    appendLog('info', `Initializing pipeline: ${config.name}...`);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.classList.add('active-executing');

      if (i > 0 && connectors[i - 1]) {
        connectors[i - 1].classList.add('pulse-active');
      }

      if (config.logs[i]) {
        appendLog(config.logs[i].tag, config.logs[i].msg);
      }

      await sleep(650);

      node.classList.remove('active-executing');
      node.classList.add('completed-step');

      if (i > 0 && connectors[i - 1]) {
        connectors[i - 1].classList.remove('pulse-active');
      }
    }

    if (config.logs[nodes.length]) {
      appendLog(config.logs[nodes.length].tag, config.logs[nodes.length].msg);
    }

    appendLog('success', '✓ [200 OK] Execution completed successfully with zero schema errors.');

    isSimulating = false;
    runBtn.disabled = false;
    runBtnIcon.textContent = '';
    runBtnText.textContent = 'Re-Run Simulation';
  });
}

/* ==========================================================================
   2. Interactive ROI Calculator
   ========================================================================== */
function initRoiCalculator() {
  const teamInput = document.getElementById('calc-team');
  const hoursInput = document.getElementById('calc-hours');
  const rateInput = document.getElementById('calc-rate');

  const teamVal = document.getElementById('calc-team-val');
  const hoursVal = document.getElementById('calc-hours-val');
  const rateVal = document.getElementById('calc-rate-val');

  const dollarsSavedElem = document.getElementById('calc-dollars-saved');
  const hoursSavedElem = document.getElementById('calc-hours-saved');
  const paybackElem = document.getElementById('calc-payback');

  function calculate() {
    const team = parseInt(teamInput.value, 10);
    const hours = parseInt(hoursInput.value, 10);
    const rate = parseInt(rateInput.value, 10);

    teamVal.textContent = team === 1 ? '1 person' : `${team} people`;
    hoursVal.textContent = `${hours} hrs/wk`;
    rateVal.textContent = `$${rate} / hr`;

    // 85% of repetitive work automated, over 52 weeks
    const totalWeeklyHours = team * hours;
    const automatedWeeklyHours = totalWeeklyHours * 0.85;
    const annualHoursSaved = Math.round(automatedWeeklyHours * 52);
    const annualDollarsSaved = Math.round(annualHoursSaved * rate);

    // Payback period assuming an average build investment of ~$4,000
    const dailySavings = annualDollarsSaved / 365;
    const paybackDays = Math.max(7, Math.round(3800 / (dailySavings || 1)));

    dollarsSavedElem.textContent = `$${annualDollarsSaved.toLocaleString()}`;
    hoursSavedElem.textContent = `${annualHoursSaved.toLocaleString()} hrs`;
    paybackElem.textContent = paybackDays < 30 ? `Under ${paybackDays} Days` : `~${Math.round(paybackDays / 30)} Months`;
  }

  [teamInput, hoursInput, rateInput].forEach(slider => {
    slider.addEventListener('input', calculate);
  });

  calculate();
}

/* ==========================================================================
   3. Multi-Step Audit Funnel Modal
   ========================================================================== */
function initAuditModal() {
  const dialog = document.getElementById('audit-dialog');
  const openBtns = [
    document.getElementById('btn-open-audit-header'),
    document.getElementById('btn-open-audit-hero'),
    document.getElementById('btn-open-audit-calc'),
    document.getElementById('btn-open-audit-footer'),
    document.getElementById('btn-consult-andriy')
  ].filter(Boolean);

  const closeBtn = document.getElementById('btn-close-dialog');
  const closeSuccessBtn = document.getElementById('btn-close-success');
  const stepBadge = document.getElementById('dialog-step-badge');
  const form = document.getElementById('audit-form');

  const step1 = form.querySelector('.form-step[data-step="1"]');
  const step2 = form.querySelector('.form-step[data-step="2"]');
  const step3 = form.querySelector('.form-step[data-step="3"]');
  const stepSuccess = form.querySelector('.form-step[data-step="success"]');

  const btnStep1Next = document.getElementById('btn-step-1-next');
  const btnStep2Prev = document.getElementById('btn-step-2-prev');
  const btnStep2Next = document.getElementById('btn-step-2-next');
  const btnStep3Prev = document.getElementById('btn-step-3-prev');

  const leadNameInput = document.getElementById('lead-name');
  const successLeadName = document.getElementById('success-lead-name');

  function showStep(stepNum) {
    [step1, step2, step3, stepSuccess].forEach(s => {
      if (s) s.classList.remove('active');
    });
    if (stepNum === 1 && step1) {
      step1.classList.add('active');
      stepBadge.textContent = 'Step 1 of 3';
    } else if (stepNum === 2 && step2) {
      step2.classList.add('active');
      stepBadge.textContent = 'Step 2 of 3';
    } else if (stepNum === 3 && step3) {
      step3.classList.add('active');
      stepBadge.textContent = 'Step 3 of 3';
    } else if (stepNum === 'success' && stepSuccess) {
      stepSuccess.classList.add('active');
      stepBadge.textContent = 'Confirmed';
    }
    if (form) {
      form.scrollTop = 0;
    }
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      showStep(1);
      dialog.showModal();
    });
  });

  closeBtn.addEventListener('click', () => dialog.close());
  closeSuccessBtn.addEventListener('click', () => dialog.close());

  // Prevent any click inside the card from propagating to dialog
  const dialogCard = dialog.querySelector('.dialog-card');
  if (dialogCard) {
    dialogCard.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Light dismiss ONLY when clicking outside the dialog card (on backdrop)
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });

  btnStep1Next.addEventListener('click', () => showStep(2));
  btnStep2Prev.addEventListener('click', () => showStep(1));
  btnStep2Next.addEventListener('click', () => showStep(3));
  btnStep3Prev.addEventListener('click', () => showStep(2));

  const toolOtherCheck = document.getElementById('tool-other-check');
  const toolOtherText  = document.getElementById('tool-other-text');
  if (toolOtherCheck && toolOtherText) {
    toolOtherCheck.addEventListener('change', () => {
      toolOtherText.disabled = !toolOtherCheck.checked;
      if (toolOtherCheck.checked) {
        toolOtherText.focus();
      }
    });
    // If user presses Enter in "Other" text input, proceed to step 3 instead of closing
    toolOtherText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        showStep(3);
      }
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    /* ── Collect all form data ────────────────────────────────── */
    const nameVal    = (document.getElementById('lead-name').value || '').trim() || 'there';
    const emailVal   = (document.getElementById('lead-email').value || '').trim();
    const companyVal = (document.getElementById('lead-company').value || '').trim();
    const notesVal   = (document.getElementById('lead-notes').value || '').trim();

    const bottleneckEl = form.querySelector('input[name="bottleneck"]:checked');
    const bottleneck   = bottleneckEl ? bottleneckEl.value : '—';

    const toolEls = form.querySelectorAll('input[name="tools"]:checked');
    const selectedTools = [];
    toolEls.forEach(el => {
      if (el.id === 'tool-other-check') {
        const otherVal = (toolOtherText ? toolOtherText.value : '').trim();
        selectedTools.push(otherVal ? `Other (${otherVal})` : 'Other');
      } else if (el.value) {
        selectedTools.push(el.value);
      }
    });
    const tools = selectedTools.join(', ') || '—';

    /* ── Show success screen instantly (fire-and-forget) ─────── */
    successLeadName.textContent = nameVal;
    showStep('success');

    /* ── 1. Send Telegram notification to Group & Direct Chat ──── */
    const tgToken   = '8820754329:AAER4vZUbtLPqHUdATp53xGzbDdvsP4yRcA';
    const tgChatIds = ['-5580728612', '425454406'];

    const escapeHtml = (str) => String(str || '').replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));

    const tgHtml = [
      '🔔 <b>New Lead from AutomateIQ Website</b>',
      '',
      `👤 <b>Name:</b> ${escapeHtml(nameVal)}`,
      `📧 <b>Email:</b> ${escapeHtml(emailVal)}`,
      `🏢 <b>Company:</b> ${escapeHtml(companyVal || '—')}`,
      `⚙️ <b>Bottleneck:</b> ${escapeHtml(bottleneck)}`,
      `🔧 <b>Tools:</b> ${escapeHtml(tools)}`,
      `📝 <b>Notes:</b> ${escapeHtml(notesVal || '—')}`,
      '',
      `📅 <i>${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Kiev' })}</i>`
    ].join('\n');

    tgChatIds.forEach(chatId => {
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: tgHtml,
          parse_mode: 'HTML'
        })
      }).catch(() => { /* silent – user already sees success */ });
    });

    /* ── 2. Send email notification via formsubmit.co ────────── */
    const emailData = new FormData();
    emailData.append('name', nameVal);
    emailData.append('email', emailVal);
    emailData.append('company', companyVal || '—');
    emailData.append('_subject', `🔔 New AutomateIQ Lead: ${nameVal}`);
    emailData.append('bottleneck', bottleneck);
    emailData.append('tools', tools);
    emailData.append('notes', notesVal || '—');
    emailData.append('_captcha', 'false');
    emailData.append('_template', 'table');

    fetch('https://formsubmit.co/ajax/sirotinskijsergij@gmail.com', {
      method: 'POST',
      body: emailData
    }).catch(() => { /* silent */ });
  });
}

/* ==========================================================================
   4. Navigation & Utilities
   ========================================================================== */
function initNavigation() {
  const currentYearSpan = document.getElementById('current-year');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (mobileToggle && navMenu) {
    // Toggle mobile menu
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('open');
      navMenu.classList.toggle('open');
      mobileToggle.classList.toggle('active');
      mobileToggle.setAttribute('aria-expanded', !isOpen);
    });

    // Close menu when clicking a nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') &&
          !navMenu.contains(e.target) &&
          !mobileToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
