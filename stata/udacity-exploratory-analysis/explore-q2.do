do "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"

// understanding q2: we ran bag of tricks now reduce to max adj r2
// marginal-effects approach
drop _industry1
drop _region1
drop _stem1
drop cprovider2
drop cprovider3
drop _region2
drop _region8
drop _region4
drop _region7
drop _industry3
drop _industry5
drop _industry6
drop _industry8
drop _industry4
drop _industry9
drop _industry10
drop _industry11
drop _region5
drop cage3
drop aq6
drop _region9
drop aq4

// medium regression: I like this one alot bc logical factors like marginal effect. adj R^2 = .3981
reg q2 aq* employer unemployed _region* _stem3 _industry* cage*

// semi-short marginal. max factor p = .2. adj R^2 = .3942
reg q2 aq* unemployed _region3 _stem3 _industry* cage1

// short. max factor p = .1. adj R^2 = .3813
reg q2 aq* _region3 _stem3 _industry*           // equivalent to: `reg q2 aq3 aq5 _region3 _stem3 _industry2 _industry7 _industry12`

// TODO: without aq*
