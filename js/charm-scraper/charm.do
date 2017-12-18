import delimited D:\GitHub\data-science-practice\js\charm-scraper\results\result-cleaned.csv

reg meaniseducated minschoolprice
estimates store m1, title(Model 1)
reg meaniseducated minschoolprice meanschoolprice meancuriosity
estimates store m2, title(Model 2)
reg meaniseducated minschoolprice meanschoolprice meancuriosity meaneducatedbonus
estimates store m3, title(Model 3)
reg meaniseducated minschoolprice meanschoolprice meancuriosity meaneducatedbonus meanmoney
estimates store m4, title(Model 4)
reg meaniseducated minschoolprice meanschoolprice meancuriosity meaneducatedbonus meanmoney meanschoolsuffering
estimates store m5, title(Model 5)

gen curiorich = meanmoney* meancuriosity
reg meaniseducated minschoolprice meanschoolprice meancuriosity meaneducatedbonus meanmoney meanschoolsuffering curiorich // the interaction of money and curiosity is also unimportant

estout m1 m2 m3 m4 m5, cells(b(star fmt(3)) se(par fmt(2))) legend label varlabels(_cons constant) stats(r2, fmt(3 0 1) label(R-sqr))
