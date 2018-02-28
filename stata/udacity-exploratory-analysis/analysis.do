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

// refer to all questions EXCEPT variable of interest q2 with aq*
gen aq3 = q3
gen aq4 = q4
gen aq5 = q5
gen aq6 = q6

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

gen cprovider1 = providercount
gen cprovider2 = cprovider1*cprovider1
gen cprovider3 = cprovider1*cprovider1*cprovider1
drop providercount

// reg exploration, short
reg q2 q3                                                                                           // strong cross-correlation, but R^2 of only .2: Good!
reg q2 employer                                                                                     // In a simple regression, employers are more positive than average!
reg q2 q4                                                                                           // strong anti-innovation bias exists
reg q6 employer                                                                                     // strong anti-foreign bias by employers not found
reg q2 q6                                                                                           // strong nationalism doesn't really effect alt favorability
reg _stem3 _industry*                                                                               // IT professionals are uniquely unsure about whether they work in STEM

// reg exploration, long
reg q2 employer unemployed cprovider1 male _region* _income* _stem* _industry* _age* boughtSample     // employer pref w correction, intial; not significant factor
reg q3 employer unemployed cprovider1 male _region* _income* _stem* _industry* _age* boughtSample     // q3 is more predictable than q2 (R^2 .7, adjusted is awful)

// notice industry effects are very different from q2 and q3; as expected: law, accounting, and health are bad for entry level by alt; unexpected is transportation
// I will need to seperately analyze q2 and q3; therefore making seperate explore-* .do files

// all the tricks, just to see max R^2: It's .59. Not bad imo
reg q2 aq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*
