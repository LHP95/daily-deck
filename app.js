// ============================================================================
// APP CONTROLLER: MULTI-CALCULATOR SUITE (FIRE + METABOLIC / CALORIES)
// SANZO WADA #305 LIGHT THEME
// ============================================================================

const WADA305 = {
    cinnamon: '#EEB480',
    cinnamonBorder: '#D98246',
    apricot: '#C98A00',
    citron: '#B2B73E',
    citronBorder: '#8F9624',
    turquoise: '#B5DECC',
    turquoiseBorder: '#3B9C7F'
};

// ============================================================================
// TAB NAVIGATION CONTROLLER
// ============================================================================
const navBtnFire = document.getElementById('navBtnFire');
const navBtnMetabolic = document.getElementById('navBtnMetabolic');
const navBtnCompound = document.getElementById('navBtnCompound');
const navBtnToday = document.getElementById('navBtnToday');

const viewFire = document.getElementById('viewFire');
const viewMetabolic = document.getElementById('viewMetabolic');
const viewCompound = document.getElementById('viewCompound');
const viewToday = document.getElementById('viewToday');

const ACTIVE_TAB_CLASS = "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition whitespace-nowrap bg-teal-50 text-wada-turquoiseDark border border-teal-200 shadow-sm w-full";
const INACTIVE_TAB_CLASS = "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition whitespace-nowrap text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent w-full";

function switchTab(activeTab) {
    // Hide all
    viewFire.classList.add('hidden');
    viewMetabolic.classList.add('hidden');
    viewCompound.classList.add('hidden');
    viewToday.classList.add('hidden');

    navBtnFire.className = INACTIVE_TAB_CLASS;
    navBtnMetabolic.className = INACTIVE_TAB_CLASS;
    navBtnCompound.className = INACTIVE_TAB_CLASS;
    navBtnToday.className = INACTIVE_TAB_CLASS;

    if (activeTab === 'fire') {
        viewFire.classList.remove('hidden');
        navBtnFire.className = ACTIVE_TAB_CLASS;
        if (growthChart) growthChart.resize();
    } else if (activeTab === 'metabolic') {
        viewMetabolic.classList.remove('hidden');
        navBtnMetabolic.className = ACTIVE_TAB_CLASS;
        updateMetabolicCalculator();
    } else if (activeTab === 'compound') {
        viewCompound.classList.remove('hidden');
        navBtnCompound.className = ACTIVE_TAB_CLASS;
        if (!compoundChart) {
            initCompoundChart();
        } else {
            compoundChart.resize();
        }
        updateCompoundCalculator();
    } else if (activeTab === 'today') {
        viewToday.classList.remove('hidden');
        navBtnToday.className = ACTIVE_TAB_CLASS;
        refreshTodayDashboard();
    }
}

navBtnFire.addEventListener('click', () => switchTab('fire'));
navBtnMetabolic.addEventListener('click', () => switchTab('metabolic'));
navBtnCompound.addEventListener('click', () => switchTab('compound'));
navBtnToday.addEventListener('click', () => switchTab('today'));

// ============================================================================
// TAB 1: FIRE CALCULATOR ENGINE
// ============================================================================
const ageInput = document.getElementById('currentAge');
const coastAgeInput = document.getElementById('coastAge');
const netWorthInput = document.getElementById('currentNetWorth');
const monthlyInput = document.getElementById('monthlySavings');
const expensesInput = document.getElementById('annualExpenses');
const returnInput = document.getElementById('returnRate');
const swrInput = document.getElementById('swrRate');

