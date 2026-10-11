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
const navBtnRentBuy = document.getElementById('navBtnRentBuy');
const navBtnToday = document.getElementById('navBtnToday');

const viewFire = document.getElementById('viewFire');
const viewMetabolic = document.getElementById('viewMetabolic');
const viewCompound = document.getElementById('viewCompound');
const viewRentBuy = document.getElementById('viewRentBuy');
const viewToday = document.getElementById('viewToday');

const ACTIVE_TAB_CLASS = "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition whitespace-nowrap bg-teal-50 text-wada-turquoiseDark border border-teal-200 shadow-sm w-full";
const INACTIVE_TAB_CLASS = "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-left transition whitespace-nowrap text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent w-full";

function switchTab(activeTab) {
    // Hide all
    viewFire.classList.add('hidden');
    viewMetabolic.classList.add('hidden');
    viewCompound.classList.add('hidden');
    if (viewRentBuy) viewRentBuy.classList.add('hidden');
    viewToday.classList.add('hidden');

    navBtnFire.className = INACTIVE_TAB_CLASS;
    navBtnMetabolic.className = INACTIVE_TAB_CLASS;
    navBtnCompound.className = INACTIVE_TAB_CLASS;
    if (navBtnRentBuy) navBtnRentBuy.className = INACTIVE_TAB_CLASS;
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
    } else if (activeTab === 'rentbuy') {
        if (viewRentBuy) viewRentBuy.classList.remove('hidden');
        if (navBtnRentBuy) navBtnRentBuy.className = ACTIVE_TAB_CLASS;
        if (!rentBuyChart) {
            initRentBuyChart();
        } else {
            rentBuyChart.resize();
        }
        updateRentBuyCalculator();
    } else if (activeTab === 'today') {
        viewToday.classList.remove('hidden');
        navBtnToday.className = ACTIVE_TAB_CLASS;
        refreshTodayDashboard();
    }
}

navBtnFire.addEventListener('click', () => switchTab('fire'));
navBtnMetabolic.addEventListener('click', () => switchTab('metabolic'));
navBtnCompound.addEventListener('click', () => switchTab('compound'));
if (navBtnRentBuy) navBtnRentBuy.addEventListener('click', () => switchTab('rentbuy'));
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
// TAB 5: RENT VS. BUY CONTROLLER
// ============================================================================
const rbHomePriceInput = document.getElementById('rbHomePrice');
const rbDownPercentInput = document.getElementById('rbDownPercent');
const rbDownDollarAmount = document.getElementById('rbDownDollarAmount');
const rbRentMonthlyInput = document.getElementById('rbRentMonthly');
const rbHoaMonthlyInput = document.getElementById('rbHoaMonthly');
const rbMortgageRateInput = document.getElementById('rbMortgageRate');
const rbReturnRateInput = document.getElementById('rbReturnRate');
const rbHorizonYearsInput = document.getElementById('rbHorizonYears');
const rbAppreciationRateInput = document.getElementById('rbAppreciationRate');

const rbWinnerDisplay = document.getElementById('rbWinnerDisplay');
const rbAdvantageBadge = document.getElementById('rbAdvantageBadge');
const rbMonthlyDiffDisplay = document.getElementById('rbMonthlyDiffDisplay');
const rbOutlaySubtext = document.getElementById('rbOutlaySubtext');
const rbCrossoverDisplay = document.getElementById('rbCrossoverDisplay');
const rbHorizonBadge = document.getElementById('rbHorizonBadge');
const rbInsightBadge = document.getElementById('rbInsightBadge');
const rbFactSentence = document.getElementById('rbFactSentence');

let rentBuyChart = null;
let currentRentBuyTimeline = [];

function handleRbCurrencyInput(e) {
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

    updateRentBuyCalculator();
}

