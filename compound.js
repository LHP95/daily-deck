/**
 * ============================================================================
 * COMPOUND INTEREST MATH ENGINE
 * ============================================================================
 * Formulas:
 * Future Value of Principal: P * (1 + r/n)^(n*t)
 * Future Value of Series (Contributions): PMT * [((1 + r/n)^(n*t) - 1) / (r/n)]
 */

/**
 * 1. Calculate Compound Interest Over Time with Year-by-Year Snapshots
 * 
 * @param {number} principal - Initial starting amount ($)
 * @param {number} monthlyContribution - Regular monthly deposit ($)
 * @param {number} annualRate - Annual interest rate as decimal (e.g. 0.08 = 8%)
 * @param {number} years - Time horizon in years
 * @param {number} compoundsPerYear - 12 (monthly), 4 (quarterly), 1 (annually), 365 (daily)
 * @returns {Object} Comprehensive compound interest breakdown & yearly timeline
 */
function calculateCompoundInterest(
    principal,
    monthlyContribution,
    annualRate,
    years,
    compoundsPerYear = 12
) {
    const ratePerPeriod = annualRate / compoundsPerYear;
    const totalPeriods = years * compoundsPerYear;
    const periodsPerYear = compoundsPerYear;
    const monthlyDeposit = monthlyContribution;

    let balance = principal;
    let totalDeposited = principal;
    const yearlyTimeline = [];

    // Snapshot at Year 0
    yearlyTimeline.push({
        year: 0,
        initial: Math.round(principal),
        contributions: 0,
        interest: 0,
        total: Math.round(principal)
    });

    // Simulate period-by-period for accuracy with different compound frequencies
    const periodsPerMonth = compoundsPerYear / 12;

    for (let month = 1; month <= years * 12; month++) {
        // Add monthly contribution
        balance += monthlyDeposit;
        totalDeposited += monthlyDeposit;

        // Apply compounding for periods in this month
        // (For standard monthly, periodsPerMonth is 1)
        if (compoundsPerYear === 12) {
            balance += balance * ratePerPeriod;
        } else {
            // For other frequencies, compound proportionally
            const monthlyEffectiveRate = Math.pow(1 + ratePerPeriod, periodsPerMonth) - 1;
            balance += balance * monthlyEffectiveRate;
        }

        // Save snapshot at the end of each year
        if (month % 12 === 0) {
            const currentYear = month / 12;
            const totalContributedOnly = totalDeposited - principal;
            const interestEarned = Math.max(0, balance - totalDeposited);

            yearlyTimeline.push({
                year: currentYear,
                initial: Math.round(principal),
                contributions: Math.round(totalContributedOnly),
                interest: Math.round(interestEarned),
                total: Math.round(balance)
            });
        }
    }

    const finalBalance = Math.round(balance);
    const finalTotalDeposited = Math.round(totalDeposited);
    const finalInterest = Math.max(0, finalBalance - finalTotalDeposited);
    const growthMultiplier = totalDeposited > 0 ? (finalBalance / totalDeposited).toFixed(1) : 0;
    const interestPercentage = finalBalance > 0 ? Math.round((finalInterest / finalBalance) * 100) : 0;

    return {
        finalBalance: finalBalance,
        totalDeposited: finalTotalDeposited,
        totalInterest: finalInterest,
        initialPrincipal: Math.round(principal),
        totalContributions: Math.round(finalTotalDeposited - principal),
        growthMultiplier: growthMultiplier,
        interestPercentage: interestPercentage,
        timeline: yearlyTimeline
    };
}
