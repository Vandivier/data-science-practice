import delimited D:\GitHub\data-science-practice\stata\croissants\croissants.csv

label var q_5 "Q5"
label var q_6 "Q6"
label var q_7 "Q7"
label var q_8 "Q8"
label var q_9 "Q9"
label var deltadelta "DID"
estpost summarize q_5 q_6 q_7 q_8 q_9 deltadelta, listwise
esttab, cells("mean sd min max") nomtitle nonumber


/*
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

reg quantity treatment price confidence gender zerobaseline i.agegroup i.incomegroup i.ethgroup i.usregion if iseven == 1   //interesting, split beginner
reg quantity treatment price confidence gender zerobaseline i.agegroup i.incomegroup i.usregion if iseven == 1

gen ig2 = 0
replace ig2 = 1 if incomegroup == 2
gen ig4 = 0
replace ig4 = 1 if incomegroup == 4
gen ig5 = 0
replace ig5 = 1 if incomegroup == 5
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.usregion if iseven == 1                        //winner, intetersting
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.ethgroup i.usregion if iseven == 1

//now use other side of sample
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.usregion if iseven == 0                        //interesting, replication beginner
reg quantity treatment price confidence gender zerobaseline i.agegroup ig* i.ethgroup i.usregion if iseven == 0             //more significant, but I'm not supposed to do that; i.eth is not robust
reg quantity treatment price confidence gender zerobaseline i.agegroup i.usregion if iseven == 0                            //interesting, adj r2 winner
reg quantity treatment price zerobaseline if iseven == 0                                                                    //interesting, variable sig winner

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
reg quantity treatment price zerobaseline                                                                                   //long model by variable significance. overall winner. final.
reg quantity treatment price zerobaseline [fweight=confidence]                                                              //weighted winner. better ar2 and p-vals.
reg quantity treatment price confidence zerobaseline                                                                        //short w structure. conf structural failure.
reg quantity treatment price                                                                                                //short
//note: in short and final, coeff is similar and t(treat) > t(price)

label var zero "ZeroBaseline"
*/
