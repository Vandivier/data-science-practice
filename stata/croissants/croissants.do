import delimited D:\GitHub\data-science-practice\stata\croissants\croissants.csv
sum q_*
sum q* if illegal == 0
sum del*
sum del* if illegal == 0
clear

import delimited D:\GitHub\data-science-practice\stata\croissants\stacked.csv
reg quantity treatment price confidence gender zerobaseline i.agegroup i.incomegroup i.ethgroup i.usregion

gen age3 = 0
replace age3 = 1 if agegroup == 3
reg quantity treatment price confidence gender zerobaseline age3 i.incomegroup i.usregion

gen reg3 = 0
replace reg3 = 1 if usregion == 3
reg quantity treatment price confidence gender zerobaseline age3 i.incomegroup reg3
estimates store m1, title(Model 1)

reg quantity treatment price confidence zerobaseline age3 i.incomegroup reg3
reg quantity treatment price zerobaseline age3 i.incomegroup reg3
estimates store m2, title(Model 2)

reg quantity treatment price zerobaseline i.incomegroup reg3
estimates store m3, title(Model 3)

//drop if zero == 1
//reg quantity treatment price age3 i.incomegroup reg3        //model is not improved by dropping zero; better explanation by including it.
//not only is treatment significant, it is the most significant rhv; more than price, although smaller coefficient

//ref: http://www.ats.ucla.edu/stat/stata/faq/estout.htm
estout m1 m2 m3, cells(b(star fmt(3)) se(par fmt(2))) legend label varlabels(_cons constant) stats(r2, fmt(3 0 1) label(R-sqr))