const targetDisplay = document.getElementById('targetDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const retireAgeDisplay = document.getElementById('retireAgeDisplay');
const coastStatusDisplay = document.getElementById('coastStatusDisplay');
const coastTargetDisplay = document.getElementById('coastTargetDisplay');
const chartHighlightBadge = document.getElementById('chartHighlightBadge');

const retirementInsightCard = document.getElementById('retirementInsightCard');
const insightIcon = document.getElementById('insightIcon');
const insightTitle = document.getElementById('insightTitle');
const funFactSentence = document.getElementById('funFactSentence');
const successRateBadge = document.getElementById('successRateBadge');

let growthChart = null;
let currentTimeline = [];

function parseCurrency(value) {
    if (!value) return 0;
    const digitsOnly = String(value).replace(/\D/g, '');
    return Number(digitsOnly) || 0;
}

function handleCurrencyInput(e) {
    const input = e.target;
    const oldVal = input.value;
    const oldLength = oldVal.length;
    const oldCursor = input.selectionStart || 0;

    const digitsOnly = oldVal.replace(/\D/g, '');
    if (!digitsOnly) {
        input.value = '';
    } else {
        input.value = Number(digitsOnly).toLocaleString();
    }

    const newLength = input.value.length;
    const newCursor = Math.max(0, oldCursor + (newLength - oldLength));
    input.setSelectionRange(newCursor, newCursor);

    updateFireCalculator();
}

function initFireChart() {
    const ctx = document.getElementById('growthChart').getContext('2d');

    growthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Initial',
                    data: [],
                    backgroundColor: 'rgba(238, 180, 128, 0.60)',
                    borderColor: WADA305.cinnamonBorder,
                    borderWidth: 1.5,
                    fill: 'origin',
                    tension: 0.25,
                    pointRadius: 0
                },
                {
                    label: 'Saved',
                    data: [],
                    backgroundColor: 'rgba(178, 183, 62, 0.65)',
                    borderColor: WADA305.citronBorder,
                    borderWidth: 1.5,
                    fill: '-1',
                    tension: 0.25,
                    pointRadius: 0
                },
                {
                    label: 'Returns',
                    data: [],
                    backgroundColor: 'rgba(181, 222, 204, 0.80)',
                    borderColor: WADA305.turquoiseBorder,
                    borderWidth: 2,
                    fill: '-1',
                    tension: 0.25,
                    pointRadius: 0
                },
                {
                    label: 'Retirement Target',
                    data: [],
                    borderColor: WADA305.apricot,
                    borderWidth: 2.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#0f172a',
                    bodyColor: '#334155',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: 12,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const point = currentTimeline[index];
                            if (!point) return '';

                            if (context.datasetIndex === 0) {
                                return ` Initial: $${point.initial.toLocaleString()}`;
                            } else if (context.datasetIndex === 1) {
                                return ` Saved: $${point.saved.toLocaleString()}`;
                            } else if (context.datasetIndex === 2) {
                                return ` Returns: $${point.returns.toLocaleString()}`;
                            } else if (context.datasetIndex === 3) {
                                return ` Retirement Target: $${context.parsed.y.toLocaleString()}`;
                            }
                            return '';
                        },
                        footer: function (tooltipItems) {
                            if (tooltipItems.length === 0) return '';
                            const index = tooltipItems[0].dataIndex;
                            const point = currentTimeline[index];
                            if (!point) return '';
                            return `\nTotal Portfolio: $${point.total.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
                },
                y: {
                    stacked: false,
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    ticks: {
                        color: '#64748b',
                        callback: function (val) {
                            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                            if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                            return `$${val}`;
                        }
                    }
                }
            }
        }
    });
}

function updateFireCalculator() {
    const currentAge = Math.max(1, Number(ageInput.value) || 30);
    const coastAge = Math.max(currentAge + 1, Number(coastAgeInput.value) || 59);
    const currentNetWorth = parseCurrency(netWorthInput.value);
    const monthlySavings = parseCurrency(monthlyInput.value);
    const annualExpenses = parseCurrency(expensesInput.value);
    const returnRate = (Number(returnInput.value) || 0) / 100;
    const swrRate = (Number(swrInput.value) || 4) / 100;

    const fiTarget = calculateFiNumber(annualExpenses, swrRate);
    const fiResult = calculateTimeToFi(
        currentAge,
        currentNetWorth,
        monthlySavings,
        annualExpenses,
        returnRate,
        swrRate
    );

    targetDisplay.textContent = `$${Math.round(fiTarget).toLocaleString()}`;

    if (fiResult.alreadyReached) {
        timeDisplay.textContent = "Reached! 🎉";
        retireAgeDisplay.textContent = `Age ${currentAge}`;
        chartHighlightBadge.textContent = "FI Target Already Reached!";
    } else if (fiResult.years === Infinity || annualExpenses === 0) {
        timeDisplay.textContent = "—";
        retireAgeDisplay.textContent = "Adjust savings";
        chartHighlightBadge.textContent = "FI Target: Not yet projected";
    } else {
        timeDisplay.textContent = `${fiResult.years}y ${fiResult.remainingMonths}m`;
        retireAgeDisplay.textContent = `Age ${fiResult.retireAge}`;
        chartHighlightBadge.textContent = `FI Reached in ${fiResult.years}y ${fiResult.remainingMonths}m (Age ${fiResult.retireAge})`;
    }

    const coastResult = calculateTimeToCoastFi(
        currentAge,
        coastAge,
        currentNetWorth,
        monthlySavings,
        annualExpenses,
        returnRate,
        swrRate
    );

    coastTargetDisplay.textContent = `Target: $${Math.round(coastResult.currentCoastTarget).toLocaleString()} (for Age ${coastAge})`;

    if (coastResult.alreadyReached) {
        coastStatusDisplay.textContent = "Achieved! 🏖️";
        coastStatusDisplay.className = "text-lg md:text-xl font-extrabold text-wada-citronDark mt-1";
    } else if (coastResult.years === Infinity) {
        coastStatusDisplay.textContent = "—";
    } else {
        coastStatusDisplay.textContent = `${coastResult.years}y ${coastResult.remainingMonths}m`;
        coastStatusDisplay.className = "text-lg md:text-xl font-extrabold text-wada-citronDark mt-1";
        coastTargetDisplay.textContent = `Achieved at Age ${coastResult.reachAge} (Target: $${Math.round(coastResult.currentCoastTarget).toLocaleString()})`;
    }

    let simYears = 25;
    if (fiResult.years !== Infinity && fiResult.years > 0) {
        simYears = Math.max(simYears, fiResult.years + 5);
    }
    if (coastAge > currentAge) {
        simYears = Math.max(simYears, (coastAge - currentAge) + 3);
    }
    simYears = Math.min(45, Math.max(10, simYears));

    currentTimeline = simulateGrowthTimeline(
        currentAge,
        currentNetWorth,
        monthlySavings,
        returnRate,
        simYears
    );

    if (growthChart) {
        growthChart.data.labels = currentTimeline.map(point => `Age ${point.age}`);
        growthChart.data.datasets[0].data = currentTimeline.map(point => point.initial);
        growthChart.data.datasets[1].data = currentTimeline.map(point => point.initial + point.saved);
        growthChart.data.datasets[2].data = currentTimeline.map(point => point.total);
        growthChart.data.datasets[3].data = currentTimeline.map(() => Math.round(fiTarget));
        growthChart.update();
    }

    if (fiResult.years !== Infinity && annualExpenses > 0) {
        const retireAge = fiResult.alreadyReached ? currentAge : fiResult.retireAge;
        const endingSim = calculateEndingPortfolio(retireAge, fiTarget, annualExpenses, 90, 0.055);

        if (endingSim.depleted || endingSim.successRateEstimate < 70) {
            retirementInsightCard.className = "bg-rose-50 border border-rose-200 p-4 rounded-2xl shadow-sm space-y-1.5 transition-colors duration-300";
            insightIcon.textContent = "⚠️";
            insightTitle.textContent = "Retirement Sustainability Alert";
            insightTitle.className = "text-xs font-bold uppercase tracking-wider text-rose-700";
            
            successRateBadge.textContent = `${endingSim.successRateEstimate}% Low Success`;
            successRateBadge.className = "ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300";

            const runOutText = endingSim.depletedAge 
                ? `by <strong class="text-rose-900 font-bold">${endingSim.depletedAge} years old</strong>` 
                : `early in retirement`;

            funFactSentence.className = "text-xs text-rose-800 leading-relaxed font-medium";
            funFactSentence.innerHTML = `Uh oh! If you retire at age <strong class="text-rose-950 font-bold">${retireAge}</strong> with an aggressive <strong class="text-rose-950 font-bold">${(swrRate * 100).toFixed(1)}%</strong> withdrawal rate, you most likely will run out of money ${runOutText}. Historical data suggests targeting 3.5% – 4% for lasting security.`;
        } else {
            retirementInsightCard.className = "bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-amber-50/30 p-4 rounded-2xl border border-teal-200/80 shadow-sm space-y-1.5 transition-colors duration-300";
            insightIcon.textContent = "💡";
            insightTitle.textContent = "FI Calc Retirement Projection";
            insightTitle.className = "text-xs font-bold uppercase tracking-wider text-wada-turquoiseDark";

            successRateBadge.textContent = `${endingSim.successRateEstimate}% Historical Success`;
            successRateBadge.className = "ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";

            funFactSentence.className = "text-xs text-slate-700 leading-relaxed font-medium";
            funFactSentence.innerHTML = `Fun fact: If you retire at age <strong class="text-slate-900 font-bold">${retireAge}</strong> and stick to your <strong class="text-slate-900 font-bold">${(swrRate * 100).toFixed(1)}%</strong> withdrawal rate, there's a strong chance your portfolio never runs dry—in fact, by age 90, your median portfolio could end at <strong class="text-emerald-700 font-bold">$${endingSim.endingBalance.toLocaleString()}</strong> (based on historical median returns with a balanced asset mix)!`;
        }
    } else {
        successRateBadge.textContent = `—`;
        funFactSentence.className = "text-xs text-slate-700 leading-relaxed font-medium";
        funFactSentence.innerHTML = `Set your target expenses and savings to view your retirement sustainability projection.`;
    }
}

