clear

//import delimited C:\Users\john.vandivier\workspace\data-science-practice\js\udacity-study\manually-scraped\manually-scraped-results.csv
import delimited D:\GitHub\data-science-practice\js\udacity-study\manually-scraped\manually-scraped-results.csv

tab samplegroupname, gen(_samplegroupname)
tab stateorcountry, gen(_stateorcountry)
// TODO: make continuous and dummy out 9 months
tab monthssincelast, gen(_lastupdate)

tab presently, gen(_employed)
replace _employed = 0 if _employed != 1
tab nametruncated, gen(_nametruncated)
replace _nametruncated = 0 if _nametruncated != 1
tab speaksenglish, gen(_speaksenglish)
replace _speaksenglish = 0 if _speaksenglish != 1
tab speaksspanish, gen(_speaksspanish)
replace _speaksspanish = 0 if _speaksspanish != 1
tab speaksother, gen(_speaksother)
replace _speaksother = 0 if _speaksother != 1

gen interacted1 = age*countofudacitynanodegree
gen interacted2 = interacted1*interacted1
gen interacted3 = interacted1*interacted1*interacted1
gen age1 = age
gen age2 = age1*age1
gen age3 = age1*age1*age1
gen nnano1 = countofudacitynanodegree
gen nnano2 = nnano1*nnano1
gen nnano3 = nnano1*nnano1*nnano1

drop ageestimated

// TODO: reg
reg _employed age* nnano* interacted*

