import delimited D:\GitHub\data-science-practice\stata\croissants\croissants.csv
sum q_*
sum q* if illegal == 0
sum del*
sum del* if illegal == 0
clear

import delimited D:\GitHub\data-science-practice\stata\croissants\stacked.csv
reg quantity treatment price confidence gender i.agegroup i.incomegroup i.ethgroup i.usregion
estimates store m1, title(Model 1)
gen age3 = 0
replace age3 = 1 if agegroup == 3

reg quantity treatment price confidence gender agegroup incomegroup ethgroup
estimates store m2, title(Model 2)
reg quantity treatment price confidence ethgroup
estimates store m3, title(Model 3)
reg quantity treatment price ethgroup
estimates store m4, title(Model 4)
