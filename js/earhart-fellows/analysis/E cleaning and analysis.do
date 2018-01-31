clear all
set more off
*log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\Earhart analysis.smcl" ///First time
log using "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.smcl", append replace

import delimited C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\ordered-output.csv
save "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta", replace

use "C:\Users\Markus\Desktop\GIT\data-science-practice\js\earhart-fellows\analysis\E cleaning and analysis.dta"
format %25s name academicyear graduateinstitution areaofstudy sponsors emailaddress validemailaddress deceased
format %10s  recipientgender recipientgenderizedname simplesponsorgenderprobability simplesponsorgender simplesponsorgenderizedname entryid completiondegree mailingaddress emailaddress validemailaddress deceased
format %4.0g recipientgenderprobability 