[netWorthInput, monthlyInput, expensesInput].forEach(input => {
    input.addEventListener('input', handleCurrencyInput);
});

[ageInput, coastAgeInput, returnInput, swrInput].forEach(input => {
    input.addEventListener('input', updateFireCalculator);
});

// ============================================================================
// TAB 2: METABOLIC CALORIC DEFICIT CONTROLLER
// ============================================================================
let selectedSex = 'male';

const sexMaleBtn = document.getElementById('sexMaleBtn');
const sexFemaleBtn = document.getElementById('sexFemaleBtn');
const metaAgeInput = document.getElementById('metaAge');
const metaWeightInput = document.getElementById('metaWeight');
const metaHeightFeetInput = document.getElementById('metaHeightFeet');
const metaHeightInchesInput = document.getElementById('metaHeightInches');
const metaActivitySelect = document.getElementById('metaActivity');
const metaDeficitGoalSelect = document.getElementById('metaDeficitGoal');

const tdeeDisplay = document.getElementById('tdeeDisplay');
const targetCalDisplay = document.getElementById('targetCalDisplay');
const deficitLossRate = document.getElementById('deficitLossRate');
const bmiDisplay = document.getElementById('bmiDisplay');
const bmiBadge = document.getElementById('bmiBadge');
const bmrLabel = document.getElementById('bmrLabel');

