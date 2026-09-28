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
      name: 'Lead intake and CRM update',
      steps: [
        { label: 'Form / Webhook', desc: 'New lead received' },
        { label: 'AI classification', desc: 'Extract request details' },
        { label: 'Rule checks', desc: 'Required fields and duplicates' },
        { label: 'CRM update', desc: 'Create or update record' },
        { label: 'Team notification', desc: 'Notify owner with a summary' }
      ],
      logs: [
        { tag: 'info', msg: 'Sample lead received from a web form.' },
        { tag: 'info', msg: 'Extracting the request type and key details.' },
        { tag: 'success', msg: 'Required fields checked; items needing review are flagged.' },
        { tag: 'info', msg: 'CRM action prepared for the matching lead.' },
        { tag: 'success', msg: 'The lead owner receives a summary.' }
      ]
    },
    invoice: {
      name: 'Invoice and ERP sync',
      steps: [
        { label: 'Email / storage', desc: 'Invoice received' },
        { label: 'Data extraction', desc: 'Read line items and totals' },
        { label: 'Rule checks', desc: 'Check fields and calculations' },
        { label: 'ERP update', desc: 'Prepare a bill or purchase order' },
        { label: 'Team notification', desc: 'Notify the finance owner' }
      ],
      logs: [
        { tag: 'info', msg: 'Sample invoice received.' },
        { tag: 'info', msg: 'Reading supplier, line items, and totals.' },
        { tag: 'success', msg: 'Required fields and totals checked.' },
        { tag: 'info', msg: 'ERP record prepared for the next step.' },
        { tag: 'success', msg: 'Finance owner notified of the result.' }
      ]
    },
    hospitality: {
      name: 'Booking and guest workflow',
      steps: [
        { label: 'Booking update', desc: 'New reservation or message' },
        { label: 'Request routing', desc: 'Identify the guest request' },
        { label: 'Availability check', desc: 'Check dates and property rules' },
        { label: 'Task update', desc: 'Prepare the next team action' },
        { label: 'Team notification', desc: 'Flag requests for follow-up' }
      ],
      logs: [
        { tag: 'info', msg: 'Sample booking update received.' },
        { tag: 'info', msg: 'Classifying the guest request.' },
        { tag: 'success', msg: 'Dates and property rules checked.' },
        { tag: 'info', msg: 'Housekeeping task prepared for the team.' },
        { tag: 'success', msg: 'A team member is notified when follow-up is needed.' }
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

    consoleOutput.innerHTML = `<div class="log-line text-muted">// Switched to: <strong>${config.name}</strong>. Click "Run example" to walk through it.</div>`;
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
    runBtnText.textContent = 'Running example…';

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

    appendLog('success', 'Sample workflow finished. Production behavior is scoped to each project.');

    isSimulating = false;
    runBtn.disabled = false;
    runBtnIcon.textContent = '';
    runBtnText.textContent = 'Run again';
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

  function calculate() {
    const team = parseInt(teamInput.value, 10);
    const hours = parseInt(hoursInput.value, 10);
    const rate = parseInt(rateInput.value, 10);

    teamVal.textContent = team === 1 ? '1 person' : `${team} people`;
    hoursVal.textContent = `${hours} hrs/wk`;
    rateVal.textContent = `$${rate} / hr`;

    const annualHours = team * hours * 52;
    const annualCost = annualHours * rate;

    dollarsSavedElem.textContent = `$${annualCost.toLocaleString()}`;
    hoursSavedElem.textContent = `${annualHours.toLocaleString()} hrs`;
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

  form.addEventListener('submit', async (e) => {
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

    /* ── 2. Send email notification via formsubmit.co ────────── */
    const formError = document.getElementById('lead-form-error');
    const submitButton = document.getElementById('btn-submit-lead');
    const submitButtonLabel = submitButton.querySelector('span');
    formError.hidden = true;
    submitButton.disabled = true;
    submitButtonLabel.textContent = 'Sending…';

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

    try {
      const response = await fetch('https://formsubmit.co/ajax/sirotinskijsergij@gmail.com', {
        method: 'POST',
        body: emailData
      });
      if (!response.ok) throw new Error('Request could not be sent.');
      successLeadName.textContent = nameVal;
      showStep('success');
    } catch (error) {
      formError.textContent = 'We could not send your request. Please try again or message Serhii on Upwork.';
      formError.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButtonLabel.textContent = 'Send project details';
    }
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
