sum worked
sum weeks
sum linc, detail
cumul lincome, gen(cum)                                    //graph cumulative bc i don't believe the median I'm seeing
line cum lincome
gen second = 0                                             //question 2 begin
replace second = 1 if kids > 1
reg weeks second
ivregress 2sls weeks (second = twin1st), first             //iv son watup
ivregress 2sls worked (second = twin1st), first
gen racewhite = 0                                          //question 3 begin
replace racewhite = 1 if race == 1
gen raceblack = 0
replace raceblack = 1 if race == 2
gen raceother = 0
replace raceother = 1 if race == 3
reg educ twin1st
reg agefst twin1st
reg agem twin1st
reg racewhite twin1st
reg raceblack twin1st
reg raceother twin1st
reg worked agem agefst educ raceblack raceother second    //question 4 begin
reg weeks agem agefst educ raceblack raceother second
ivregress 2sls worked agem agefst educ raceblack raceother (second = twin1st), first
ivregress 2sls weeks agem agefst educ raceblack raceother (second = twin1st), first
correlate second twin1st                                  //question 5
gen agebefore = 0                                         //question 6
replace agebefore = 1 if agefst < 20
gen agemid = 0
replace agemid = 1 if agefst >= 20
replace agemid = 0 if agefst > 24
gen ageafter = 0
replace ageafter = 1 if agefst > 24
gen agefsta = 0
replace agefsta = 1 if twin1st == 1 & agebefore == 1
replace agefsta = 2 if twin1st == 1 & agemid == 1
replace agefsta = 3 if twin1st == 1 & ageafter == 1
reg kids agefsta
