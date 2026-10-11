/**
 * ============================================================================
 * RENT VS. BUY WEALTH ENGINE
 * ============================================================================
 * Compares two long-term wealth paths:
 * 1. Buying a home:
 *    - Down payment & closing costs paid upfront
 *    - Monthly payment: Principal + Interest (amortized loan) + Property Tax + Home Insurance + HOA + Maintenance
 *    - Over time: Home appreciates, mortgage principal is paid down, equity builds
 *    - Net wealth = Home market value - Remaining loan balance - Future selling closing costs (~6%)
 *
 * 2. Renting & investing the difference:
 *    - Down payment (+ closing costs) invested immediately in index funds (e.g., 7-8% return)
 *    - Each month: If buying costs more than renting (mortgage + HOA + taxes + repairs > rent),
 *      the renter invests that monthly savings into the market.
 *    - Over time: Investment portfolio compounds.
 *    - Net wealth = Total portfolio balance
 */

function calculateRentVsBuy({
    homePrice = 850000,
    downPayment = 170000,       // 20% default
    mortgageRate = 6.8,         // Annual interest rate %
    loanTermYears = 30,         // 30-year fixed
    propertyTaxRate = 1.1,      // Annual % of home value (CA avg ~1.1%)
    homeInsuranceAnnual = 1800, // Annual insurance
    hoaMonthly = 350,           // Monthly HOA
    maintenanceAnnualRate = 1.0,// % of home value / year for repairs
    homeAppreciationRate = 3.5, // Annual home value appreciation %
    
    initialRentMonthly = 3200,  // Monthly rent
    rentInflationRate = 3.0,    // Annual rent increase %
    investmentReturnRate = 7.5, // Annual stock market return %
    horizonYears = 15           // Simulation horizon
}) {
    const loanAmount = Math.max(0, homePrice - downPayment);
    const monthlyMortgageRate = (mortgageRate / 100) / 12;
    const totalPayments = loanTermYears * 12;

    // Monthly principal & interest (P&I)
    let monthlyPI = 0;
    if (monthlyMortgageRate > 0 && totalPayments > 0 && loanAmount > 0) {
        monthlyPI = loanAmount * (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, totalPayments)) /
                    (Math.pow(1 + monthlyMortgageRate, totalPayments) - 1);
    } else if (loanAmount > 0) {
        monthlyPI = loanAmount / (loanTermYears * 12);
    }

    const monthlyPropertyTax = (homePrice * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = homeInsuranceAnnual / 12;
    const monthlyMaintenance = (homePrice * (maintenanceAnnualRate / 100)) / 12;
    
    // Initial Month 1 Total Housing Outlay for Buyer
    const initialBuyerMonthlyOutlay = monthlyPI + monthlyPropertyTax + monthlyInsurance + hoaMonthly + monthlyMaintenance;
    const initialMonthlyDiff = initialBuyerMonthlyOutlay - initialRentMonthly;

    // Simulation year by year
    let currentHomeValue = homePrice;
    let remainingLoan = loanAmount;
    let currentRent = initialRentMonthly;
    let renterPortfolio = downPayment; // Renter starts with down payment in stocks
    let buyerTotalSpent = downPayment;
    let renterTotalSpent = 0;

    const timeline = [];
    const monthlyStockReturn = Math.pow(1 + (investmentReturnRate / 100), 1 / 12) - 1;

    timeline.push({
        year: 0,
        homeValue: Math.round(currentHomeValue),
        remainingLoan: Math.round(remainingLoan),
        buyerEquity: Math.round(downPayment),
        buyerNetWealth: Math.round(downPayment * 0.94), // accounting for closing fee
        renterPortfolio: Math.round(renterPortfolio),
        rentMonthly: Math.round(currentRent),
        buyerMonthly: Math.round(initialBuyerMonthlyOutlay)
    });

    for (let yr = 1; yr <= horizonYears; yr++) {
        // Run 12 months for this year
        for (let m = 1; m <= 12; m++) {
            // Buyer amortization
            if (remainingLoan > 0) {
                const interestPayment = remainingLoan * monthlyMortgageRate;
                const principalPayment = Math.min(remainingLoan, monthlyPI - interestPayment);
                remainingLoan = Math.max(0, remainingLoan - principalPayment);
            }

            // Buyer expenses this month
            const monthTax = (currentHomeValue * (propertyTaxRate / 100)) / 12;
            const monthMaint = (currentHomeValue * (maintenanceAnnualRate / 100)) / 12;
            const buyerMonthlyCost = monthlyPI + monthTax + monthlyInsurance + hoaMonthly + monthMaint;
            buyerTotalSpent += buyerMonthlyCost;

            // Renter expenses this month
            renterTotalSpent += currentRent;

            // Renter investment contribution: difference between buyer outlay and rent
            const renterSavings = buyerMonthlyCost - currentRent;
            renterPortfolio = (renterPortfolio * (1 + monthlyStockReturn)) + (renterSavings > 0 ? renterSavings : 0);

            // If rent ever exceeds buyer outlay, buyer could invest difference, but buyer portfolio tracked inside home equity
        }

        // End of year adjustments
        currentHomeValue *= (1 + (homeAppreciationRate / 100));
        currentRent *= (1 + (rentInflationRate / 100));

        // Selling closing cost ~6% (realtor fees, transfer taxes)
        const buyerNetProceeds = Math.max(0, (currentHomeValue * 0.94) - remainingLoan);

        timeline.push({
            year: yr,
            homeValue: Math.round(currentHomeValue),
            remainingLoan: Math.round(remainingLoan),
            buyerEquity: Math.round(currentHomeValue - remainingLoan),
            buyerNetWealth: Math.round(buyerNetProceeds),
            renterPortfolio: Math.round(renterPortfolio),
            rentMonthly: Math.round(currentRent),
            buyerMonthly: Math.round(monthlyPI + ((currentHomeValue * (propertyTaxRate / 100)) / 12) + monthlyInsurance + hoaMonthly + ((currentHomeValue * (maintenanceAnnualRate / 100)) / 12))
        });
    }

    const finalPoint = timeline[timeline.length - 1];
    const buyerAhead = finalPoint.buyerNetWealth >= finalPoint.renterPortfolio;
    const diffNetWealth = Math.abs(finalPoint.buyerNetWealth - finalPoint.renterPortfolio);

    // Find crossover year if any
    let crossoverYear = null;
    for (let i = 1; i < timeline.length; i++) {
        if (timeline[i].buyerNetWealth > timeline[i].renterPortfolio && timeline[i - 1].buyerNetWealth <= timeline[i - 1].renterPortfolio) {
            crossoverYear = timeline[i].year;
            break;
        }
    }

    return {
        initialBuyerMonthlyOutlay: Math.round(initialBuyerMonthlyOutlay),
        monthlyPI: Math.round(monthlyPI),
        initialRentMonthly: Math.round(initialRentMonthly),
        initialMonthlyDiff: Math.round(initialMonthlyDiff),
        buyerFinalNetWealth: finalPoint.buyerNetWealth,
        renterFinalNetWealth: finalPoint.renterPortfolio,
        buyerAhead: buyerAhead,
        diffNetWealth: Math.round(diffNetWealth),
        crossoverYear: crossoverYear,
        timeline: timeline
    };
}
