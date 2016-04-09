/*time for the real fun...*/
use "D:\PUMS\data\reduced-2014-ACS-PUMS.dta", clear
tab cow, gen(_cow)                          //splitting cow as _cow; ref: http://www.ats.ucla.edu/stat/stata/faq/dummy.htm */
generate selfemployedflag = 0               //pipe as "or" in line 15. if worker is classed under _cow6 or _cow7 they are self-employed.
replace selfemployedflag = 1  if _cow6 == 1 | _cow7 == 1
sum selfemployedflag                        //mean of ~.062 indicating ~6.2% of the population was self-employed in 2014.
reg self occp
/*p is 0...that's a good start...but it's in the opposite direction expected? Maybe opportunity cost is a driver.
  also, that coefficient is tiny; maybe significant but not economically important we will see
  */
tab st, gen(_state)                         //state as dummy to correct effects from tax policy, culture, etc...interesting only 28 states in data set
reg self _state*                            //ref: http://www.stata.com/statalist/archive/2005-10/msg00399.html
/*from line 5 reg: interesting that all state effects have lower combined F and adj R^2 compared to occp
  some states significant, others not. Let's have a bit longer model and state may be rendered insignificant
  let's consider the possibility of a cumulative relationship on occp by using age...as well as independent experience effects, etc
  */
reg self agep                               //yes age is highly significant...going to mid size model to see if state drops out. Gen a few vars to start
gen ismale = 0
replace ismale = 1 if sex == 1
tab mar, gen(_marriage)
tab rac1p, gen(_race)
tab cit, gen(_cit)
reg self occp agep ismale schl pwgtp _marriage* _race* _state* _cit*
/*well, it looks like all this stuff matters at .1 level, so I can't really reduce the model yet.
  sure, one or two categories in each category group doesn't matter for signficance,
  but it's easier to write the model including those for now.
  maybe I can refactor marriage into married, widowed, or notmarriedorwidowed; or married vs not married
  race1, 5, 6, 8, and 9 matter
  some states can drop
  */
corr sciengp sciengrlp fod1p fod2p          //I'll call this group of variables the proxy group. I think these explain similar stuff, but it turns out there is significant variation
tab sciengp, gen(_sciengp)
tab sciengrlp, gen(_sciengrlp)
tab fod1p, gen(_fod1p)
tab fod2p, gen(_fod2p)
set matsize 700                             //next one will be big...
reg self occp agep ismale schl pwgtp _marriage* _race* _state* _cit* sciengp* _sciengrlp* _fod1p* _fod2p*
//now we notice many statistically unimportant variables in the proxy group, so let's figure out which we should drop by regressing on the pre-split parent variables

reg self occp agep ismale schl pwgtp _marriage* _race* _state* _cit* sciengp sciengrlp fod1p fod2p
/*looks like sciengp is insignificant, let's drop it
  now I will recode occp, fod1p, and fod2p into dummy variables
  isitprofessional has a value of 1 if the individual had occp of: 0110, 1005, 1006, 1007, 1010, 1020, 1030, 1050, 1060, 1105, 1106, 1107, 1400, 7010
  */
gen isitprofessional = 0
replace isit = 1 if occp == 0110 | occp == 1005 | occp == 1006 | occp == 1007 | occp == 1010 | occp == 1020 | occp == 1030 | occp == 1050 | occp == 1060
replace isit = 1 if occp == 1105 | occp == 1106 | occp == 1107 | occp == 1400 | occp == 7010
sum isit                                    //mean is about .016...about 1.6% of population
reg self isit agep                          //looks like isit doesn't matter compared to age
reg self isit sciengrlp agep ismale schl pwgtp _marriage* _race* _state* _cit*
/**whew* ok the variable of interest is still significant...had me worried a minute
  but wait...now race doesn't matter?!?!?! that's super interesting....
  and now my adj R^2 dropped...I think it's bc I removed the degree info fod1p fod2p*/
//I'm curious...is there a 'sweet spot' of age? if so, we should use age squared as an independant variable
gen agesquared = agep*agep
reg self agep
reg self agep agesquared                    //looks like that is totally true bc adj R^2 doubled
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage* _race* _state* _cit*
/*age and agesquared strong as ever after dropping in the midsized model.
  widowed looks like the only super robust marriage result, so I'm just using _marriage2, which is widowed
  */
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _race* _state* _cit*
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _state* _cit*    //dropping race
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _state* _cit2    //only _cit2 is significant
//only _state1, 8, 13, 15, 27, 36, 46, 47, 49 are significant at .02 level; 9 states of significance for entrepeneurship! write about it.
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _state1 _state8 _state13 _state15 _state27 _state36 _state46 _state47 _state49 _cit2
//grouping goodstates and badstates for simplicity
gen goodstate = 0
gen badstate = 0
//good states are georgia, minnesota, south dakota
//bad states are alabama, colorado, hawaii, new york, north carolina, tennesse, utah
replace goodstate = 1 if _state13 == 1 | _state27 == 1 | _state46 == 1
replace badstate = 1 if _state1 == 1 | _state8 == 1 | _state15 == 1 | _state36 == 1 | _state47 == 1 | _state49 == 1
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2
//now that we have kind of reduced our model, I'm reintroducing the degree variables
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2 _fod1p* _fod2p*
//but this time we notice fod2p is entirely statistically irrelevant
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2 _fod1p*
/*some degrees matter and some don't.
  If we pause and deviate from our IT theory, it's actually quite interesting that
  many other degrees are significantly related
  */
