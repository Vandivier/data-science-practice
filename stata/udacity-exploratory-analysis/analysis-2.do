do "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"
//do "C:\Users\john.vandivier\workspace\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"

// paper: step 1: discuss analysis, explaning q2
// step 2: discuss analysis 2, explaining index
// step 2.b: explain index on observables only; not survey questions
// step 3: factor compare-and-contrast: what factors are q2-index robust or not or reversed and why?

// d1ilong
// r2:              .488
// adjr2:           negative
// f-complexity:    ?
// q-complexity:    ?
// notes: regress everything to start
reg index eq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*

// remove ommitted and p > .95, r-squared .488, positive adj r2
reg index eq4 eq4cubed eq6 eq6squared eq6cubed employer male unemployed _region1 _region3 _region5 _region6 _region7 _region8 _region9 _income2 _income3 _income4 _income5 _income6 _income8 _income9 _income10 _stem1 _stem2 _industry2 _industry4-_industry12 _age2 cage2 cage3 cincome2 cincome3 cprovider1 cprovider2

// now drop factors 1-by-1 until adj r2 maxed OR all p < .5
// winner was all p < .5; weak factor model, d1iweak
reg index eq4 eq6 eq6cubed employer male unemployed _region3 _region5 _region6 _region8 _income2 _income6 _income10 _stem1 _stem2 _industry2 _industry4-_industry6 _industry9-_industry12 cage2 cage3 cincome2 cincome3 cprovider1 cprovider2

// p < .3, r2 = .44, adj r3 = .3
// max adj r2, d1imaxar
// geniune or pseudosimplicity?
reg index eq4 eq6 eq6cubed male unemployed _region3 _region5 _region6 _region8 _income6 _stem2 _industry6 _industry9 _industry11 cage2 cage3 cincome2 cincome3 cprovider1

// strong factor model, p < .1, r2 = .27, adj r2 = .23
reg index eq4 eq6 eq6cubed _income6 _industry6 _industry9

// now start over without questions, d1inqweak
reg index boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*

// p > .95, adj r2 still negative
reg index employer male unemployed _region1 _region3 _region4 _region6 _region7 _region8 _region9 _income3 _income4 _income5 _income6 _income8 _income10 _stem1 _stem2 _industry2 _industry4-_industry11 _age2 cage2 cage3 cincome2 cincome3 cprovider1 cprovider2 cprovider3

// p < .8, adj r2 .06, r2 = .33
reg index male unemployed _region1 _region7 _region8 _region9 _income3 _income4 _income5 _income6 _income8 _stem1 _stem2 _industry2 _industry4-_industry7 _industry9-_industry11 _age2 cage2 cage3 cincome2 cincome3 cprovider1 cprovider2

// now drop factors 1-by-1 until adj r2 maxed OR all p < .5
// winner was all p < .5; weak factor model
reg index male unemployed _region8 _region9 _income6 _income8 _stem1 _stem2 _industry2 _industry4-_industry6 _industry9 _industry11 cage2 cage3 cprovider1 cprovider2

// max adj r2 = .1759
reg index male unemployed _region8 _income6 _income8 _stem1 _stem2 _industry6 _industry9 cage2 cage3 cprovider1

// both robust factor models tell a similar story; people are cool with alternative credentials unless they are _income6: 175-199k/year
// there was only n=1 for _income6: how does the analysis change if this observation is dropped? see analysis-3
