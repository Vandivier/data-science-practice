clear
import delimited "D:\PUMS\data\ss14pusa.csv"
save "D:\PUMS\data\a.dta"
import delimited "D:\PUMS\data\ss14pusb.csv", clear 
save "D:\PUMS\data\b.dta"
clear
use "D:\PUMS\data\a.dta", clear
append using "D:\PUMS\data\b.dta"
save "D:\PUMS\data\merged-2014-ACS-PUMS.dta"
keep serialno sporder st pwgtp agep cit cow intp mar oip pap schl semp sex wagp wkhp dis esp fod1p fod2p indp naicsp occp pernp pincp sciengp sciengrlp socp rac1p
save "D:\PUMS\data\reduced-2014-ACS-PUMS.dta"
