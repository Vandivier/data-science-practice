reg vote lafollow                                   //at first glance in the short model, whether they were contacted by robo is important
reg vote treatment                                  //there is a weak but significant treatment effect
gen agesq = age*age                                 //maybe age has a marginal effect
reg vote age agesq treatment lafollow               //in this model all the variables are still important, although the treatment effect is weakening
reg vote age agesq treatment lafollow, robust       //the variables are higher t after checking for robustness
reg vote gen2014                                    //confirming the variables are identical
drop gen2014                                        //dropping so I can treat gen20* as an X var
reg vote age agesq treatment lafollow gen20* i.state, robust    //why do only states 6 and 7 show? I guess STATA is dropping insignificant vars. Treatment is insignificant now.
gen lnincome = ln(income)
gen incomesq = income*income
xi precinct
reg vote i.precinct                                 //this throws r(103) too many precincts with too little degrees of freedom, so I will not include in the long regression.
reg vote age agesq treatment lafollow gen20* i.state i.education i.group income lnincome incomesq male, robust    //initial long model
gen group3 = 0
replace group3 = 1 if group == 3                    //group had a weak affect; maybe this recode will strengthen
reg vote age agesq treatment lafollow gen20* i.state i.education group3 lnincome male, robust   //reducing to long model 2 by eliminating insignificant variables
reg vote age agesq lafollow gen20* i.state i.education male, robust   //final long model based on significance

//ssc install estout                                //install only once; it the estout package used below for table making
reg vote age agesq treatment lafollow gen20* i.state i.education i.group income lnincome incomesq male, robust
est store m1
reg vote age agesq treatment lafollow gen20* i.state i.education group3 lnincome male, robust
est store m2
reg vote age agesq lafollow gen20* i.state i.education male, robust
est store m3
esttab m1 m2 m3
