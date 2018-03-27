do "D:\GitHub\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"
//do "C:\Users\john.vandivier\workspace\data-science-practice\stata\udacity-exploratory-analysis\analysis.do"

// d1qlong
// r2:              .44
// adjr2:           -.07
// f-complexity:    59
// q-complexity:    10
reg q2 eq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*

// d1qweak
// r2:              .
// adjr2:           .
// f-complexity:    
// q-complexity:    
reg q2 eq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*

// d1qmaxar
// r2:              .
// adjr2:           .
// f-complexity:    
// q-complexity:    
reg q2 eq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*

// d1qstrong
// r2:              .
// adjr2:           .
// f-complexity:    
// q-complexity:    
reg q2 eq* boughtSample employer male unemployed _region* _income* _stem* _industry* _age* cage* cincome* cprovider*
