clear

import delimited C:\Users\john.vandivier\workspace\data-science-practice\js\udacity-study\manually-scraped\manually-scraped-results.csv

tab samplegroupname, gen(_samplegroupname)
tab stateorcountry, gen(_stateorcountry)
tab monthssincelast, gen(_lastupdate) // TODO: make continuous and dummy out 9 months

tab presently, gen(_employed)
replace _employed = 0 if _employed != 1
tab nametruncated, gen(_nametruncated)
replace _nametruncated = 0 if _nametruncated != 1
tab speaksenglish, gen(_speaksenglish)
replace _speaksenglish = 0 if _speaksenglishs != 1
tab speaksspanish, gen(_speaksspanish)
replace _speaksspanish = 0 if _speaksspanish != 1
tab speaksother, gen(_speaksother)
replace _speaksother = 0 if _speaksother != 1

// TODO: reg
