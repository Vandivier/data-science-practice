clear
import delimited "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\data-condensed\CSV\dropped-income-6.csv"

//import delimited "C:\Users\john.vandivier\workspace\data-science-practice\stata\udacity-exploratory-analysis\data-condensed\CSV\Alternative Creds Baseline Attitudinal.csv"

// tab/gen ref: https://stats.idre.ucla.edu/stata/faq/how-can-i-create-dummy-variables-in-stata/ */
// destring. ref: https://www.reed.edu/psychology/stata/gs/tutorials/destring.html
tab region, gen(_region)
tab income, gen(_income)
tab stem, gen(_stem)
tab industry, gen(_industry)
tab age, gen(_age)

// which sample var
gen boughtSample = 0
replace boughtSample = 1 if _region1 != .

// refer to all questions EXCEPT variable of interest q2 with aq*
gen aq3 = q3
gen aq4 = q4
gen aq5 = q5
gen aq6 = q6

// refer to questions outside of varible of interest index with eq*
gen index = q2 + q3 + q5
gen eq4 = q4
gen eq4squared = q4*q4
gen eq4cubed = q4*q4*q4
gen eq6 = q6
gen eq6squared = q6*q6
gen eq6cubed = q6*q6*q6

// generate continuous age
gen cage1 = 1 if _age1 == 1
replace cage1 = 2 if _age2 == 1
replace cage1 = 3 if _age3 == 1
replace cage1 = 4 if _age4 == 1
gen cage2 = cage1*cage1
gen cage3 = cage1*cage1*cage1

// generate continuous income
gen cincome1 = 1 if _income1 == 1
replace cincome1 = 2 if _income2 == 1
replace cincome1 = 3 if _income3 == 1
replace cincome1 = 4 if _income4 == 1
replace cincome1 = 5 if _income5 == 1
replace cincome1 = 6 if _income6 == 1
replace cincome1 = 7 if _income7 == 1
replace cincome1 = 8 if _income8 == 1
replace cincome1 = 9 if _income9 == 1
replace cincome1 = 10 if _income10 == 1
replace cincome1 = 11 if _income11 == 1
gen cincome2 = cincome1*cincome1
gen cincome3 = cincome1*cincome1*cincome1

gen cprovider1 = providercount
gen cprovider2 = cprovider1*cprovider1
gen cprovider3 = cprovider1*cprovider1*cprovider1

drop providercount
drop region
drop income
drop stem
drop industry
drop age
drop _age*
drop _income*