const proteinDisplay = document.getElementById('proteinDisplay');
const carbsDisplay = document.getElementById('carbsDisplay');
const fatDisplay = document.getElementById('fatDisplay');
const caloriePaceBadge = document.getElementById('caloriePaceBadge');
const metabolicFactSentence = document.getElementById('metabolicFactSentence');

sexMaleBtn.addEventListener('click', () => {
    selectedSex = 'male';
    sexMaleBtn.className = "py-1 text-xs font-bold rounded-lg bg-white text-slate-800 shadow-sm transition";
    sexFemaleBtn.className = "py-1 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition";
    updateMetabolicCalculator();
});

sexFemaleBtn.addEventListener('click', () => {
    selectedSex = 'female';
    sexFemaleBtn.className = "py-1 text-xs font-bold rounded-lg bg-white text-slate-800 shadow-sm transition";
    sexMaleBtn.className = "py-1 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition";
    updateMetabolicCalculator();
});

function updateMetabolicCalculator() {
    const age = Math.max(10, Number(metaAgeInput.value) || 30);
    const weightLbs = Math.max(50, Number(metaWeightInput.value) || 175);
    const heightFeet = Math.max(3, Number(metaHeightFeetInput.value) || 5);
    const heightInches = Math.max(0, Math.min(11, Number(metaHeightInchesInput.value) || 10));
    const activityMultiplier = Number(metaActivitySelect.value) || 1.375;
    const deficitGoal = Number(metaDeficitGoalSelect.value);

    // 1. Math calculations from metabolic.js
    const bmr = calculateBmr(selectedSex, weightLbs, heightFeet, heightInches, age);
    const tdee = calculateTdee(bmr, activityMultiplier);
    const bmiResult = calculateBmi(weightLbs, heightFeet, heightInches);
    const deficitResult = calculateDeficitTargets(tdee, deficitGoal);

    // 2. Update Metric Displays
    tdeeDisplay.textContent = `${tdee.toLocaleString()} kcal`;
    targetCalDisplay.textContent = `${deficitResult.targetCalories.toLocaleString()} kcal`;
    
    if (deficitGoal === 0) {
        deficitLossRate.textContent = "Maintain weight (0 lb/wk)";
        deficitLossRate.className = "text-[10px] text-slate-500 font-medium";
        caloriePaceBadge.textContent = "Weight Maintenance";
        caloriePaceBadge.className = "ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300";
        metabolicFactSentence.innerHTML = `At maintenance intake (<strong>${tdee.toLocaleString()} kcal/day</strong>), your target calories equal your maintenance burn. Energy expenditure matches your food intake, keeping your current weight steady at <strong>${weightLbs} lbs</strong>.`;
    } else {
        deficitLossRate.textContent = `-${deficitResult.weeklyLossLbs} lb / week`;
        deficitLossRate.className = "text-[10px] text-emerald-700 font-medium";
        
        let paceText = "Moderate Fat Loss";
        if (deficitGoal <= 250) paceText = "Mild Fat Loss";
        else if (deficitGoal >= 750) paceText = "Aggressive Fat Loss";
        caloriePaceBadge.textContent = paceText;
        caloriePaceBadge.className = "ml-auto text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300";

        const twelveWeekLoss = Math.round(deficitResult.weeklyLossLbs * 12 * 10) / 10;
        metabolicFactSentence.innerHTML = `At a <strong>${deficitGoal} kcal/day deficit</strong>, you will burn approximately <strong>${deficitResult.weeklyLossLbs} lb of body fat per week</strong> (3,500 kcal deficit = 1 lb of fat). In 12 weeks, this projects to approximately <strong>${twelveWeekLoss} lbs lost</strong>!`;
    }

    bmiDisplay.textContent = bmiResult.bmi;
    bmiBadge.textContent = bmiResult.category;
    bmiBadge.className = `text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold border ${bmiResult.colorClass}`;
    bmrLabel.textContent = `Basal Rate (BMR): ${bmr.toLocaleString()} kcal`;

    // 3. Update Macro Nutrition Targets
    proteinDisplay.textContent = `${deficitResult.macros.protein}g`;
    carbsDisplay.textContent = `${deficitResult.macros.carbs}g`;
    fatDisplay.textContent = `${deficitResult.macros.fat}g`;
}

