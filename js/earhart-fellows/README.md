# earhart-fellows
This js code parses a semi-structure rtf into a csv according to specified parse rules.

See below for use and rules.

## Use

```
npm install
npm start
```

Then read output.csv

Known issues:
1. The first and last record may be messed up.
1. For now, non-adjacent-sponsor records must be handled manually

## Current Parse Rules
This parse logic currently supports parsing these 8 variables:
1. Academic year support was received
1. Graduate institution during the time of the fellowship
1. Area of study/discipline
1. Nominating sponsor(s)
1. Degree and year completed(if known)
1. Career address
1. Email address
1. Whether fellow is deceased

I parse using the following rules:
1. General parsing rules
    1. Parsed blocks are delimited by the string 'Graduate Fellowship(s)'
    1. A non-adjacent-sponsor record is a common edge case which is identified in non-adjacent-sponsor.txt for manual append
    1. If non-adjacent-sponsor records number in the three digits then it will be automated via code update. Perhaps even if half that.
1. Academic Year
    1. Begins the line after the string 'Graduate Fellowship(s)'
    1. Ends at the next line which neither begins with a numeric character nor a seasonal word
1. Graduate Institution
    1. Begins the line after Academic year support was received
    1. Ends on encountering a comma character
1. Area of Study
    1. Begins the character after Graduate Institution
    1. Ends on encountering a comma character
1. Sponsor(s)
    1. Begins the character after Area of Study
    1. Ends on encountering the case-insenstive string match for 'sponsor'
    1. Remove ending characters until a comma is removed
1. Completion Degree
    1. After Sponsor(s) move forward one character. If a comma is encountered, identify the subsequent match as a degree name.
    1. Ends on encountering a valid degree. If no valid degree is found, the identification is canceled.
    1. A valid degree is 'Ph.D.', 'M.A.', 'MA.', or 'M.B.A.'
1. Completion Year
    1. If a completion degree is found and followed by the string ', ', identify the following numeric string as the completion year.
    1. Ends on encountering a non-numeric character
1. Mailing Address
    1. If the case-insensitive string match 'address' is in the parsed block, begin mailing address identification
    1. Ends at the character prior to an email address match, deceased match, or parse block end
    1. If the end is a parse block end, remove ending characters until a numeric character is found. Assume this indicates the end of a zip code.
    1. Trim whitespace and commas from the ends of the result.
1. Email Address
    1. An email address beginning is indicated by a match to the regular expression /[\S]+@[\S]+\.[\S]+/
    1. An email address end is identified as the beginning of the line before the end of a parse block.
    1. Trim whitespace and commas from the ends of the result.
    1. This weird end rule is to support a couple edge cases:
        1. Whitespace characters inside the email address (See entry for ABDELGHANI, Jamila S.)
        1. Multiple email addresses in one parse block (See entry for ALMON JR., Clopper)
1. Deceased
    1. If the case-insensitive string match 'deceased' is in the parsed block, identify this variable's value as true

## Weird Cases to Functionally Accommodate
1. non-adjacent-sponsor: ABBOTT III, Thomas A
1. No institution: DEMPSEY, Erik D.
1. Name not showing up in output: SMART, Theresa M.

## Feature Requests
Have a suggestion for this npm module? Submit an issue.

## Todo...vaguely in order
1. Take rtf file name as a variable
1. Configure split rules without code changes
1. Take non-rtf files as input
