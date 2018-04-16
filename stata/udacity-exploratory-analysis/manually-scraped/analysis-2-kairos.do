do "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\manually-scraped\analysis-1-udacity-base.do"

tab imagerejected, gen(_imagerejected)
replace _imagerejected = 0 if _imagerejected != 1
tab imagesubmitted, gen(_imagesubmitted)
replace _imagesubmitted = 0 if _imagesubmitted != 1

gen agekairos1 = kairosage
gen agekairos2 = agekairos1*agekairos1
gen agekairos3 = agekairos1*agekairos1*agekairos1

drop kairosage

// d1longkairos
// n:               103
// r2:              .73
// adjr2:           .1
// f-complexity:    114
// q-complexity:    10
reg voi_employed age* n* interacted* _* workingandus kairos*

// exploratory7
// n:               149
// r2:              .15
// adjr2:           .12
// f-complexity:    7
// q-complexity:    3
// note: non-kairos age > kairos age
// note: Udacity age estimate has q = 2 because you must know education count and experience count to get it
reg voi_employed age*

// exploratory8
// n:               149
// r2:              .15
// adjr2:           .12
// f-complexity:    7
// q-complexity:    3
// note: non-kairos age > kairos age
// note: proving it's not just order variables are entered
reg voi_employed agekairos1 agekairos2 agekairos3 age1 age2 age3

// exploratory9
// n:               260
// r2:              .29
// adjr2:           .28
// f-complexity:    4
// q-complexity:    2
// note: non-kairos age > kairos age
reg voi_employed age1 age2 age3

// exploratory10
// n:               212
// r2:              .02
// adjr2:           .11
// f-complexity:    4
// q-complexity:    1
// note: non-kairos age > kairos age
reg voi_employed agekairos*

// d1weakkairos
// n:               197
// r2:              .52
// adjr2:           .36
// f-complexity:    51
// q-complexity:    7
// note: weak factor model, p < .5
reg voi_employed

// d1maxarkairos
// n:               197
// r2:              .49
// adjr2:           .40
// f-complexity:    30
// q-complexity:    7
reg voi_employed

// d1strongkairos
// n:               197
// r2:              .43
// adjr2:           .38
// f-complexity:    17
// q-complexity:    7
// note: strong factor model, p < .1
reg voi_employed

// d1longlogitkairos
// n:               60
// r2:              1.0 (pseudo)
// adjr2:           n/a
// f-complexity:    ?
// q-complexity:    10
logit voi_employed age* n* interacted* _* workingandus kairos*

// d1weaklogitkairos
// n:               197
// r2:              .42 (pseudo)
// adjr2:           n/a
// f-complexity:    24
// q-complexity:    7
logit voi_employed

// d1mediumlogitkairos
// n:               197
// r2:              .41 (pseudo)
// adjr2:           n/a
// f-complexity:    21
// q-complexity:    7
logit voi_employed

// d1stronglogitkairos
// n:               197
// r2:              .36 (pseudo)
// adjr2:           n/a
// f-complexity:    12
// q-complexity:    7
logit voi_employed
