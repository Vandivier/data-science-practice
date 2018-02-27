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

// reg exploration
reg q2 employer unemployed provider male _region* _income* _stem* _industry* _age* boughtSample     // employer pref w correction, intial; not significant factor
reg q3 employer unemployed provider male _region* _income* _stem* _industry* _age* boughtSample     // q3 is more predictable than q2 (R^2 .7, adjusted is awful)

// TODO: charts w datasplash!
