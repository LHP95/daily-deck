/**
 * ============================================================================
 * METABOLIC & CALORIC DEFICIT MATH ENGINE
 * ============================================================================
 * Uses the clinically validated Mifflin-St Jeor formula for BMR,
 * standard Katch-McArdle activity multipliers for TDEE, and WHO BMI scales.
 */

/**
 * 1. Calculate Basal Metabolic Rate (BMR) via Mifflin-St Jeor
 * 
 * @param {string} sex - 'male' or 'female'
 * @param {number} weightLbs - Weight in pounds
 * @param {number} heightFeet - Feet
 * @param {number} heightInches - Additional inches
 * @param {number} age - Age in years
 * @returns {number} BMR (calories burned at total rest)
 */
function calculateBmr(sex, weightLbs, heightFeet, heightInches, age) {
    const weightKg = weightLbs * 0.45359237;
    const totalInches = (heightFeet * 12) + heightInches;
    const heightCm = totalInches * 2.54;

    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);

    if (sex === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    return Math.round(bmr);
}

/**
 * 2. Calculate Total Daily Energy Expenditure (TDEE)
 * 
 * @param {number} bmr - Basal Metabolic Rate
 * @param {number} activityMultiplier - 1.2 (Sedentary) to 1.9 (Athlete)
 * @returns {number} Daily maintenance calories
 */
function calculateTdee(bmr, activityMultiplier) {
    return Math.round(bmr * activityMultiplier);
}

/**
 * 3. Calculate Body Mass Index (BMI) & Category
 * 
 * Formula: 703 * (weight_lbs / (height_inches^2))
 */
function calculateBmi(weightLbs, heightFeet, heightInches) {
    const totalInches = (heightFeet * 12) + heightInches;
    if (totalInches <= 0 || weightLbs <= 0) {
        return { bmi: 0, category: '—', colorClass: 'text-slate-500' };
    }

    const bmi = (703 * weightLbs) / (totalInches * totalInches);
    const roundedBmi = Math.round(bmi * 10) / 10;

    let category = 'Normal';
    let colorClass = 'text-emerald-700 bg-emerald-100 border-emerald-300';

    if (roundedBmi < 18.5) {
        category = 'Underweight';
        colorClass = 'text-amber-800 bg-amber-100 border-amber-300';
    } else if (roundedBmi >= 18.5 && roundedBmi <= 24.9) {
        category = 'Normal Weight';
        colorClass = 'text-emerald-800 bg-emerald-100 border-emerald-300';
    } else if (roundedBmi >= 25 && roundedBmi <= 29.9) {
        category = 'Overweight';
        colorClass = 'text-amber-800 bg-amber-100 border-amber-300';
    } else {
        category = 'Obese';
        colorClass = 'text-rose-800 bg-rose-100 border-rose-300';
    }

    return {
        bmi: roundedBmi,
        category: category,
        colorClass: colorClass
    };
}

/**
 * 4. Calculate Caloric Deficit Targets & Macro Splits
 * 
 * 1 lb of body fat ~= 3,500 kcal
 * Deficit 250 kcal/day  => -0.5 lb / week
 * Deficit 500 kcal/day  => -1.0 lb / week
 * Deficit 750 kcal/day  => -1.5 lb / week
 */
function calculateDeficitTargets(tdee, deficitCalories) {
    const targetCalories = Math.max(1000, tdee - deficitCalories);
    const weeklyLossLbs = Math.round((deficitCalories * 7 / 3500) * 10) / 10;

    // Macro split: 30% Protein (4 kcal/g), 40% Carbs (4 kcal/g), 30% Fat (9 kcal/g)
    const proteinGrams = Math.round((targetCalories * 0.30) / 4);
    const carbsGrams = Math.round((targetCalories * 0.40) / 4);
    const fatGrams = Math.round((targetCalories * 0.30) / 9);

    return {
        targetCalories: targetCalories,
        deficitCalories: deficitCalories,
        weeklyLossLbs: weeklyLossLbs,
        macros: {
            protein: proteinGrams,
            carbs: carbsGrams,
            fat: fatGrams
        }
    };
}
