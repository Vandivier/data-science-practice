clear all
set more off

import delimited C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\ordered-output.csv
save "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta", replace

*** START THE LOG ***
*log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\Earhart analysis.smcl" ///First time
log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.smcl", append name(main)

use "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta"
***Format 
format %25s name academicyear graduateinstitution areaofstudy sponsors emailaddress validemailaddress deceased
format %15s  recipientgender recipientgenderizedname simplesponsorgender simplesponsorgenderizedname entryid completiondegree mailingaddress emailaddress validemailaddress deceased
format %4.0g recipientgenderprobability 
drop graduateinstitutioninvalidatedli invalidprefixareaofstudy invalidpostfixareaofstudy

***Rename Graduateinstitution==gi and clean Graduateinstitution Edgecases: gi_subcampus, gi_country, ***
split graduateinstitution, generate(gi) parse(~) 
rename gi1 gi
gen gi_country=gi2 if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==1
replace gi_country="USA" if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==0
rename gi_country country
gen gi_subcampus=gi2 if regexm(gi2, "Switzerland|United Kingdom|Canada|Mexico|Israel|Germany|France|Belgium")==0

***Clean/match typo's etc. among sponsors
/*strgroup sponsors, gen(spon) threshold(0.1)
codebook spon*/

***Clean typos in sponsors, substitute and for & --> by spon: tab sponsors
*replace sponsors="" if regexm(sponsors, "")==1
replace sponsors="Clifton L. Ganus Jr." if regexm(sponsors, "Clifton L. Gallus")==1
replace sponsors="Christopher Bruell and Robert K. Faulkner" if regexm(sponsors, "Christopher Bruell and Robert K. Faulkners|Christopher Bruen and Robert K. Faulkner")==1
replace sponsors="Edward C. Banfield" if regexm(sponsors, "Edward C. Bonfield")==1
replace sponsors="Murray L. Weidenbaum" if regexm(sponsors, "Murray L. Weidenbaun")==1
replace sponsors="Deil S. Wright" if regexm(sponsors, "Dell S. Wright")==1
replace sponsors="Carl Leiden and James R. Steintrager" if regexm(sponsors, "Carl Leiden and James Steintrager")==1
replace sponsors="Daniel J. Elazar" if regexm(sponsors, "Daniel J. Elvar")==1

replace sponsors="E. Maynard Aris" if regexm(sponsors, "E. Maynard Eris")==1
replace sponsors="James Don Edwards and Roland F. Salmonson" if regexm(sponsors, "")==1

***Subinstr inconsistent use of and/&,  

replace sponsors=subinstr(sponsors, "&", "and", 20)
replace sponsors=subinstr(sponsors, "~", ",", 20)

///TO DO: RICE, Rob

***Encode clean categorical variables***
encode areaofstudy, gen(major)
encode completiondegree, gen(degree)
encode validemailaddress, gen(validemail)
encode deceased, gen(deceased_fellow)
encode simplesponsorgender, gen(gender_sponsor)
encode recipientgender, gen(gender_recipient)
encode country, gen(gi_country)


***institutions that are the same but have different names/have different names but are the same***





///Save until proven worthwhile///
***Correct for institutions that ONLY award undergrad degrees/did NOT award graduate degrees at the time Fellow attended..***
/*gen undergrad=0
replace undergrad=1 if regexm(gi, "Claremont Men's College|Claremont McKenna College|Alma College|Asbury College|Harvard College")==1 ///confirmed all gi's with "College" in name except 3 that are assigned to RA
*/








save "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta", replace
