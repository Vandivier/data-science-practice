use "D:\PUMS\data\reduced-2014-ACS-PUMS.dta", clear           //comments are aligned here

tab cow, gen(_cow)                                            // splitting cow as _cow; ref: http://www.ats.ucla.edu/stat/stata/faq/dummy.htm */
generate selfemployedflag = 0                                 // pipe as "or" in line 15. if worker is classed under _cow6 or _cow7 they are self-employed.
replace selfemployedflag = 1  if _cow6 == 1 | _cow7 == 1
sum selfemployedflag                                          // mean of ~.062 indicating ~6.2% of the population was self-employed in 2014.
reg self occp
                                                              /* p is 0...that's a good start...but it's in the opposite direction expected? Maybe opportunity cost is
                                                               * a driver; also that coefficient is tiny; maybe significant but not economically important we will see */

tab st, gen(_state)                                           // state as dummy to correct effects from tax policy, culture, etc...interesting only 28 states in data set
reg self _state*                                              // ref: http://www.stata.com/statalist/archive/2005-10/msg00399.html
                                                              /* from line 5 reg: interesting that all state effects have lower combined F and adj R^2 compared to occp
                                                               * some states significant, others not. Let's have a bit longer model and state may be rendered insignificant
                                                               * let's consider the possibility of a cumulative relationship on occp by using age...as well as independent
                                                               * experience effects, etc */
reg self agep                                                 // yes age is highly significant...going to mid size model to see if state drops out. Gen a few vars to start
gen ismale = 0
replace ismale = 1 if sex == 1
tab mar, gen(_marriage)
tab rac1p, gen(_race)
tab cit, gen(_cit)
reg self occp agep ismale schl pwgtp _marriage* _race* _state* _cit*

                                                              /* well, it looks like all this stuff matters at .1 level, so I can't really reduce the model yet.
                                                               * sure, one or two categories in each category group doesn't matter for signficance,
                                                               * but it's easier to write the model including those for now.
                                                               * maybe I can refactor marriage into married, widowed, or notmarriedorwidowed; or married vs not married
                                                               * race1, 5, 6, 8, and 9 matter
                                                               * some states can drop */

corr sciengp sciengrlp fod1p fod2p                            //these vars all proxy the kind of education; but there is significant variation
tab sciengp, gen(_sciengp)
tab sciengrlp, gen(_sciengrlp)
tab fod1p, gen(_fod1p)
tab fod2p, gen(_fod2p)
set matsize 700                                               //next reg will be large...
reg self occp agep ismale schl pwgtp _marriage* _race* _state* _cit* sciengp* _sciengrlp* _fod1p* _fod2p*
                                                              /* In the long regression it looks like sciengp is insignificant, so let's drop it
                                                               * now I will recode occp into a dummy variable isitprofessional if the industry code is IT
                                                               * isitprofessional has a value of 1 if the individual had occp of:
                                                               * 0110, 1005, 1006, 1007, 1010, 1020, 1030, 1050, 1060, 1105, 1106, 1107, 1400, 7010 */
gen isitprofessional = 0
replace isit = 1 if occp == 0110 | occp == 1005 | occp == 1006 | occp == 1007 | occp == 1010 | occp == 1020 | occp == 1030 | occp == 1050 | occp == 1060
replace isit = 1 if occp == 1105 | occp == 1106 | occp == 1107 | occp == 1400 | occp == 7010
sum isit                                                      //mean is about .016...about 1.6% of population
reg self isit agep                                            //looks like isit isn't significant in a short reg after correcting for age
reg self isit sciengrlp agep ismale schl pwgtp _marriage* _race* _state* _cit*
                                                              /* OK cool...the variable of interest "isit" is still significant in the long reg. I was worried 4a min
                                                               * but wait...now race has lost all significance?!?!?! that's super interesting....
                                                               * and now my adj R^2 dropped...I think bc I removed degree info vars: fod1p fod2p
                                                               * I'm curious...is there a 'sweet spot' for age? decreasing MR? let's try age squared as an X-var */
