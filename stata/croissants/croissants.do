import delimited D:\GitHub\data-science-practice\stata\croissants\croissants.csv

label var q_5 "Q5"
label var q_6 "Q6"
label var q_7 "Q7"
label var q_8 "Q8"
label var q_9 "Q9"
label var deltadelta "DID"
summarize q_5 q_6 q_7 q_8 q_9 deltadelta
summarize q_5 q_6 q_7 q_8 q_9 deltadelta if illegal == 0
clear

import delimited D:\GitHub\data-science-practice\stata\croissants\stacked.csv
reg quantity treatment price confidence gender zerobaseline i.agegroup i.incomegroup i.ethgroup i.usregion if iseven == 1   //interesting, split beginner
reg quantity treatment price confidence gender zerobaseline i.agegroup i.incomegroup i.usregion if iseven == 1

gen ig2 = 0
replace ig2 = 1 if incomegroup == 2
gen ig4 = 0
replace ig4 = 1 if incomegroup == 4
gen ig5 = 0
replace ig5 = 1 if incomegroup == 5

reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.usregion if iseven == 1                        //winner, intetersting
estimates store m1, title(Model 1)
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.ethgroup i.usregion if iseven == 1

//now use other side of sample
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.usregion if iseven == 0                        //interesting, replication beginner
estimates store m2, title(Model 2)
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.ethgroup i.usregion if iseven == 0             //more significant, but I'm not supposed to do that; i.eth is not robust
reg quantity treatment price confidence gender zerobaseline i.agegroup i.usregion if iseven == 0                            //interesting, adj r2 winner
estimates store m3, title(Model 3)
reg quantity treatment price zerobaseline if iseven == 0                                                                    //interesting, variable sig winner
estimates store m4, title(Model 4)

//danger zone; breaking structure
reg quantity treatment price confidence gender i.agegroup i.usregion if iseven == 0                                         //but we have a good structural reason for zerobaseline
reg quantity treatment price gender i.agegroup i.usregion if iseven == 0                                                    //but we have a good structural reason for confidence

//what if i never broke structure
reg quantity treatment price confidence zerobaseline i.agegroup i.usregion if iseven == 0                                   //lower adj r2 although gender not sig

//consensus: with adj r2 we need expanded model, but 
reg quantity treatment price confidence zerobaseline if iseven == 0                                                         //interesting, short w structure
reg quantity treatment price if iseven == 0                                                                                 //interesting, short

//pooled tests...all interesting
reg quantity treatment price confidence gender zerobaseline i.agegroup i.usregion                                           //long model by ar2
estimates store m5, title(Model 5)
reg quantity treatment price zerobaseline                                                                                   //long model by variable significance. overall winner. final.
estimates store m6, title(Model 6)
reg quantity treatment price zerobaseline [fweight=confidence]                                                              //weighted winner. better ar2 and p-vals.
estimates store m7, title(Model 7)
reg quantity treatment price confidence zerobaseline                                                                        //short w structure. conf structural failure.
estimates store m8, title(Model 8)
reg quantity treatment price                                                                                                //short
estimates store m9, title(Model 9)
//note: in short and final, coeff is similar and t(treat) > t(price)

label var ig2 "$20-50K / Yr"
label var ig4 "$75-100K / Yr"
label var ig5 "$100K and up / Yr"
label var treatment "Treatment"
label var price "Price"
label var confidence "Confidence"
label var gender "Gender"
label var zero "ZeroBaseline"

estout m1 m2 m3 m4, cells(b(star fmt(3)) se(par fmt(2))) legend label varlabels(_cons constant) stats(r2, fmt(3 0 1) label(R-sqr)) drop(*.agegroup *.usregion)
estout m5 m6 m7 m8 m9, cells(b(star fmt(3)) se(par fmt(2))) legend label varlabels(_cons constant) stats(r2, fmt(3 0 1) label(R-sqr)) drop(*.agegroup *.usregion)
