state universities have public salary info
universities randomly selected from list here: https://en.wikipedia.org/w/index.php?title=List_of_state_universities_in_the_United_States&oldid=750926928

universities selected by this VBA: NthRowToSheet "state-universities", 25
source code at this location: .\data-science-practice\vb\mUtilies.bas
after random selection, anything with a value for "weirdreason" was thrown out.

An attempt was made to only consider full time professors, not visiting or part time lecturers.

Considered:
Professor
Associate Professor
Assistant Professor

Thrown out:
Visiting Assistant Professor
Senior Lecturer
Adjunct


In general, individual-level salary data is not centrally provided.
The National Center for Education Statistics provides useful aggregated data.
NCES does not provide distrobution inforamtion such as range, skew, or standard deviation.
https://nces.ed.gov/

Many states and universities provide such data themselves.
Illinois and Arkansas have great state-wide initiatives.
The University of California has a very transparent unversity-level initiative.

It may be the case that smaller universities are less able to afford the overhead of transparency initiatives,
or that lower-paying schools do not care to engage in such initiaitives. So the estimated parameters may not estimate the population of all universities,
but only those universities with some sort of open salary or right-to-know initiative.

all salary data is from 2015 or 2016
only investigated econ depts so far (11/25/16)