gen agesquared = agep*agep
reg self agep
reg self agep agesquared                                      //looks like age squared def matters bc adj R^2 doubled
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage* _race* _state* _cit*
                                                              /* age and agesquared strong as ever after dropping in the mid sized model.
                                                               * widowed looks like the only robust marriage var, so I condense _marriage* to _marriage2 (widowed) */

reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _race* _state* _cit*
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _state* _cit*
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 _state* _cit2

                                                              /* further condensing the model by significance; dropping race; preserve only _cit2 of _cit*
                                                               * Preserved states: _state1, 8, 13, 15, 27, 36, 46, 47, 49 are significant at .02 level; blog it
                                                               * grouping goodstates and badstates for simplicity by direction of B
                                                               * good states are georgia, minnesota, south dakota
                                                               * bad states are alabama, colorado, hawaii, new york, north carolina, tennesse, utah */
gen goodstate = 0
gen badstate = 0
replace goodstate = 1 if _state13 == 1 | _state27 == 1 | _state46 == 1
replace badstate = 1 if _state1 == 1 | _state8 == 1 | _state15 == 1 | _state36 == 1 | _state47 == 1 | _state49 == 1

reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2
                                                              /* after some model reduction, I'm reintroducing degree vars.
                                                               * I believe _fod* corresponds to question 12 in section F on the questionnaire,
                                                               * therefore it is the field of the individual's Bachelor degree.
                                                               * ref: http://www2.census.gov/programs-surveys/acs/methodology/questionnaires/2014/quest14.pdf */
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2 _fod1p* _fod2p*
reg self isit sciengrlp agep agesquared ismale schl pwgtp _marriage2 goodstate badstate _cit2 _fod1p*

                                                              /* now fod2p is statistically irrelevant. For fod1p, some degrees matter and some don't.
                                                               * actually the degrees with important beta are interesting;
                                                               * only one degree negative significant beta; let's condense gooddegrees to one bool */

gen gooddegree = 0
replace gooddegree = 1 if _fod1p1 == 1 | _fod1p2 == 1 | _fod1p3 == 1 | _fod1p4 == 1 | _fod1p6 == 1 | _fod1p12 == 1 | _fod1p27 == 1 | _fod1p88 == 1
replace gooddegree = 1 if _fod1p139 == 1 | _fod1p141 == 1 | _fod1p142 == 1 | _fod1p143 == 1 | _fod1p144 == 1 | _fod1p146 == 1 | _fod1p153 == 1

gen dis2 = 0                                                  //correcting for disability
replace dis2 = 1 if dis == 1
sum pernp pincp wagp oip intp semp wkhp                       //these are all 0 observations bc STATA didn't coerce from string to long

destring pernp, gen(eiwc_pernp_long)
destring pincp, gen(eiwc_pincp_long)
destring wagp, gen(eiwc_wagp_long)
destring oip, gen(eiwc_oip_long)
destring intp, gen(eiwc_intp_long)
destring semp, gen(eiwc_semp_long)
destring wkhp, gen(eiwc_wkhp_long)

drop pernp pincp wagp oip intp semp wkhp

                                                              /* now correcting for earnings, income, and wealth; earnings is from wages and income includes all;
                                                               * under the opportunity cost theory, each factor is structurally important in it's own way;
                                                               * prefix all with eiwc_ so that we can write one var in the reg.
                                                               * It means "earnings, income, and wealth correction." */