function initRentBuyChart() {
    const canvas = document.getElementById('rentBuyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    rentBuyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Buyer Net Wealth',
                    data: [],
                    backgroundColor: 'rgba(181, 222, 204, 0.40)',
                    borderColor: '#1E6B57',
                    borderWidth: 2.5,
                    fill: 'origin',
                    tension: 0.2,
                    pointRadius: 0
                },
                {
                    label: 'Renter Investment Portfolio',
                    data: [],
                    backgroundColor: 'rgba(238, 180, 128, 0.35)',
                    borderColor: '#B86F35',
                    borderWidth: 2.5,
                    fill: 'origin',
                    tension: 0.2,
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
                    callbacks: {
                        label: function (context) {
                            const index = context.dataIndex;
                            const point = currentRentBuyTimeline[index];
                            if (!point) return '';
                            if (context.datasetIndex === 0) {
                                return ` Buyer Net Wealth: $${point.buyerNetWealth.toLocaleString()} (Home: $${point.homeValue.toLocaleString()})`;
                            } else if (context.datasetIndex === 1) {
                                return ` Renter Portfolio: $${point.renterPortfolio.toLocaleString()}`;
                            }
                            return '';
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

function updateRentBuyCalculator() {
    const homePrice = parseCurrency(rbHomePriceInput ? rbHomePriceInput.value : 850000) || 850000;
    const downPercent = Number(rbDownPercentInput ? rbDownPercentInput.value : 20) || 0;
    const downPayment = Math.round(homePrice * (downPercent / 100));

    if (rbDownDollarAmount) {
        rbDownDollarAmount.textContent = `$${downPayment.toLocaleString()}`;
    }

    const initialRentMonthly = parseCurrency(rbRentMonthlyInput ? rbRentMonthlyInput.value : 3200) || 3200;
    const hoaMonthly = parseCurrency(rbHoaMonthlyInput ? rbHoaMonthlyInput.value : 350);
    const mortgageRate = Number(rbMortgageRateInput ? rbMortgageRateInput.value : 6.8) || 6.8;
    const investmentReturnRate = Number(rbReturnRateInput ? rbReturnRateInput.value : 7.5) || 7.5;
    const horizonYears = Math.max(2, Math.min(30, Number(rbHorizonYearsInput ? rbHorizonYearsInput.value : 15) || 15));
    const homeAppreciationRate = Number(rbAppreciationRateInput ? rbAppreciationRateInput.value : 3.5) || 3.5;

    const result = calculateRentVsBuy({
        homePrice,
        downPayment,
        mortgageRate,
        loanTermYears: 30,
        propertyTaxRate: 1.1,
        homeInsuranceAnnual: 1800,
        hoaMonthly,
        maintenanceAnnualRate: 1.0,
        homeAppreciationRate,
        initialRentMonthly,
        rentInflationRate: 3.0,
        investmentReturnRate,
        horizonYears
    });

    currentRentBuyTimeline = result.timeline;

    if (rbWinnerDisplay) {
        rbWinnerDisplay.textContent = result.buyerAhead ? "Buying Wins 🏡" : "Renting Wins 📈";
        rbWinnerDisplay.className = result.buyerAhead
            ? "text-lg md:text-xl font-extrabold text-wada-turquoiseDark mt-1"
            : "text-lg md:text-xl font-extrabold text-wada-cinnamonDark mt-1";
    }

    if (rbAdvantageBadge) {
        rbAdvantageBadge.textContent = `+$${result.diffNetWealth.toLocaleString()} ahead`;
        rbAdvantageBadge.className = result.buyerAhead
            ? "text-[10px] text-emerald-700 font-bold"
            : "text-[10px] text-amber-700 font-bold";
    }

    if (rbMonthlyDiffDisplay) {
        const sign = result.initialMonthlyDiff >= 0 ? '+' : '-';
        rbMonthlyDiffDisplay.textContent = `${sign}$${Math.abs(result.initialMonthlyDiff).toLocaleString()}`;
    }

    if (rbOutlaySubtext) {
        rbOutlaySubtext.textContent = `Buy: $${result.initialBuyerMonthlyOutlay.toLocaleString()}/mo | Rent: $${result.initialRentMonthly.toLocaleString()}/mo`;
    }

    if (rbCrossoverDisplay) {
        rbCrossoverDisplay.textContent = result.crossoverYear ? `Year ${result.crossoverYear}` : "After 30+ Yrs";
    }

    if (rbHorizonBadge) {
        rbHorizonBadge.textContent = `${horizonYears} Years Horizon`;
    }

    if (rbInsightBadge) {
        rbInsightBadge.textContent = result.buyerAhead ? "Homeowner Advantage" : "Renter Wealth Advantage";
    }

    if (rbFactSentence) {
        if (result.buyerAhead) {
            rbFactSentence.innerHTML = `Over <strong>${horizonYears} years</strong>, renting at <strong>$${initialRentMonthly.toLocaleString()}/mo</strong> and investing the <strong>$${downPayment.toLocaleString()} down payment</strong> plus the monthly savings yields <strong>$${result.renterFinalNetWealth.toLocaleString()}</strong>. Buying builds <strong>$${result.buyerFinalNetWealth.toLocaleString()}</strong> in net home equity—buying comes out ahead by <strong>$${result.diffNetWealth.toLocaleString()}</strong>!`;
        } else {
            rbFactSentence.innerHTML = `Over <strong>${horizonYears} years</strong>, investing the <strong>$${downPayment.toLocaleString()} down payment</strong> and the monthly savings into index funds yields <strong>$${result.renterFinalNetWealth.toLocaleString()}</strong>. Buying builds <strong>$${result.buyerFinalNetWealth.toLocaleString()}</strong> in net home equity—renting and investing wins by <strong>$${result.diffNetWealth.toLocaleString()}</strong>!`;
        }
    }

    if (rentBuyChart) {
        rentBuyChart.data.labels = result.timeline.map(p => `Year ${p.year}`);
        rentBuyChart.data.datasets[0].data = result.timeline.map(p => p.buyerNetWealth);
        rentBuyChart.data.datasets[1].data = result.timeline.map(p => p.renterPortfolio);
        rentBuyChart.update();
    }
}

[rbHomePriceInput, rbRentMonthlyInput, rbHoaMonthlyInput].filter(Boolean).forEach(input => {
    input.addEventListener('input', handleRbCurrencyInput);
});

[rbDownPercentInput, rbMortgageRateInput, rbReturnRateInput, rbHorizonYearsInput, rbAppreciationRateInput].filter(Boolean).forEach(input => {
    input.addEventListener('input', updateRentBuyCalculator);
});

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

// Gas City Controls
const gasCitySelect = document.getElementById('gasCitySelect');
const gasCityHeading = document.getElementById('gasCityHeading');
const gasPrice = document.getElementById('gasPrice');
const gasDetails = document.getElementById('gasDetails');

let currentGasCity = localStorage.getItem('dailydeck_gas_city') || 'bay-area';

function updateGasDisplay() {
    const gas = getCityGasPrice(currentGasCity);
    if (gasCityHeading) gasCityHeading.textContent = gas.name;
    if (gasPrice) gasPrice.textContent = gas.price;
    if (gasDetails) gasDetails.textContent = `${gas.type} • ${gas.trend}`;
}

if (gasCitySelect) {
    gasCitySelect.value = currentGasCity;
    gasCitySelect.addEventListener('change', (e) => {
        currentGasCity = e.target.value;
        localStorage.setItem('dailydeck_gas_city', currentGasCity);
        updateGasDisplay();
    });
}

// City & Unit Weather Controls
const weatherCitySelect = document.getElementById('weatherCitySelect');
const weatherUnitToggle = document.getElementById('weatherUnitToggle');
const weatherCityHeading = document.getElementById('weatherCityHeading');
const weatherTemp = document.getElementById('weatherTemp');
const weatherCondition = document.getElementById('weatherCondition');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDetails = document.getElementById('weatherDetails');
const weatherAqiBadge = document.getElementById('weatherAqiBadge');
const weatherSunset = document.getElementById('weatherSunset');

let currentWeatherCity = localStorage.getItem('dailydeck_weather_city') || 'mountain-view';
let currentWeatherUnit = localStorage.getItem('dailydeck_weather_unit') || 'fahrenheit';

if (weatherCitySelect) {
    weatherCitySelect.value = currentWeatherCity;
    weatherCitySelect.addEventListener('change', (e) => {
        currentWeatherCity = e.target.value;
        localStorage.setItem('dailydeck_weather_city', currentWeatherCity);
        refreshWeatherOnly();
    });
}

if (weatherUnitToggle) {
    weatherUnitToggle.textContent = currentWeatherUnit === 'celsius' ? '°C' : '°F';
    weatherUnitToggle.addEventListener('click', () => {
        currentWeatherUnit = currentWeatherUnit === 'celsius' ? 'fahrenheit' : 'celsius';
        weatherUnitToggle.textContent = currentWeatherUnit === 'celsius' ? '°C' : '°F';
        localStorage.setItem('dailydeck_weather_unit', currentWeatherUnit);
        refreshWeatherOnly();
    });
}

async function refreshWeatherOnly() {
    try {
        const weather = await fetchCityWeather(currentWeatherCity, currentWeatherUnit);
        if (weatherCityHeading) weatherCityHeading.textContent = weather.cityName;
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
    } catch (e) {
        console.warn('Weather update note:', e);
    }
}

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
        // Fetch weather for selected city/unit, markets, and NASA APOD concurrently
        const [weather, markets, apod] = await Promise.all([
            fetchCityWeather(currentWeatherCity, currentWeatherUnit),
            fetchMarketsAndCrypto(),
            fetchNasaApod()
        ]);

        // 1. Weather + AQI + Sunset
        if (weatherCityHeading) weatherCityHeading.textContent = weather.cityName;
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

        // 6. Gas Price
        updateGasDisplay();

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

// ============================================================================
// LOCAL STORAGE PERSISTENCE ENGINE
// ============================================================================
function saveCalculatorInputs() {
    const data = {
        // FIRE
        age: ageInput ? ageInput.value : '',
        coastAge: coastAgeInput ? coastAgeInput.value : '',
        netWorth: netWorthInput ? netWorthInput.value : '',
        monthly: monthlyInput ? monthlyInput.value : '',
        expenses: expensesInput ? expensesInput.value : '',
        returns: returnInput ? returnInput.value : '',
        swr: swrInput ? swrInput.value : '',

        // Metabolic
        sex: selectedSex,
        metaAge: metaAgeInput ? metaAgeInput.value : '',
        metaWeight: metaWeightInput ? metaWeightInput.value : '',
        metaFeet: metaHeightFeetInput ? metaHeightFeetInput.value : '',
        metaInches: metaHeightInchesInput ? metaHeightInchesInput.value : '',
        metaActivity: metaActivitySelect ? metaActivitySelect.value : '',
        metaDeficit: metaDeficitGoalSelect ? metaDeficitGoalSelect.value : '',

        // Compound
        ciPrincipal: ciPrincipalInput ? ciPrincipalInput.value : '',
        ciMonthly: ciMonthlyInput ? ciMonthlyInput.value : '',
        ciYears: ciYearsInput ? ciYearsInput.value : '',
        ciRate: ciRateInput ? ciRateInput.value : '',
        ciFreq: ciFrequencySelect ? ciFrequencySelect.value : '',

        // Rent vs Buy
        rbHomePrice: rbHomePriceInput ? rbHomePriceInput.value : '',
        rbDownPercent: rbDownPercentInput ? rbDownPercentInput.value : '',
        rbRentMonthly: rbRentMonthlyInput ? rbRentMonthlyInput.value : '',
        rbHoaMonthly: rbHoaMonthlyInput ? rbHoaMonthlyInput.value : '',
        rbMortgageRate: rbMortgageRateInput ? rbMortgageRateInput.value : '',
        rbReturnRate: rbReturnRateInput ? rbReturnRateInput.value : '',
        rbHorizonYears: rbHorizonYearsInput ? rbHorizonYearsInput.value : '',
        rbAppreciationRate: rbAppreciationRateInput ? rbAppreciationRateInput.value : ''
    };

    try {
        localStorage.setItem('dailydeck_user_inputs', JSON.stringify(data));
    } catch (e) {
        console.warn('LocalStorage save error:', e);
    }
}

function loadCalculatorInputs() {
    try {
        const raw = localStorage.getItem('dailydeck_user_inputs');
        if (!raw) return;
        const data = JSON.parse(raw);

        // FIRE
        if (data.age && ageInput) ageInput.value = data.age;
        if (data.coastAge && coastAgeInput) coastAgeInput.value = data.coastAge;
        if (data.netWorth && netWorthInput) netWorthInput.value = data.netWorth;
        if (data.monthly && monthlyInput) monthlyInput.value = data.monthly;
        if (data.expenses && expensesInput) expensesInput.value = data.expenses;
        if (data.returns && returnInput) returnInput.value = data.returns;
        if (data.swr && swrInput) swrInput.value = data.swr;

        // Metabolic
        if (data.sex) setSex(data.sex);
        if (data.metaAge && metaAgeInput) metaAgeInput.value = data.metaAge;
        if (data.metaWeight && metaWeightInput) metaWeightInput.value = data.metaWeight;
        if (data.metaFeet && metaHeightFeetInput) metaHeightFeetInput.value = data.metaFeet;
        if (data.metaInches && metaHeightInchesInput) metaHeightInchesInput.value = data.metaInches;
        if (data.metaActivity && metaActivitySelect) metaActivitySelect.value = data.metaActivity;
        if (data.metaDeficit !== undefined && metaDeficitGoalSelect) metaDeficitGoalSelect.value = data.metaDeficit;

        // Compound
        if (data.ciPrincipal && ciPrincipalInput) ciPrincipalInput.value = data.ciPrincipal;
        if (data.ciMonthly && ciMonthlyInput) ciMonthlyInput.value = data.ciMonthly;
        if (data.ciYears && ciYearsInput) ciYearsInput.value = data.ciYears;
        if (data.ciRate && ciRateInput) ciRateInput.value = data.ciRate;
        if (data.ciFreq && ciFrequencySelect) ciFrequencySelect.value = data.ciFreq;

        // Rent vs Buy
        if (data.rbHomePrice && rbHomePriceInput) rbHomePriceInput.value = data.rbHomePrice;
        if (data.rbDownPercent && rbDownPercentInput) rbDownPercentInput.value = data.rbDownPercent;
        if (data.rbRentMonthly && rbRentMonthlyInput) rbRentMonthlyInput.value = data.rbRentMonthly;
        if (data.rbHoaMonthly && rbHoaMonthlyInput) rbHoaMonthlyInput.value = data.rbHoaMonthly;
        if (data.rbMortgageRate && rbMortgageRateInput) rbMortgageRateInput.value = data.rbMortgageRate;
        if (data.rbReturnRate && rbReturnRateInput) rbReturnRateInput.value = data.rbReturnRate;
        if (data.rbHorizonYears && rbHorizonYearsInput) rbHorizonYearsInput.value = data.rbHorizonYears;
        if (data.rbAppreciationRate && rbAppreciationRateInput) rbAppreciationRateInput.value = data.rbAppreciationRate;
    } catch (e) {
        console.warn('LocalStorage load error:', e);
    }
}

// Attach auto-save listener to all inputs
[
    ageInput, coastAgeInput, netWorthInput, monthlyInput, expensesInput, returnInput, swrInput,
    metaAgeInput, metaWeightInput, metaHeightFeetInput, metaHeightInchesInput, metaActivitySelect, metaDeficitGoalSelect,
    ciPrincipalInput, ciMonthlyInput, ciYearsInput, ciRateInput, ciFrequencySelect,
    rbHomePriceInput, rbDownPercentInput, rbRentMonthlyInput, rbHoaMonthlyInput,
    rbMortgageRateInput, rbReturnRateInput, rbHorizonYearsInput, rbAppreciationRateInput
].filter(Boolean).forEach(el => {
    el.addEventListener('input', saveCalculatorInputs);
    el.addEventListener('change', saveCalculatorInputs);
});

// ============================================================================
// PIXEL CAT COMPANION: MANUAL SLEEP BUTTON, NAPPING & PURRS
// ============================================================================
const pixelCatContainer = document.getElementById('pixelCatContainer');
const pixelCat = document.getElementById('pixelCat');
const catNapToggleBtn = document.getElementById('catNapToggleBtn');
const catNapIcon = document.getElementById('catNapIcon');
const catNapLabel = document.getElementById('catNapLabel');

if (pixelCatContainer && pixelCat) {
    const meowQuotes = [
        "meow! 🐾",
        "purrrrr... 🐱",
        "checking Daily Deck! 📈",
        "don't forget to stay hydrated! 💧",
        "market looking fluffy today ✨",
        "mrrp? 🐟"
    ];

    let bubbleTimeout = null;
    let isNapping = false;

    function showCatBubble(text) {
        const existingBubble = document.getElementById('catSpeechBubble');
        if (existingBubble) existingBubble.remove();
        if (bubbleTimeout) clearTimeout(bubbleTimeout);

        const bubble = document.createElement('div');
        bubble.id = 'catSpeechBubble';
        bubble.className = 'absolute -top-10 left-6 bg-white border border-slate-300 shadow-md text-[11px] font-bold text-slate-800 px-2.5 py-1 rounded-xl whitespace-nowrap animate-bounce z-50 pointer-events-none';
        bubble.textContent = text;
        pixelCatContainer.appendChild(bubble);

        bubbleTimeout = setTimeout(() => {
            if (bubble) bubble.remove();
        }, 2500);
    }

    function toggleCatNap() {
        isNapping = !isNapping;
        if (isNapping) {
            pixelCat.classList.add('cat-napping');
            if (catNapIcon) catNapIcon.textContent = '☀️';
            if (catNapLabel) catNapLabel.textContent = 'Wake';
            showCatBubble("zzzz... taking a cozy nap 💤");
        } else {
            pixelCat.classList.remove('cat-napping');
            if (catNapIcon) catNapIcon.textContent = '💤';
            if (catNapLabel) catNapLabel.textContent = 'Sleep';
            showCatBubble("yawn... I'm awake and strolling! 😺");
        }
    }

    if (catNapToggleBtn) {
        catNapToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCatNap();
        });
    }

    // Cat body click interaction
    pixelCat.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isNapping) {
            showCatBubble("snore... zzz 💤 (press Wake)");
        } else {
            showCatBubble(meowQuotes[Math.floor(Math.random() * meowQuotes.length)]);
        }
    });
}

// ============================================================================
// MOBILE PULL-TO-REFRESH DETECTOR
// ============================================================================
let touchStartY = 0;
let isPulling = false;

window.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        isPulling = true;
    } else {
        isPulling = false;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    if (diff > 85 && window.scrollY === 0) {
        isPulling = false;
        refreshTodayDashboard();
    }
}, { passive: true });

// ============================================================================
// APP START
// ============================================================================
loadCalculatorInputs();
initFireChart();
updateFireCalculator();
updateMetabolicCalculator();
updateRentBuyCalculator();
switchTab('today');