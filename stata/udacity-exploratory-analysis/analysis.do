clear
import delimited "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\data-condensed\CSV\Alternative Creds Baseline Attitudinal.csv"

// tab/gen ref: https://stats.idre.ucla.edu/stata/faq/how-can-i-create-dummy-variables-in-stata/ */
// destring. ref: https://www.reed.edu/psychology/stata/gs/tutorials/destring.html
tab region, gen(_region)
tab income, gen(_income)
tab stem, gen(_stem)
tab industry, gen(_industry)
tab age, gen(_age)

drop region
drop income
drop stem
drop industry
drop age

// which sample var
gen boughtSample = 0
replace boughtSample = 1 if _region1 != .

// generate continuous age
gen cage1 = 1 if _age1 == 1
replace cage = 2 if _age2 == 1
replace cage = 3 if _age3 == 1
replace cage = 4 if _age4 == 1
gen cage2 = cage1*cage1
gen cage3 = cage1*cage1*cage1

// generate continuous income
gen cincome1 = 1 if _income1 == 1
replace cincome = 2 if _income2 == 1
replace cincome = 3 if _income3 == 1
replace cincome = 4 if _income4 == 1
replace cincome = 5 if _income5 == 1
replace cincome = 6 if _income6 == 1
replace cincome = 7 if _income7 == 1
replace cincome = 8 if _income8 == 1
replace cincome = 9 if _income9 == 1
replace cincome = 10 if _income10 == 1
replace cincome = 11 if _income11 == 1
gen cincome2 = cincome1*cincome1
gen cincome3 = cincome1*cincome1*cincome1

// reg exploration
reg q2 employer unemployed provider male _region* _income* _stem* _industry* _age* boughtSample     // employer pref w correction, intial; not significant factor
reg q3 employer unemployed provider male _region* _income* _stem* _industry* _age* boughtSample     // q3 is more predictable than q2 (R^2 .7, adjusted is awful)
reg q2 employer                                                                                     // In a simple regression, employers are more positive than average!

// notice industry effects are very different from q2 and q3; as expected: law, accounting, and health are bad for entry level by alt; unexpected is transportation



// understanding q3;
// only _industry12 was significant; _industry6 is it; construct 'bad industries' group
drop _industry1
drop _industry2

