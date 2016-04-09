An exploratory data analysis of the 2014 American Community Survey with a focus on individual level self-employment.
Based in Stata.
This EDA will result in a graduate-level paper available for public review at afterecon.com

I. Steps to Reproduce:
  1) Obtain the source data http://factfinder.census.gov/faces/tableservices/jsf/pages/productview.xhtml?pid=ACS_pums_csv_2014&prodType=document
      a) Click the link reading "United States Population Records"
      b) Documentation is included with the source data files called ss14pus.csv and ss14pusb.csv
  2) Clean the data
      a) Create a folder called data and add the files mentioned in 1.b to that directory
      b) In the same directory as this readme you will find a Stata do file: pums-acs-2014-iae.do
      c) Change the .do file named in 2.b such that every reference to "D:\PUMS\data\" now points to the data folder your created.
      d) Run the .do file!
  3) You have now reproduced the data.
      a) To reproduce the results, simply run the other .do file called analysis.do
      b) By all means, continue with your own analysis! If you find anything interesting feel free to contact me.

II. Working notes:
Note that these working notes are just that - it's not meant to be a well-formed article. See the paper for more thorough analysis.
Be sure to look inside the .do files for "ref", "todo", and other comments.
    Ref comments denote a URL resource discussing a command.
    Todo comments denote a way to improve the current code or analysis.

Below this line are the available individual data variables as per p 30+ of the codebook: http://www2.census.gov/programs-surveys/acs/tech_docs/pums/data_dict/PUMSDataDict14.pdf
    SERIALNO - unique individual identifier
    SPORDER - person number
    ST - state
    PWGTP - person's weight
    AGEP - person's age
    CIT - citizenship status
    COW - class of worker (I could refactor into self employed flag)
    INTP - interest, dividends, and net rental income, past 12 months
    MAR - marital status
    OIP - other income past 12 months
    PAP - public assistance income past 12 months
    SCHL - educational attainment
    SEMP - self-employment income past 12 months
    SEX - male v female
    WAGP - wage or salary income past 12 months
    WKHP - usual hours worked per week past 12 months
    DIS - with or without disability
    ESP - employment status of parents
    FOD1P - field of first-entered degree
    FOD2P - field of secondly-entered degree
    INDP - industry of employment
    NAICSP - NAICS-based industry of employment
    OCCP - occupation recode
    PERNP - total person's earnings
    PINCP - total person's income
    SCIENGP - Field of Degree Science and Engineering Flag – NSF Definition
    SCIENGRLP - Field of Degree Science and Engineering Related Flag – NSF Definition
    SOCP - SOC Occupation code for 2012 and later based on 2010 SOC codes
    RAC1P - Recoded detailed race code

keep serialno sporder st pwgtp agep cit cow intp mar oip pap schl semp sex wagp wkhp dis esp fod1p fod2p indp naicsp occp pernp pincp sciengp sciengrlp socp rac1p
count(X) = 29, before splitting the categoricals. That is the long regression.

First short regression: individual-level IT skill determines self-employment rate
Obviously, a time-series analysis would be an interesting extension of this EDA. Why did I pick 2014? Simply because it is the most recent year for which there is PUMS ACS data.
I can randomly subsample and then conduct visualization of the subsampled data
  ref: http://www.stata.com/support/faqs/statistics/random-samples/
