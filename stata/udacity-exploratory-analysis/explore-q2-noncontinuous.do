do "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"

// understanding q2: we ran bag of tricks now reduce to max adj r2
// non-continous approach; no marginal effects just gimme adj r2
drop _industry1
drop _region1
drop _stem1
drop _income1
drop _age1
drop aq6
drop _income7
drop _income11
drop _region2
drop _industry3
drop cage1
drop cincome1
drop _income3
drop _region5
drop _industry6
drop _industry9
drop _industry8
drop _industry10
drop _industry5
drop _industry4
drop aq4
drop _region4
drop _income5
drop _income10
drop cage3
drop _industry11


// max adj r^2 = .4310. And we still have marginal income effect!
reg q2 aq* unemployed _region* _income* _stem3 _industry* _age2 cage* cincome*

drop _region8
drop _industry7

// med regression: all factors under p = .2. adj r2 = .4239
reg q2 aq* unemployed _region* _income* _stem3 _industry* cincome*

// short reg: all factors under p = .1, adj r2 = .3841
reg q2 aq3 aq5 _income2 _stem3 _industry2 _industry12

// robust multifactor analysis: common factors from continuous and noncontinous, adj-r2 = .26
reg q2 aq3 aq5 _stem3 _industry2 _industry12

// min p = .2
reg q2 aq3 aq5 _industry12

// TODO: without aq*
