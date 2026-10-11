/**
 * ============================================================================
 * FI/RE CALCULATOR - FINANCIAL MATH ENGINE
 * ============================================================================
 */

/**
 * 1. Calculate the "FI Number" (Target Portfolio)
 * Formula: Annual Expenses / Safe Withdrawal Rate (e.g., 0.04 for 4%)
 */
function calculateFiNumber(annualExpenses, swrRate = 0.04) {
    if (swrRate <= 0) return 0;
    return annualExpenses / swrRate;
}

/**
 * 2. Calculate Coast FI target needed at a specific age
 * 
 * Coast FI means your existing investments will grow to hit your full FI number
 * by targetCoastAge with ZERO additional contributions needed.
 * 
 * Formula: FI Target / (1 + r)^(yearsUntilCoastAge)
 */
function calculateCoastFiTargetAtAge(fiTarget, age, targetCoastAge, annualReturnRate) {
    if (age >= targetCoastAge) return fiTarget;
    const yearsRemaining = targetCoastAge - age;
    return fiTarget / Math.pow(1 + annualReturnRate, yearsRemaining);
}

/**
 * 3. Find when Coast FI is achieved (months, years, age)
 */
function calculateTimeToCoastFi(
    currentAge,
    targetCoastAge,
    currentNetWorth,
    monthlyContribution,
    annualExpenses,
    annualReturnRate = 0.07,
    swrRate = 0.04
) {
    const fiTarget = calculateFiNumber(annualExpenses, swrRate);
    const monthlyRate = annualReturnRate / 12;

    // Coast target right now
    const currentCoastTarget = calculateCoastFiTargetAtAge(fiTarget, currentAge, targetCoastAge, annualReturnRate);

    // If already at or above Coast FI target
    if (currentNetWorth >= currentCoastTarget) {
        return {
            alreadyReached: true,
            currentCoastTarget: Math.round(currentCoastTarget),
            totalMonths: 0,
            years: 0,
            remainingMonths: 0,
            reachAge: currentAge
        };
    }

    let balance = currentNetWorth;
    let months = 0;
    const maxMonths = Math.max(1, (targetCoastAge - currentAge) * 12);

    while (months < maxMonths) {
        months++;
        balance += balance * monthlyRate;
        balance += monthlyContribution;

        const ageAtMonth = currentAge + (months / 12);
        const requiredCoastAtMonth = calculateCoastFiTargetAtAge(fiTarget, ageAtMonth, targetCoastAge, annualReturnRate);

        if (balance >= requiredCoastAtMonth) {
            return {
                alreadyReached: false,
                currentCoastTarget: Math.round(currentCoastTarget),
                totalMonths: months,
                years: Math.floor(months / 12),
                remainingMonths: months % 12,
                reachAge: Math.round(ageAtMonth * 10) / 10,
                finalBalance: Math.round(balance)
            };
        }
    }

    return {
        alreadyReached: false,
        currentCoastTarget: Math.round(currentCoastTarget),
        totalMonths: Infinity,
        years: Infinity,
        remainingMonths: 0,
        reachAge: null
    };
}

/**
 * 4. Calculate Full Time to FI (Months, Years, Age)
 */
function calculateTimeToFi(
    currentAge,
    currentNetWorth,
    monthlyContribution,
    annualExpenses,
    annualReturnRate = 0.07,
    swrRate = 0.04
) {
    const targetFiNumber = calculateFiNumber(annualExpenses, swrRate);
    const monthlyRate = annualReturnRate / 12;

    if (currentNetWorth >= targetFiNumber) {
        return {
            targetFiNumber: Math.round(targetFiNumber),
            totalMonths: 0,
            years: 0,
            remainingMonths: 0,
            retireAge: currentAge,
            alreadyReached: true
        };
    }

    if (monthlyContribution <= 0 && annualReturnRate <= 0) {
        return {
            targetFiNumber: Math.round(targetFiNumber),
            totalMonths: Infinity,
            years: Infinity,
            remainingMonths: 0,
            retireAge: null,
            alreadyReached: false
        };
    }

    let balance = currentNetWorth;
    let months = 0;
    const maxMonths = 1200; // 100 years cap

    while (balance < targetFiNumber && months < maxMonths) {
        months++;
        balance += balance * monthlyRate;
        balance += monthlyContribution;
    }

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    const retireAge = Math.round((currentAge + months / 12) * 10) / 10;

    return {
        targetFiNumber: Math.round(targetFiNumber),
        totalMonths: months,
        years: years,
        remainingMonths: remainingMonths,
        retireAge: retireAge,
        finalBalance: Math.round(balance),
        alreadyReached: false
    };
}