gen eiwc_pernpsquared = eiwc_pernp_long*eiwc_pernp_long
gen eiwc_pernpplogged = log(eiwc_pernp_long)
gen eiwc_pincpsquared = eiwc_pincp_long*eiwc_pincp_long
gen eiwc_pincplogged = log(eiwc_pincp_long)
gen eiwc_wagpsquared = eiwc_wagp_long*eiwc_wagp_long
gen eiwc_wagplogged = log(eiwc_wagp_long)
gen eiwc_oipsquared = eiwc_oip_long*eiwc_oip_long
gen eiwc_oiplogged = log(eiwc_oip_long)
gen eiwc_sempsquared = eiwc_semp_long*eiwc_semp_long
gen eiwc_semplogged = log(eiwc_semp_long)
gen eiwc_wkhpsquared = eiwc_wkhp_long*eiwc_wkhp_long
gen eiwc_wkhplogged = log(eiwc_wkhp_long)

reg self isit sciengrlp age* ismale schl pwgtp _marriage2 dis2 good* badstate _cit2 _fod1p27 eiwc_*
                                                              /* as expected, introducing wealth and income has rocked our world
                                                               * many vars now insignificant and adj R^2 more than doubled
                                                               * dropping insignificant vars */

reg self isit sciengrlp age* ismale pwgtp _marriage2 dis2 eiwc_*
drop eiwc_intp_long eiwc_semp_long eiwc_pincp_long eiwc_pincpsquared eiwc_wkhplogged
                                                              //model 1 is below; my first acceptable model with adjusted R^2 of .2205
reg self isit sciengrlp age* ismale pwgtp _marriage2 dis2 eiwc_*

reg self isit age* ismale pwgtp _marriage2 dis2 eiwc_*        /* a predicament; sciengrlp had p ~= .4 but when I exempt it my adjusted R^2 went down .05!
                                                               * also, it really shifted around statistical importance of various vars, so now I got more to do */
drop pwgtp eiwc_pernpsquared eiwc_pernpplogged eiwc_oipsquared eiwc_oiplogged dis2
reg self isit age* ismale _marriage2 eiwc_*                   // now we have a short model
reg self isit age* ismale _marriage2 eiwc_* _race* _cit*      /* checking race and citizenship again...there are a couple significant vars,
                                                               * but adjusted R^2 doesn't even improve .003 so I don't care */
reg self isit age* ismale eiwc*                               /* dropping widow status doesn't significantly move R^squared.
                                                               * this is model 2, the short model with R^2 of about .18
                                                               * all variables have p < .0005 and t > 3.5 */
reg self isit age* ismale                                     // model 3; the short model without eiwc; adj R^2 of .0314
reg self age* ismale                                          /* model 4; exempting variable of interest yields adj R^2 of .0311
                                                               * this implies the explanatory variable has an explanatory power of .0003 */
reg self eiwc*                                                // eiwc alone has an adj R^2 of about .17; but some of these seems to have low
                                                               * explanatory power. can we condense further? */
reg self eiwc_wkhp_long eiwc_pincplogged eiwc_wagplogged eiwc_semplogged eiwc_wkhpsquared
                                                              // made adj R^2 drop significantly; but eiwc_wagplogged has t > 50
reg self eiwc_wagplogged                                      // don't confuse statistical importance for explanatory power; R^2 is nothing and direction flipped
reg self eiwc_wkhp_long eiwc_pincplogged eiwc_semplogged eiwc_wkhpsquared
                                                              /* idk what just happened but it melted my brain a little...
                                                               * when I remove eiwc_wagplogged my adj R^2 jumps to higher than ever: .348!
                                                               * is this an indication that it was a spurious var? I have no idea wut... */
drop eiwc_wagplogged
reg self eiwc*                                                /* new eiwc model has adj R^ of .458! We need to keep all these vars. Don't confuse small B
                                                               * with low explanatory power or importance */
reg self isit age* ismale eiwc*                               // non-financial vars brings it to .477
reg self isit age* ismale eiwc* _race* _cit* _state* _mar*    // bringing back race, state, citizenship, and marriage to see if new eiwc changes their importance
reg self isit age* ismale _cit5 eiwc*                         // worth noting if they are not a citizen; _cit5 = 1
reg self isit age* ismale _cit5 sciengrlp eiwc*               // that's weird...should I keep it?
