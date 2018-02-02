clear all
set more off
*log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\Earhart analysis.smcl" ///First time
log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.smcl", append replace

import delimited C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\ordered-output.csv
save "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta", replace

use "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta"
format %25s name academicyear graduateinstitution areaofstudy sponsors emailaddress validemailaddress deceased
format %10s  recipientgender recipientgenderizedname simplesponsorgender simplesponsorgenderizedname entryid completiondegree mailingaddress emailaddress validemailaddress deceased
format %4.0g recipientgenderprobability 
drop graduateinstitutioninvalidatedli invalidprefixareaofstudy invalidpostfixareaofstudy

***Rename Graduateinstitution==gi and clean Graduateinstitution Edgecases: gi_subcampus, gi_country, ***
split graduateinstitution, generate(gi) parse(~) 
rename gi1 gi
gen gi_country=gi2 if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==1
replace gi_country="USA" if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==0
gen gi_subcampus=gi2 if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==0

***institutions that are the same but have different names/have different names but are the same***


***Correct for institutions that ONLY award undergrad degrees/did NOT award graduate degrees at the time Fellow attended..***
gen undergrad=0
replace undergrad=1 if regexm(gi, "Claremont Men's College|Claremont McKenna College|Alma College|Asbury College|Harvard College")==1 ///confirmed all gi's with "College" in name except 3 that are assigned to RA









save "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta", replace