/**
 * 5. Simulate Growth for Chart (Age-based breakdown: Initial, Saved, Returns)
 */
function simulateGrowthTimeline(
    currentAge,
    startingNetWorth,
    monthlyContribution,
    annualReturnRate,
    simYears
) {
    const monthlyRate = annualReturnRate / 12;
    const totalMonths = Math.min(600, Math.max(12, simYears * 12)); // At least 1 yr, up to 50 yrs

    let balance = startingNetWorth;
    let totalContributedOnly = 0;

    const timeline = [];

    // Snapshot at Year 0 (Current Age)
    timeline.push({
        year: 0,
        age: currentAge,
        initial: Math.round(startingNetWorth),
        saved: 0,
        returns: 0,
        total: Math.round(startingNetWorth)
    });

    for (let month = 1; month <= totalMonths; month++) {
        balance += balance * monthlyRate;
        balance += monthlyContribution;
        totalContributedOnly += monthlyContribution;

        // Snapshot at each year
        if (month % 12 === 0) {
            const yr = month / 12;
            const returns = Math.max(0, balance - (startingNetWorth + totalContributedOnly));

            timeline.push({
                year: yr,
                age: currentAge + yr,
                initial: Math.round(startingNetWorth),
                saved: Math.round(totalContributedOnly),
                returns: Math.round(returns),
                total: Math.round(balance)
            });
        }
    }

    return timeline;
}

/**
 * 6. Simulate Retirement Decumulation & Ending Portfolio (FI Calc style)
 * 
 * Simulates portfolio from retirement age until age 90 using a historical
 * balanced retirement portfolio assumption (e.g. ~5.5% real return).
 * 
 * @param {number} retireAge - Age when full FI is reached
 * @param {number} startingPortfolio - Portfolio at retirement ($)
 * @param {number} annualExpenses - Annual spending ($)
 * @param {number} targetEndAge - Age at end of retirement (default 90)
 * @param {number} postRetirementReturn - Conservative real return in retirement (default 0.055)
 */
function calculateEndingPortfolio(
    retireAge,
    startingPortfolio,
    annualExpenses,
    targetEndAge = 90,
    postRetirementReturn = 0.055
) {
    if (startingPortfolio <= 0 || annualExpenses <= 0) {
        return { 
            endingBalance: 0, 
            depleted: true, 
            depletedAge: retireAge, 
            yearsInRetirement: 0, 
            endAge: targetEndAge, 
            successRateEstimate: 0 
        };
    }

    const yearsInRetirement = Math.max(5, Math.round(targetEndAge - retireAge));
    let balance = startingPortfolio;
    let depleted = false;
    let depletedAge = null;

    for (let yr = 1; yr <= yearsInRetirement; yr++) {
        // Balance earns conservative retirement return, then annual living expenses are withdrawn
        balance = balance * (1 + postRetirementReturn) - annualExpenses;
        if (balance <= 0) {
            balance = 0;
            depleted = true;
            depletedAge = Math.round((retireAge + yr) * 10) / 10;
            break;
        }
    }

    // Historical success estimate based on withdrawal rate (Trinity Study / FI Calc benchmark)
    const currentSwr = annualExpenses / startingPortfolio;
    let successRate = 97;
    if (currentSwr <= 0.035) successRate = 100;
    else if (currentSwr <= 0.04) successRate = 97;
    else if (currentSwr <= 0.045) successRate = 89;
    else if (currentSwr <= 0.05) successRate = 77;
    else if (currentSwr <= 0.06) successRate = 54;
    else if (currentSwr <= 0.07) successRate = 32;
    else if (currentSwr <= 0.08) successRate = 18;
    else if (currentSwr <= 0.10) successRate = 5;
    else successRate = 1;

    return {
        endingBalance: Math.round(balance),
        depleted: depleted,
        depletedAge: depletedAge,
        yearsInRetirement: yearsInRetirement,
        endAge: targetEndAge,
        successRateEstimate: successRate
    };
}