[metaAgeInput, metaWeightInput, metaHeightFeetInput, metaHeightInchesInput].forEach(input => {
    input.addEventListener('input', updateMetabolicCalculator);
});

[metaActivitySelect, metaDeficitGoalSelect].forEach(select => {
    select.addEventListener('change', updateMetabolicCalculator);
});

// ============================================================================
// TAB 3: COMPOUND INTEREST CONTROLLER
// ============================================================================
const ciPrincipalInput = document.getElementById('ciPrincipal');
const ciMonthlyInput = document.getElementById('ciMonthly');
const ciYearsInput = document.getElementById('ciYears');
const ciRateInput = document.getElementById('ciRate');
const ciFrequencySelect = document.getElementById('ciFrequency');

const ciBalanceDisplay = document.getElementById('ciBalanceDisplay');
const ciMultiplierBadge = document.getElementById('ciMultiplierBadge');
const ciDepositedDisplay = document.getElementById('ciDepositedDisplay');
const ciInterestDisplay = document.getElementById('ciInterestDisplay');
const ciPercentBadge = document.getElementById('ciPercentBadge');
const ciHighlightBadge = document.getElementById('ciHighlightBadge');
const ciFactSentence = document.getElementById('ciFactSentence');

let compoundChart = null;
let currentCompoundTimeline = [];

function handleCiCurrencyInput(e) {
    const input = e.target;
    const oldVal = input.value;
    const oldLength = oldVal.length;
    const oldCursor = input.selectionStart || 0;

    const digitsOnly = oldVal.replace(/\D/g, '');
    if (!digitsOnly) {
        input.value = '';
    } else {
        input.value = Number(digitsOnly).toLocaleString();
    }

    const newLength = input.value.length;
    const newCursor = Math.max(0, oldCursor + (newLength - oldLength));
    input.setSelectionRange(newCursor, newCursor);

    updateCompoundCalculator();
}

