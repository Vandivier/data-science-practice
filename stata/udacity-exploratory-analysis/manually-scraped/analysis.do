clear

//import delimited C:\Users\john.vandivier\workspace\data-science-practice\js\udacity-study\manually-scraped\manually-scraped-results.csv
import delimited D:\GitHub\data-science-practice\js\udacity-study\manually-scraped\manually-scraped-results.csv

tab samplegroupname, gen(_samplegroupname)
tab stateorcountry, gen(_stateorcountry)
// TODO: make continuous and dummy out 9 months
// TODO: shouldn't last updated date be from date of scrape, not from date of analysis (scrapes happen over multiple days)
tab monthssincelast, gen(_lastupdate)
tab samplegroup, gen(_samplegroup)

tab presently, gen(voi_employed)
replace voi_employed = 0 if voi_employed != 1
tab nametruncated, gen(_nametruncated)
replace _nametruncated = 0 if _nametruncated != 1
tab speaksenglish, gen(_speaksenglish)
replace _speaksenglish = 0 if _speaksenglish != 1
tab speaksspanish, gen(_speaksspanish)
replace _speaksspanish = 0 if _speaksspanish != 1
tab speaksother, gen(_speaksother)
replace _speaksother = 0 if _speaksother != 1

replace countofudacitynanodegree = 0 if missing(countofudacitynanodegree)
replace countofudacityinformationdetails = 0 if missing(countofudacityinformationdetails)
replace countofudacityeducationentries = 0 if missing(countofudacityeducationentries)
replace countofudacityexperienceentries = 0 if missing(countofudacityexperienceentries)
replace countlanguages = 0 if missing(countlanguages)

gen age1 = age
gen age2 = age1*age1
gen age3 = age1*age1*age1
gen nnano1 = countofudacitynanodegree
gen nnano2 = nnano1*nnano1
gen nnano3 = nnano1*nnano1*nnano1
gen ndet1 = countofudacityinformationdetails
gen ndet2 = ndet1*ndet1
gen ndet3 = ndet1*ndet1*ndet1
gen nedu1 = countofudacityeducationentries
gen nedu2 = nedu1*nedu1
gen nedu3 = nedu1*nedu1*nedu1
gen nexp1 = countofudacityexperienceentries
gen nexp2 = nexp1*nexp1
gen nexp3 = nexp1*nexp1*nexp1
gen nlang1 = countlanguages
gen nlang2 = nlang1*nlang1
gen nlang3 = nlang1*nlang1*nlang1
gen interacted1 = age1*nnano1
gen interacted2 = interacted1*interacted1
gen interacted3 = interacted1*interacted1*interacted1

drop ageestimated
drop name*

// long regression, r2 = .52
reg voi_employed age* n* interacted* _*
// long logit, r2 = .42
logit voi_employed age* n* interacted* _*