function initCompoundChart() {
    const ctx = document.getElementById('compoundChart').getContext('2d');

    compoundChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Initial Principal',
                    data: [],
                    backgroundColor: 'rgba(238, 180, 128, 0.60)', // Cinnamon
                    borderColor: WADA305.cinnamonBorder,
                    borderWidth: 1.5,
                    fill: 'origin',
                    tension: 0.25,
                    pointRadius: 0
                },
                {
                    label: 'Added Deposits',
                    data: [],
                    backgroundColor: 'rgba(178, 183, 62, 0.65)', // Citron
                    borderColor: WADA305.citronBorder,
                    borderWidth: 1.5,
                    fill: '-1',
                    tension: 0.25,
                    pointRadius: 0
                },
                {
                    label: 'Compound Interest',
                    data: [],
                    backgroundColor: 'rgba(181, 222, 204, 0.80)', // Turquoise
                    borderColor: WADA305.turquoiseBorder,
                    borderWidth: 2,
                    fill: '-1',
                    tension: 0.25,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#0f172a',
                    bodyColor: '#334155',
                    borderColor: '#cbd5e1',
                    borderWidth: 1,
                    padding: 12,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const point = currentCompoundTimeline[index];
                            if (!point) return '';

                            if (context.datasetIndex === 0) {
                                return ` Initial Principal: $${point.initial.toLocaleString()}`;
                            } else if (context.datasetIndex === 1) {
                                return ` Added Deposits: $${point.contributions.toLocaleString()}`;
                            } else if (context.datasetIndex === 2) {
                                return ` Compound Interest: $${point.interest.toLocaleString()}`;
                            }
                            return '';
                        },
                        footer: function (tooltipItems) {
                            if (tooltipItems.length === 0) return '';
                            const index = tooltipItems[0].dataIndex;
                            const point = currentCompoundTimeline[index];
                            if (!point) return '';
                            return `\nTotal Balance: $${point.total.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    ticks: { color: '#64748b', maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }
                },
                y: {
                    stacked: false,
                    grid: { color: 'rgba(226, 232, 240, 0.8)' },
                    ticks: {
                        color: '#64748b',
                        callback: function (val) {
                            if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                            if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                            return `$${val}`;
                        }
                    }
                }
            }
        }
    });
}

function updateCompoundCalculator() {
    const principal = parseCurrency(ciPrincipalInput.value);
    const monthlyDeposit = parseCurrency(ciMonthlyInput.value);
    const years = Math.max(1, Math.min(60, Number(ciYearsInput.value) || 25));
    const annualRate = (Number(ciRateInput.value) || 0) / 100;
    const compoundsPerYear = Number(ciFrequencySelect.value) || 12;

    const result = calculateCompoundInterest(
        principal,
        monthlyDeposit,
        annualRate,
        years,
        compoundsPerYear
    );

    currentCompoundTimeline = result.timeline;

    ciBalanceDisplay.textContent = `$${result.finalBalance.toLocaleString()}`;
    ciDepositedDisplay.textContent = `$${result.totalDeposited.toLocaleString()}`;
    ciInterestDisplay.textContent = `$${result.totalInterest.toLocaleString()}`;
    ciMultiplierBadge.textContent = `${result.growthMultiplier}x Growth`;
    ciPercentBadge.textContent = `${result.interestPercentage}% of wealth`;
    ciHighlightBadge.textContent = `${years} Years Horizon`;

    ciFactSentence.innerHTML = `In <strong>${years} years</strong>, compound interest generates <strong>$${result.totalInterest.toLocaleString()}</strong> in passive returns (${result.interestPercentage}% of total wealth). Your deposits of $${result.totalDeposited.toLocaleString()} multiply by <strong>${result.growthMultiplier}x</strong>!`;

    if (compoundChart) {
        compoundChart.data.labels = result.timeline.map(p => `Year ${p.year}`);
        compoundChart.data.datasets[0].data = result.timeline.map(p => p.initial);
        compoundChart.data.datasets[1].data = result.timeline.map(p => p.initial + p.contributions);
        compoundChart.data.datasets[2].data = result.timeline.map(p => p.total);
        compoundChart.update();
    }
}

[ciPrincipalInput, ciMonthlyInput].forEach(input => {
    input.addEventListener('input', handleCiCurrencyInput);
});

[ciYearsInput, ciRateInput].forEach(input => {
    input.addEventListener('input', updateCompoundCalculator);
});

ciFrequencySelect.addEventListener('change', updateCompoundCalculator);

// ============================================================================
// TAB 4: WHAT'S HAPPENING TODAY CONTROLLER
// ============================================================================
// Year Progress
const yearProgressLabel = document.getElementById('yearProgressLabel');
const yearProgressPercent = document.getElementById('yearProgressPercent');
const yearProgressBar = document.getElementById('yearProgressBar');
const yearStartLabel = document.getElementById('yearStartLabel');
const yearDaysLeft = document.getElementById('yearDaysLeft');

// S&P 500 & Fear/Greed
const sp500Price = document.getElementById('sp500Price');
const sp500Change = document.getElementById('sp500Change');
const sp500Details = document.getElementById('sp500Details');
const fearGreedBadge = document.getElementById('fearGreedBadge');

// Google
const googlPrice = document.getElementById('googlPrice');
const googlChange = document.getElementById('googlChange');
const googlDetails = document.getElementById('googlDetails');

// Bitcoin
const btcPrice = document.getElementById('btcPrice');
const btcChange = document.getElementById('btcChange');
const btcDetails = document.getElementById('btcDetails');

// 30-Year Mortgage
const mortgageRate = document.getElementById('mortgageRate');
const mortgageTrend = document.getElementById('mortgageTrend');
const mortgageDetails = document.getElementById('mortgageDetails');

// Bay Area Gas
const gasPrice = document.getElementById('gasPrice');
const gasDetails = document.getElementById('gasDetails');

// Mountain View Weather, AQI & Sunset
const weatherTemp = document.getElementById('weatherTemp');
const weatherCondition = document.getElementById('weatherCondition');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDetails = document.getElementById('weatherDetails');
const weatherAqiBadge = document.getElementById('weatherAqiBadge');
const weatherSunset = document.getElementById('weatherSunset');

// NASA APOD
const nasaApodImage = document.getElementById('nasaApodImage');
const nasaApodTitle = document.getElementById('nasaApodTitle');
const nasaApodExplanation = document.getElementById('nasaApodExplanation');

// Refresh Button & Timestamp
const todayTimestamp = document.getElementById('todayTimestamp');
const btnRefreshToday = document.getElementById('btnRefreshToday');
const refreshIcon = document.getElementById('refreshIcon');

async function refreshTodayDashboard() {
    if (refreshIcon) refreshIcon.classList.add('animate-spin');

    // 0. Update Year Progress (Instant client calculation)
    try {
        const yr = getYearProgress();
        if (yearProgressLabel) yearProgressLabel.textContent = `${yr.year} Year Progress`;
        if (yearProgressPercent) yearProgressPercent.textContent = `${yr.percent}% Complete`;
        if (yearProgressBar) yearProgressBar.style.width = `${yr.percent}%`;
        if (yearStartLabel) {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
            yearStartLabel.textContent = `Day ${dayOfYear} of 365`;
        }
        if (yearDaysLeft) yearDaysLeft.textContent = `${yr.daysLeft} days remaining in ${yr.year}`;
    } catch (e) {
        console.warn('Year progress calculation note:', e);
    }

    try {
        // Fetch weather, markets, and NASA APOD concurrently
        const [weather, markets, apod] = await Promise.all([
            fetchMountainViewFull(),
            fetchMarketsAndCrypto(),
            fetchNasaApod()
        ]);

        // 1. Mountain View Weather + AQI + Sunset
        if (weatherTemp) weatherTemp.textContent = weather.temp;
        if (weatherCondition) weatherCondition.textContent = weather.condition;
        if (weatherIcon) weatherIcon.textContent = weather.icon;
        if (weatherDetails) weatherDetails.textContent = `${weather.apparent} • ${weather.details}`;
        if (weatherAqiBadge) {
            weatherAqiBadge.textContent = `AQI: ${weather.aqi} (${weather.aqiCategory})`;
            weatherAqiBadge.className = `text-xs font-bold px-2 py-0.5 rounded-md border ${weather.aqiColorClass}`;
        }
        if (weatherSunset) {
            weatherSunset.textContent = `${weather.sunsetTime} (${weather.sunsetCountdown})`;
        }

        // 2. S&P 500
        if (sp500Price) sp500Price.textContent = markets.sp500.price;
        if (sp500Change) {
            sp500Change.textContent = `${markets.sp500.change} (${markets.sp500.percent})`;
            sp500Change.className = markets.sp500.isPositive
                ? "text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300";
        }
        if (sp500Details) sp500Details.textContent = markets.sp500.range;

        // Fear & Greed under S&P 500
        if (fearGreedBadge) {
            fearGreedBadge.textContent = `${markets.fearAndGreed.score} • ${markets.fearAndGreed.label}`;
            fearGreedBadge.className = `text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${markets.fearAndGreed.badgeClass}`;
        }

        // 3. Google (GOOGL)
        if (googlPrice) googlPrice.textContent = markets.googl.price;
        if (googlChange) {
            googlChange.textContent = `${markets.googl.change} (${markets.googl.percent})`;
            googlChange.className = markets.googl.isPositive
                ? "text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300";
        }
        if (googlDetails) googlDetails.textContent = markets.googl.range;

        // 4. Bitcoin (BTC)
        if (btcPrice) btcPrice.textContent = markets.bitcoin.price;
        if (btcChange) {
            btcChange.textContent = `${markets.bitcoin.change} (${markets.bitcoin.percent})`;
            btcChange.className = markets.bitcoin.isPositive
                ? "text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300";
        }
        if (btcDetails) btcDetails.textContent = `${markets.bitcoin.high} • Coinbase Spot`;

        // 5. 30-Year Mortgage Rate
        if (mortgageRate) mortgageRate.textContent = markets.mortgage30.rate;
        if (mortgageTrend) mortgageTrend.textContent = markets.mortgage30.change;
        if (mortgageDetails) mortgageDetails.textContent = markets.mortgage30.trend;

        // 6. Bay Area Gas Price
        if (gasPrice) gasPrice.textContent = markets.bayAreaGas.price;
        if (gasDetails) gasDetails.textContent = `${markets.bayAreaGas.type} • ${markets.bayAreaGas.trend}`;

        // 7. NASA APOD
        if (apod) {
            if (nasaApodImage && apod.imageUrl) {
                nasaApodImage.src = apod.imageUrl;
                nasaApodImage.alt = apod.title;
            }
            if (nasaApodTitle && apod.title) nasaApodTitle.textContent = apod.title;
            if (nasaApodExplanation && apod.explanation) nasaApodExplanation.textContent = apod.explanation;
        }

        if (todayTimestamp) {
            todayTimestamp.textContent = `Updated at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
    } catch (err) {
        console.error('Error refreshing Today dashboard:', err);
    } finally {
        if (refreshIcon) {
            setTimeout(() => refreshIcon.classList.remove('animate-spin'), 400);
        }
    }
}

if (btnRefreshToday) {
    btnRefreshToday.addEventListener('click', refreshTodayDashboard);
}

// Cat Interaction (Meow / Purr Speech Bubble)
const pixelCatContainer = document.getElementById('pixelCatContainer');
if (pixelCatContainer) {
    const meowQuotes = [
        "meow! 🐾",
        "purrrrr... 🐱",
        "checking Loren's stuff! 📈",
        "don't forget to stay hydrated! 💧",
        "market looking fluffy today ✨",
        "mrrp? 🐟"
    ];
    let bubbleTimeout = null;

    pixelCatContainer.addEventListener('click', () => {
        // Remove existing bubble if any
        const existingBubble = document.getElementById('catSpeechBubble');
        if (existingBubble) existingBubble.remove();
        if (bubbleTimeout) clearTimeout(bubbleTimeout);

        const bubble = document.createElement('div');
        bubble.id = 'catSpeechBubble';
        bubble.className = 'absolute -top-8 left-6 bg-white border border-slate-300 shadow-md text-[11px] font-bold text-slate-800 px-2.5 py-1 rounded-xl whitespace-nowrap animate-bounce z-50 pointer-events-none';
        bubble.textContent = meowQuotes[Math.floor(Math.random() * meowQuotes.length)];
        pixelCatContainer.appendChild(bubble);

        bubbleTimeout = setTimeout(() => {
            if (bubble) bubble.remove();
        }, 2400);
    });
}

// ============================================================================
// APP START
// ============================================================================
initFireChart();
updateFireCalculator();
updateMetabolicCalculator();
switchTab('today');